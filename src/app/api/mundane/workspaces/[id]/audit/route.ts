import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Verify access — owner or member
  const { data: workspace } = await admin
    .from("mundane_workspaces")
    .select("id, owner_id")
    .eq("id", id)
    .single();

  if (!workspace) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404 },
      { status: 404 }
    );
  }

  if (workspace.owner_id !== user.id) {
    const { data: membership } = await admin
      .from("mundane_workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { type: "about:blank", title: "Forbidden", status: 403 },
        { status: 403 }
      );
    }
  }

  const { data: logs, error } = await admin
    .from("mundane_audit_logs")
    .select("id, action, entity_type, entity_id, user_id, diff, created_at")
    .eq("workspace_id", id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ logs: logs ?? [] });
}
