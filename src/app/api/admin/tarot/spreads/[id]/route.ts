import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";



export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.from("tarot_spreads").select("*").eq("id", id).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, card_count, priority, thumbnail_url, is_active } = body;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tarot_spreads")
    .update({ name, description, card_count, priority, thumbnail_url: thumbnail_url ?? null, is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ error: "is_active (boolean) is required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tarot_spreads")
    .update({ is_active: body.is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("tarot_spreads").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
