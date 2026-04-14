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

const VALID_SOURCE_TYPES = ["market", "weather", "agriculture", "social", "news", "custom"] as const;
type SourceType = (typeof VALID_SOURCE_TYPES)[number];

// ─── Types ─────────────────────────────────────────────────────────────────────

type DataSource = {
  id: string;
  name: string;
  source_type: string;
  provider: string | null;
  fetch_interval_hours: number;
  last_fetched_at: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
};

type ExternalDataPoint = {
  id: string;
  source_id: string;
  data_type: string;
  symbol: string | null;
  recorded_at: string;
  value: number | null;
  change_percent: number | null;
};

type Correlation = {
  id: string;
  data_source_id: string;
  astro_event_type: string;
  planet: string | null;
  sign: string | null;
  correlation_coefficient: number | null;
  sample_count: number | null;
  date_range_start: string | null;
  date_range_end: string | null;
  significance_level: number | null;
  notes: string | null;
  computed_at: string;
};

// ─── GET — dashboard data ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const sp = req.nextUrl.searchParams;
  const sourceTypeParam = sp.get("source_type") ?? "all";

  const admin = createAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  // 1. Data sources — all active
  let sourcesQuery = admin
    .from("mundane_data_sources")
    .select("id, name, source_type, provider, fetch_interval_hours, last_fetched_at, is_active, config, created_at")
    .eq("is_active", true)
    .order("source_type", { ascending: true })
    .order("name", { ascending: true });

  if (sourceTypeParam !== "all" && (VALID_SOURCE_TYPES as readonly string[]).includes(sourceTypeParam)) {
    sourcesQuery = sourcesQuery.eq("source_type", sourceTypeParam as SourceType);
  }

  const { data: sourcesData, error: sourcesError } = await sourcesQuery;
  if (sourcesError) {
    return rfc9457(500, "Internal Server Error", sourcesError.message);
  }

  const sources = (sourcesData ?? []) as DataSource[];

  // 2. Recent external data — last 30 days, one row per (source_id, symbol, recorded_at)
  const sourceIds = sources.map((s) => s.id);
  let recentData: ExternalDataPoint[] = [];

  if (sourceIds.length > 0) {
    const { data: edData, error: edError } = await admin
      .from("mundane_external_data")
      .select("id, source_id, data_type, symbol, recorded_at, value, change_percent")
      .in("source_id", sourceIds)
      .gte("recorded_at", thirtyDaysAgoStr)
      .order("recorded_at", { ascending: false })
      .order("source_id", { ascending: true })
      .limit(500);

    if (edError) {
      return rfc9457(500, "Internal Server Error", edError.message);
    }
    recentData = (edData ?? []) as ExternalDataPoint[];
  }

  // 3. Top 5 correlations by |correlation_coefficient| DESC
  const { data: corrData, error: corrError } = await admin
    .from("mundane_correlations")
    .select(
      "id, data_source_id, astro_event_type, planet, sign, correlation_coefficient, sample_count, date_range_start, date_range_end, significance_level, notes, computed_at"
    )
    .order("computed_at", { ascending: false })
    .limit(50); // fetch more, sort client-side by |coeff|

  if (corrError) {
    return rfc9457(500, "Internal Server Error", corrError.message);
  }

  const allCorrelations = (corrData ?? []) as Correlation[];
  const topCorrelations = allCorrelations
    .sort((a, b) => Math.abs(b.correlation_coefficient ?? 0) - Math.abs(a.correlation_coefficient ?? 0))
    .slice(0, 5);

  // Group recent data by source_id
  const recentDataBySource: Record<string, ExternalDataPoint[]> = {};
  for (const dp of recentData) {
    if (!recentDataBySource[dp.source_id]) {
      recentDataBySource[dp.source_id] = [];
    }
    recentDataBySource[dp.source_id].push(dp);
  }

  return NextResponse.json({
    data_sources: sources,
    recent_data_by_source: recentDataBySource,
    top_correlations: topCorrelations,
    source_type_filter: sourceTypeParam,
  });
}
