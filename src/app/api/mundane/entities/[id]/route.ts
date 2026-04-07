import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: entity, error } = await admin
    .from("mundane_entities")
    .select("id, name, entity_type, region, flag_emoji, latitude, longitude, timezone, notes, is_active, created_at")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !entity) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Entity not found" },
      { status: 404 }
    );
  }

  const { data: charts } = await admin
    .from("mundane_entity_charts")
    .select("id, chart_title, chart_type, event_date, event_time, timezone, is_primary, chart_url")
    .eq("entity_id", id)
    .order("is_primary", { ascending: false })
    .order("event_date", { ascending: false });

  const { data: events } = await admin
    .from("mundane_events")
    .select("id, title, event_type, event_date, is_forecast, forecast_confidence")
    .eq("primary_entity_id", id)
    .eq("is_public", true)
    .order("event_date", { ascending: false })
    .limit(10);

  return NextResponse.json({ entity, charts: charts ?? [], events: events ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const body = await req.json() as Partial<{
    name: string;
    entity_type: string;
    region: string;
    flag_emoji: string;
    notes: string;
  }>;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_entities")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, name, entity_type, region, flag_emoji, is_active")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("mundane_entities")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
