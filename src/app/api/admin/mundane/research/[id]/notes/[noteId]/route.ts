import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id: projectId, noteId } = await params;
  const admin = createAdminClient();

  // Verify project exists
  const { data: project, error: projErr } = await admin
    .from("mundane_research_projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Project not found" },
      { status: 404 }
    );
  }

  const { error } = await admin
    .from("mundane_project_notes")
    .delete()
    .eq("id", noteId)
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
