import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DEFAULT_MODEL_ID = "sm100000-0000-0000-0000-000000000001";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const entityId = sp.get("entity_id") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const modelId = sp.get("model_id") ?? DEFAULT_MODEL_ID;

  if (!entityId) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "entity_id is required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("entity_stress_scores")
    .select("id, entity_id, scoring_model_id, score_date, stress_score, contributing_factors, computed_at")
    .eq("entity_id", entityId)
    .eq("scoring_model_id", modelId);

  if (from) {
    query = query.gte("score_date", from);
  }
  if (to) {
    query = query.lte("score_date", to);
  }

  query = query
    .order("score_date", { ascending: true })
    .order("id", { ascending: true });

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ scores: data ?? [] });
}

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await req.json() as {
    entity_id?: string;
    score_date?: string;
    scoring_model_id?: string;
  };

  const { entity_id, score_date, scoring_model_id } = body;

  if (!entity_id) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "entity_id is required" },
      { status: 422 }
    );
  }
  if (!score_date) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "score_date is required (YYYY-MM-DD)" },
      { status: 422 }
    );
  }

  const modelId = scoring_model_id ?? DEFAULT_MODEL_ID;
  const admin = createAdminClient();

  // Fetch the scoring model weights
  const { data: model, error: modelError } = await admin
    .from("scoring_models")
    .select("id, weights, is_active")
    .eq("id", modelId)
    .single();

  if (modelError || !model) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Scoring model not found" },
      { status: 404 }
    );
  }

  // Find astro events within ±7 days of score_date for this entity
  const dateObj = new Date(score_date);
  const dateFrom = new Date(dateObj);
  dateFrom.setDate(dateFrom.getDate() - 7);
  const dateTo = new Date(dateObj);
  dateTo.setDate(dateTo.getDate() + 7);

  const fromStr = dateFrom.toISOString().slice(0, 10);
  const toStr = dateTo.toISOString().slice(0, 10);

  const { data: nearbyEvents } = await admin
    .from("mundane_events")
    .select("id, title, event_type, event_date")
    .eq("primary_entity_id", entity_id)
    .gte("event_date", fromStr)
    .lte("event_date", toStr);

  const weights = model.weights as Record<string, number>;

  // Map event types to weight keys
  function weightKeyForEvent(eventType: string): string {
    if (eventType === "eclipse") return "eclipse_hit";
    if (eventType === "ingress") return "ingress_angular";
    if (eventType === "forecast") return "forecast_open";
    return "multiple_planets";
  }

  const events = nearbyEvents ?? [];
  const contributingFactors: Array<{ event_id: string; title: string; event_type: string; event_date: string; weight: number }> = [];
  let rawScore = 0;

  for (const ev of events) {
    const key = weightKeyForEvent(ev.event_type);
    const w = weights[key] ?? 1.0;
    rawScore += w;
    contributingFactors.push({
      event_id: ev.id,
      title: ev.title,
      event_type: ev.event_type,
      event_date: ev.event_date,
      weight: w,
    });
  }

  // Apply leader_chart_hit bonus if there are multiple event types
  const uniqueTypes = new Set(events.map((e) => e.event_type));
  if (uniqueTypes.size > 1) {
    rawScore += weights["leader_chart_hit"] ?? 1.0;
  }

  // Cap at 10
  const stressScore = Math.min(10, Math.round(rawScore * 100) / 100);

  // Upsert the score
  const { data: upserted, error: upsertError } = await admin
    .from("entity_stress_scores")
    .upsert(
      {
        entity_id,
        scoring_model_id: modelId,
        score_date,
        stress_score: stressScore,
        contributing_factors: contributingFactors,
        computed_at: new Date().toISOString(),
      },
      { onConflict: "entity_id,scoring_model_id,score_date" }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: upsertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(upserted, { status: 201 });
}
