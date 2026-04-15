import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_EVENT_TYPES = [
  "ingress", "lunation", "eclipse", "conjunction", "opposition", "station",
  "retrograde", "direct", "great_conjunction", "return", "solar_arc", "custom",
] as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const eventType = sp.get("event_type") ?? "";
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "50", 10)));

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_astro_events")
    .select("id, title, event_type, planet_primary, planet_secondary, sign, event_datetime_utc, timezone_display, notes, is_verified, created_at")
    .eq("is_verified", true);

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
    .order("event_datetime_utc", { ascending: true })
    .limit(limit);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ events: data ?? [] });
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
    event_type?: string;
    planet_primary?: string | null;
    planet_secondary?: string | null;
    sign?: string | null;
    event_datetime_utc?: string;
    timezone_display?: string | null;
    notes?: string | null;
    is_verified?: boolean;
  };

  if (!body.title?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "title is required" },
      { status: 422 }
    );
  }
  if (!body.event_datetime_utc) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "event_datetime_utc is required" },
      { status: 422 }
    );
  }
  if (!body.event_type || !(VALID_EVENT_TYPES as readonly string[]).includes(body.event_type)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: `event_type must be one of: ${VALID_EVENT_TYPES.join(", ")}` },
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
      is_verified: body.is_verified ?? false,
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
