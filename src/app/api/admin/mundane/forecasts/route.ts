import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_CONFIDENCE = ["high", "medium", "low", "speculative"] as const;
const VALID_OUTCOME_STATUS = ["open", "confirmed", "partially_confirmed", "invalidated", "expired"] as const;

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const entityId = sp.get("entity_id") ?? "";
  const outcomeStatus = sp.get("outcome_status") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_forecasts")
    .select(
      "id, title, entity_id, leader_id, forecast_period_start, forecast_period_end, event_categories, confidence_level, outcome_status, outcome_notes, outcome_reviewed_at, is_public, created_at",
      { count: "exact" }
    );

  if (entityId) {
    query = query.eq("entity_id", entityId);
  }
  if (outcomeStatus && (VALID_OUTCOME_STATUS as readonly string[]).includes(outcomeStatus)) {
    query = query.eq("outcome_status", outcomeStatus);
  }

  query = query
    .order("forecast_period_start", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    forecasts: data ?? [],
    total: count ?? 0,
    page,
    hasMore: offset + limit < (count ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json() as {
    title?: string;
    entity_id?: string | null;
    leader_id?: string | null;
    forecast_period_start?: string;
    forecast_period_end?: string | null;
    astrology_basis?: string;
    narrative_summary?: string;
    event_categories?: string[];
    confidence_level?: string | null;
    is_public?: boolean;
  };

  if (!body.title?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "title is required" },
      { status: 422 }
    );
  }
  if (!body.forecast_period_start) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "forecast_period_start is required" },
      { status: 422 }
    );
  }
  if (!body.astrology_basis?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "astrology_basis is required" },
      { status: 422 }
    );
  }
  if (!body.narrative_summary?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "narrative_summary is required" },
      { status: 422 }
    );
  }
  if (
    body.confidence_level &&
    !(VALID_CONFIDENCE as readonly string[]).includes(body.confidence_level)
  ) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "confidence_level must be one of high, medium, low, speculative" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_forecasts")
    .insert({
      title: body.title.trim(),
      entity_id: body.entity_id ?? null,
      leader_id: body.leader_id ?? null,
      forecast_period_start: body.forecast_period_start,
      forecast_period_end: body.forecast_period_end ?? null,
      astrology_basis: body.astrology_basis.trim(),
      narrative_summary: body.narrative_summary.trim(),
      event_categories: body.event_categories ?? [],
      confidence_level: body.confidence_level ?? null,
      outcome_status: "open",
      is_public: body.is_public ?? false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
