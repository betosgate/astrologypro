import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: entity, error } = await admin
    .from("mundane_entities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: charts } = await admin
    .from("mundane_entity_charts")
    .select("*")
    .eq("entity_id", id)
    .order("event_date", { ascending: false })
    .order("id", { ascending: false });

  return NextResponse.json({ entity, charts: charts ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as Partial<{
    name: string;
    entity_type: string;
    region: string;
    latitude: number;
    longitude: number;
    timezone: string;
    flag_emoji: string;
    notes: string;
    is_active: boolean;
  }>;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_entities")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Soft-delete by setting is_active = false
  const { error } = await admin
    .from("mundane_entities")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
