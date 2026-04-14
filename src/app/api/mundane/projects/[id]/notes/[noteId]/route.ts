import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/mundane/projects/:id/notes/:noteId
 * Delete a note from a research project. Only the note author can delete.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id: projectId, noteId } = await params;
  const admin = createAdminClient();

  // Verify note exists and belongs to caller
  const { data: note, error: noteErr } = await admin
    .from("mundane_project_notes")
    .select("id, created_by, project_id")
    .eq("id", noteId)
    .eq("project_id", projectId)
    .single();

  if (noteErr || !note) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Note not found" },
      { status: 404 }
    );
  }

  const n = note as { id: string; created_by: string; project_id: string };
  if (n.created_by !== user.id) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Only the note author can delete this note" },
      { status: 403 }
    );
  }

  const { error } = await admin
    .from("mundane_project_notes")
    .delete()
    .eq("id", noteId)
    .eq("project_id", projectId)
    .eq("created_by", user.id);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
