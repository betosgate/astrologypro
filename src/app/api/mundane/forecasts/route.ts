import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const outcomeStatus = sp.get("outcome_status") ?? "";
  const entityId = sp.get("entity_id") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  const VALID_OUTCOME_STATUS = ["open", "confirmed", "partially_confirmed", "invalidated", "expired"] as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_forecasts")
    .select(
      "id, title, entity_id, leader_id, forecast_period_start, forecast_period_end, event_categories, confidence_level, outcome_status, is_public, created_at",
      { count: "exact" }
    )
    .eq("is_public", true);

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
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    forecast_type?: string;
    forecast_period_start?: string;
    forecast_period_end?: string;
    content?: string;
    astrology_basis?: string | null;
    narrative_summary?: string | null;
    event_categories?: string[];
    confidence_level?: string | null;
    signal_strength?: string | null;
    is_public?: boolean;
  };

  if (!body.title?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "title is required" },
      { status: 422 }
    );
  }
  if (!body.forecast_period_start || !body.forecast_period_end) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "forecast_period_start and forecast_period_end are required" },
      { status: 422 }
    );
  }
  if (!body.content?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "content is required" },
      { status: 422 }
    );
  }

  const VALID_TYPES = ["political", "economic", "weather", "social", "market", "general"] as const;
  const forecastType = body.forecast_type ?? "general";
  if (!(VALID_TYPES as readonly string[]).includes(forecastType)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "forecast_type is invalid" },
      { status: 422 }
    );
  }

  const VALID_CONFIDENCE = ["high", "medium", "low", "speculative"] as const;
  if (body.confidence_level && !(VALID_CONFIDENCE as readonly string[]).includes(body.confidence_level)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "confidence_level must be high, medium, low, or speculative" },
      { status: 422 }
    );
  }

  const VALID_SIGNAL = ["low", "medium", "high", "critical"] as const;
  if (body.signal_strength && !(VALID_SIGNAL as readonly string[]).includes(body.signal_strength)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "signal_strength must be low, medium, high, or critical" },
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
      forecast_type: forecastType,
      forecast_period_start: body.forecast_period_start,
      forecast_period_end: body.forecast_period_end,
      content: body.content.trim(),
      astrology_basis: body.astrology_basis ?? null,
      narrative_summary: body.narrative_summary ?? null,
      event_categories: body.event_categories ?? [],
      confidence_level: body.confidence_level ?? null,
      signal_strength: body.signal_strength ?? null,
      outcome_status: "open",
      is_public: body.is_public ?? false,
      is_published: false,
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
