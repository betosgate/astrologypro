import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_EVENT_TYPES = [
  "historical", "forecast", "ingress", "eclipse", "return", "transit_hit",
  "election", "conflict", "economic", "weather", "other",
] as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const entityId = sp.get("entity_id") ?? "";
  const type = sp.get("type") ?? "";
  const dateFrom = sp.get("date_from") ?? "";
  const dateTo = sp.get("date_to") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_events")
    .select(
      "id, title, event_type, event_date, event_time, location, is_forecast, forecast_confidence, primary_entity_id, tags",
      { count: "exact" }
    )
    .eq("is_public", true);

  if (entityId) {
    query = query.eq("primary_entity_id", entityId);
  }
  if (type) {
    query = query.eq("event_type", type);
  }
  if (dateFrom) {
    query = query.gte("event_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("event_date", dateTo);
  }

  query = query
    .order("event_date", { ascending: false })
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
    events: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json() as {
    title?: string;
    event_type?: string;
    description?: string;
    event_date?: string;
    event_time?: string;
    location?: string;
    primary_entity_id?: string;
    is_forecast?: boolean;
    forecast_confidence?: string;
    tags?: string[];
    is_public?: boolean;
  };

  const { title, event_type, description, event_date, event_time, location, primary_entity_id, is_forecast, forecast_confidence, tags, is_public } = body;

  if (!title?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "title is required" },
      { status: 422 }
    );
  }
  if (!event_type || !(VALID_EVENT_TYPES as readonly string[]).includes(event_type)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "event_type is required and must be valid" },
      { status: 422 }
    );
  }
  if (!event_date) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "event_date is required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_events")
    .insert({
      title: title.trim(),
      event_type,
      description: description ?? null,
      event_date,
      event_time: event_time ?? null,
      location: location ?? null,
      primary_entity_id: primary_entity_id ?? null,
      is_forecast: is_forecast ?? false,
      forecast_confidence: forecast_confidence ?? null,
      tags: tags ?? [],
      is_public: is_public ?? false,
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
