import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_EVENT_TYPES = [
  "ingress", "lunation", "eclipse", "conjunction", "opposition", "station",
  "retrograde", "direct", "great_conjunction", "return", "solar_arc", "custom",
] as const;

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const eventType = sp.get("event_type") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_astro_events")
    .select("*", { count: "exact" });

  if (from) {
    query = query.gte("event_datetime_utc", from);
  }
  if (to) {
    query = query.lte("event_datetime_utc", to);
  }
  if (eventType && (VALID_EVENT_TYPES as readonly string[]).includes(eventType)) {
    query = query.eq("event_type", eventType);
  }

  query = query
    .order("event_datetime_utc", { ascending: false })
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
    event_type?: string;
    planet_primary?: string | null;
    planet_secondary?: string | null;
    sign?: string | null;
    event_datetime_utc?: string;
    timezone_display?: string;
    notes?: string | null;
    is_verified?: boolean;
  };

  if (!body.title?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "title is required" },
      { status: 422 }
    );
  }
  if (!body.event_type || !(VALID_EVENT_TYPES as readonly string[]).includes(body.event_type)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "event_type is required and must be valid" },
      { status: 422 }
    );
  }
  if (!body.event_datetime_utc) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "event_datetime_utc is required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_astro_events")
    .insert({
      title: body.title.trim(),
      event_type: body.event_type,
      planet_primary: body.planet_primary ?? null,
      planet_secondary: body.planet_secondary ?? null,
      sign: body.sign ?? null,
      event_datetime_utc: body.event_datetime_utc,
      timezone_display: body.timezone_display ?? "UTC",
      notes: body.notes ?? null,
      is_verified: body.is_verified ?? true,
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
