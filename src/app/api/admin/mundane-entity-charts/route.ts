import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    entity_id?: string;
    chart_title?: string;
    chart_type?: string;
    event_date?: string;
    event_time?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    chart_url?: string;
    is_primary?: boolean;
  };

  const { entity_id, chart_title, chart_type, event_date } = body;

  if (!entity_id) return NextResponse.json({ error: "entity_id is required" }, { status: 422 });
  if (!chart_title || !chart_title.trim()) return NextResponse.json({ error: "chart_title is required" }, { status: 422 });
  if (!chart_type) return NextResponse.json({ error: "chart_type is required" }, { status: 422 });
  if (!event_date) return NextResponse.json({ error: "event_date is required" }, { status: 422 });

  const VALID_TYPES = ["independence", "constitution", "ingress", "lunation", "eclipse", "transit", "event", "other"] as const;
  if (!(VALID_TYPES as readonly string[]).includes(chart_type)) {
    return NextResponse.json({ error: "Invalid chart_type" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_entity_charts")
    .insert({
      entity_id,
      chart_title: chart_title.trim(),
      chart_type,
      event_date,
      event_time: body.event_time ?? null,
      timezone: body.timezone ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      notes: body.notes ?? null,
      chart_url: body.chart_url ?? null,
      is_primary: body.is_primary ?? false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
