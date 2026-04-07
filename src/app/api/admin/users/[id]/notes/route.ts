import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUserObj = await getAdminUser();
  const adminEmail = adminUserObj?.email ?? null;
  if (!adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("admin_user_notes")
    .select("id, note, role, created_by, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUserObj = await getAdminUser();
  const adminEmail = adminUserObj?.email ?? null;
  if (!adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { note, role } = await req.json();
  if (!note?.trim()) return NextResponse.json({ error: "Note is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_user_notes")
    .insert({ user_id: id, note: note.trim(), role: role ?? null, created_by: adminEmail })
    .select("id, note, role, created_by, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}
