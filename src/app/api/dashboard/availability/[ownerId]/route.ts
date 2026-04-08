import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getDivinerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return data?.id ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ownerId: string }> }) {
  const divinerId = await getDivinerId();
  if (!divinerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ownerId: id } = await params;
  const body = await req.json();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("availability_templates")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", divinerId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ ownerId: string }> }) {
  const divinerId = await getDivinerId();
  if (!divinerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ownerId: id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("availability_templates")
    .delete()
    .eq("id", id)
    .eq("owner_id", divinerId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
