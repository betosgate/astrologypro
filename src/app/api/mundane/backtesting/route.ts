import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ForecastRow = {
  id: string;
  entity_id: string | null;
  outcome_status: string;
};

type EntityResult = {
  entity_id: string;
  tested: number;
  correct: number;
  accuracy_score: number;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isCorrect(outcomeStatus: string): boolean {
  return outcomeStatus === "confirmed" || outcomeStatus === "partially_confirmed";
}

function rfc9457(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.com/${status}`, title, status, detail },
    { status }
  );
}

// ─── GET — list backtest runs ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const VALID_STATUS = ["pending", "running", "completed", "failed"] as const;
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_backtest_runs")
    .select(
      "id, name, description, hypothesis, entity_ids, date_range_start, date_range_end, status, accuracy_score, total_forecasts_tested, correct_predictions, created_at",
      { count: "exact" }
    );

  if (status && (VALID_STATUS as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  query = query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return rfc9457(500, "Internal Server Error", error.message);
  }

  return NextResponse.json({
    runs: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}

// ─── POST — create + run backtest ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return rfc9457(403, "Forbidden", "Admin access required");

  const body = await req.json() as {
    name?: string;
    description?: string;
    hypothesis?: string;
    entity_ids?: string[];
    date_range_start?: string;
    date_range_end?: string;
    event_types?: string[];
    scoring_model_id?: string | null;
  };

  if (!body.name?.trim()) return rfc9457(422, "Validation Error", "name is required");
  if (!body.hypothesis?.trim()) return rfc9457(422, "Validation Error", "hypothesis is required");
  if (!body.date_range_start) return rfc9457(422, "Validation Error", "date_range_start is required");
  if (!body.date_range_end) return rfc9457(422, "Validation Error", "date_range_end is required");
  if (body.date_range_start > body.date_range_end) {
    return rfc9457(422, "Validation Error", "date_range_start must be before date_range_end");
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Insert the run record in 'running' state
  const { data: run, error: insertError } = await admin
    .from("mundane_backtest_runs")
    .insert({
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      hypothesis: body.hypothesis.trim(),
      entity_ids: body.entity_ids ?? [],
      date_range_start: body.date_range_start,
      date_range_end: body.date_range_end,
      event_types: body.event_types ?? [],
      scoring_model_id: body.scoring_model_id ?? null,
      status: "running",
      started_at: now,
      created_by: adminUser.id,
    })
    .select()
    .single();

  if (insertError) return rfc9457(500, "Internal Server Error", insertError.message);

  // ── Run the backtest synchronously ──────────────────────────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let forecastQuery: any = admin
      .from("mundane_forecasts")
      .select("id, entity_id, outcome_status")
      .gte("forecast_period_start", body.date_range_start)
      .lte("forecast_period_start", body.date_range_end)
      .not("outcome_status", "eq", "open");

    // Filter by entity_ids if provided
    const entityIds = body.entity_ids ?? [];
    if (entityIds.length > 0) {
      forecastQuery = forecastQuery.in("entity_id", entityIds);
    }

    const { data: forecasts, error: forecastError } = await forecastQuery;

    if (forecastError) throw new Error(forecastError.message);

    const rows = (forecasts ?? []) as ForecastRow[];
    const totalTested = rows.length;
    const correctPredictions = rows.filter((f) => isCorrect(f.outcome_status)).length;
    const accuracyScore =
      totalTested > 0
        ? Math.round((correctPredictions / totalTested) * 10000) / 100
        : 0;

    // Group by entity
    const entityMap = new Map<string, { tested: number; correct: number }>();
    for (const f of rows) {
      const eid = f.entity_id ?? "__none__";
      const bucket = entityMap.get(eid) ?? { tested: 0, correct: 0 };
      bucket.tested++;
      if (isCorrect(f.outcome_status)) bucket.correct++;
      entityMap.set(eid, bucket);
    }

    const byEntity: EntityResult[] = Array.from(entityMap.entries()).map(([eid, b]) => ({
      entity_id: eid,
      tested: b.tested,
      correct: b.correct,
      accuracy_score: b.tested > 0 ? Math.round((b.correct / b.tested) * 10000) / 100 : 0,
    }));

    const results = {
      accuracy_score: accuracyScore,
      tested: totalTested,
      correct: correctPredictions,
      by_entity: byEntity,
    };

    const completedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("mundane_backtest_runs")
      .update({
        status: "completed",
        results,
        accuracy_score: accuracyScore,
        total_forecasts_tested: totalTested,
        correct_predictions: correctPredictions,
        completed_at: completedAt,
      })
      .eq("id", run.id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await admin
      .from("mundane_backtest_runs")
      .update({ status: "failed", error_message: message, completed_at: new Date().toISOString() })
      .eq("id", run.id);

    return rfc9457(500, "Internal Server Error", message);
  }
}
