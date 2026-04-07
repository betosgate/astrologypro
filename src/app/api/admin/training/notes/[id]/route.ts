import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/training/notes/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "content is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: note } = await admin
    .from("training_notes")
    .select("id, created_by")
    .eq("id", id)
    .maybeSingle();

  if (!note) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  if (note.created_by !== user.email) {
    return NextResponse.json(
      { error: "You can only edit notes you created." },
      { status: 403 }
    );
  }

  const { data, error } = await admin
    .from("training_notes")
    .update({ content: body.content.trim() })
    .eq("id", id)
    .select("id, entity_type, entity_id, content, created_by, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data });
}


// DELETE /api/admin/training/notes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const admin = createAdminClient();
  const { error } = await admin
    .from("training_notes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
