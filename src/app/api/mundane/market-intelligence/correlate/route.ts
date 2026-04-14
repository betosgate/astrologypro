import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function rfc9457(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.com/${status}`, title, status, detail },
    { status }
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type CorrelateBody = {
  source_id: string;
  astro_event_type: string;
  planet?: string;
  date_range_start: string;
  date_range_end: string;
};

type AstroEvent = {
  event_date: string;
  event_type: string;
  planet_primary?: string | null;
};

type ExternalDataPoint = {
  recorded_at: string;
  value: number | null;
  change_percent: number | null;
};

// ─── Correlation computation ───────────────────────────────────────────────────

/**
 * Simple Pearson-like correlation:
 * - Collect change_percent values on astro event dates (event group)
 * - Collect change_percent values on non-event dates (baseline group)
 * - correlation_coefficient = avg(event) - avg(baseline), normalized to [-1, 1]
 *   by dividing by pooled std-dev (or clamped if std-dev is 0)
 *
 * significance_level = fraction of event dates with data (0–1).
 */
function computeCorrelation(
  eventDates: Set<string>,
  allDataPoints: ExternalDataPoint[]
): { coefficient: number; sampleCount: number; significance: number } {
  const eventValues: number[] = [];
  const baselineValues: number[] = [];

  for (const dp of allDataPoints) {
    if (dp.change_percent === null) continue;
    const v = Number(dp.change_percent);
    if (isNaN(v)) continue;
    if (eventDates.has(dp.recorded_at)) {
      eventValues.push(v);
    } else {
      baselineValues.push(v);
    }
  }

  if (eventValues.length === 0) {
    return { coefficient: 0, sampleCount: 0, significance: 0 };
  }

  const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = (arr: number[], m: number) =>
    arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;

  const eventMean = mean(eventValues);
  const baseMean = baselineValues.length > 0 ? mean(baselineValues) : 0;

  const eventVar = variance(eventValues, eventMean);
  const baseVar = baselineValues.length > 0 ? variance(baselineValues, baseMean) : 0;

  const pooledStd = Math.sqrt((eventVar + baseVar) / 2) || 1;
  const rawDiff = eventMean - baseMean;

  // Clamp coefficient to [-1, 1]
  const coefficient = Math.max(-1, Math.min(1, rawDiff / pooledStd));

  // significance_level = coverage (fraction of event dates that had data)
  const significance = Math.min(1, eventValues.length / Math.max(1, eventDates.size));

  return {
    coefficient: Math.round(coefficient * 10000) / 10000,
    sampleCount: eventValues.length,
    significance: Math.round(significance * 10000) / 10000,
  };
}

// ─── POST — compute correlation ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  let body: CorrelateBody;
  try {
    body = (await req.json()) as CorrelateBody;
  } catch {
    return rfc9457(422, "Unprocessable Entity", "Invalid JSON body");
  }

  const { source_id, astro_event_type, planet, date_range_start, date_range_end } = body;

  // ─── Validate inputs ───────────────────────────────────────────────────────
  if (!source_id || typeof source_id !== "string") {
    return rfc9457(422, "Unprocessable Entity", "source_id is required");
  }
  if (!astro_event_type || typeof astro_event_type !== "string") {
    return rfc9457(422, "Unprocessable Entity", "astro_event_type is required");
  }
  if (!date_range_start || !date_range_end) {
    return rfc9457(422, "Unprocessable Entity", "date_range_start and date_range_end are required");
  }
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(date_range_start) || !dateRe.test(date_range_end)) {
    return rfc9457(422, "Unprocessable Entity", "Dates must be YYYY-MM-DD format");
  }
  if (date_range_start >= date_range_end) {
    return rfc9457(422, "Unprocessable Entity", "date_range_start must be before date_range_end");
  }

  const admin = createAdminClient();

  // ─── Verify data source exists ─────────────────────────────────────────────
  const { data: dsData, error: dsError } = await admin
    .from("mundane_data_sources")
    .select("id, name")
    .eq("id", source_id)
    .maybeSingle();

  if (dsError) return rfc9457(500, "Internal Server Error", dsError.message);
  if (!dsData) return rfc9457(404, "Not Found", `Data source ${source_id} not found`);

  // ─── Fetch astro events in date range ─────────────────────────────────────
  let eventsQuery = admin
    .from("mundane_events")
    .select("event_date, event_type, planet_primary")
    .gte("event_date", date_range_start)
    .lte("event_date", date_range_end)
    .eq("event_type", astro_event_type);

  if (planet && typeof planet === "string" && planet.trim()) {
    eventsQuery = eventsQuery.eq("planet_primary", planet.trim());
  }

  const { data: eventsData, error: eventsError } = await eventsQuery;
  if (eventsError) return rfc9457(500, "Internal Server Error", eventsError.message);

  const events = (eventsData ?? []) as AstroEvent[];
  const eventDates = new Set(events.map((e) => e.event_date));

  // ─── Fetch external data in date range ────────────────────────────────────
  const { data: edData, error: edError } = await admin
    .from("mundane_external_data")
    .select("recorded_at, value, change_percent")
    .eq("source_id", source_id)
    .gte("recorded_at", date_range_start)
    .lte("recorded_at", date_range_end)
    .order("recorded_at", { ascending: true });

  if (edError) return rfc9457(500, "Internal Server Error", edError.message);

  const dataPoints = (edData ?? []) as ExternalDataPoint[];

  // ─── Compute correlation ───────────────────────────────────────────────────
  const { coefficient, sampleCount, significance } = computeCorrelation(eventDates, dataPoints);

  // ─── Persist result ────────────────────────────────────────────────────────
  const insertPayload = {
    data_source_id: source_id,
    astro_event_type,
    planet: planet?.trim() || null,
    sign: null,
    correlation_coefficient: coefficient,
    sample_count: sampleCount,
    date_range_start,
    date_range_end,
    significance_level: significance,
    notes: `Computed from ${events.length} event dates, ${dataPoints.length} data points`,
    computed_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertError } = await admin
    .from("mundane_correlations")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) return rfc9457(500, "Internal Server Error", insertError.message);

  return NextResponse.json({ correlation: inserted }, { status: 201 });
}
