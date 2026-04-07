import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: entity, error } = await admin
    .from("mundane_entities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !entity) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Entity not found" },
      { status: 404 }
    );
  }

  const { data: charts } = await admin
    .from("mundane_entity_charts")
    .select("*")
    .eq("entity_id", id)
    .order("event_date", { ascending: false })
    .order("id", { ascending: false });

  const { data: events } = await admin
    .from("mundane_events")
    .select("id, title, event_type, event_date, is_forecast, forecast_confidence, is_public")
    .eq("primary_entity_id", id)
    .order("event_date", { ascending: false })
    .limit(20);

  return NextResponse.json({ entity, charts: charts ?? [], events: events ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
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
    region: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    flag_emoji: string | null;
    notes: string | null;
    is_active: boolean;
  }>;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_entities")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
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
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Soft-delete
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
