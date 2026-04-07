import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** DELETE /api/admin/users/[id]/notes/[noteId] — any admin can delete */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const adminUserObj = await getAdminUser();
  const adminEmail = adminUserObj?.email ?? null;
  if (!adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, noteId } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("admin_user_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

/** PATCH /api/admin/users/[id]/notes/[noteId] — only the creator can edit */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const adminUserObj = await getAdminUser();
  const adminEmail = adminUserObj?.email ?? null;
  if (!adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, noteId } = await params;
  const { note } = await req.json();
  if (!note?.trim()) return NextResponse.json({ error: "Note text is required" }, { status: 400 });

  const admin = createAdminClient();

  // Verify the note belongs to this user AND was created by this admin
  const { data: existing } = await admin
    .from("admin_user_notes")
    .select("id, created_by")
    .eq("id", noteId)
    .eq("user_id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  if (existing.created_by !== adminEmail) {
    return NextResponse.json({ error: "You can only edit your own notes" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("admin_user_notes")
    .update({ note: note.trim() })
    .eq("id", noteId)
    .select("id, note, role, created_by, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}
