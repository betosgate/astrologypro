import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["super_admin", "admin", "astrologer", "researcher", "editor", "viewer"] as const;

type Params = { params: Promise<{ id: string; userId: string }> };

async function resolveAdmin(workspaceId: string, callerId: string) {
  const admin = createAdminClient();

  const { data: workspace } = await admin
    .from("mundane_workspaces")
    .select("id, owner_id")
    .eq("id", workspaceId)
    .single();

  if (!workspace) return { workspace: null, isAdmin: false };

  if (workspace.owner_id === callerId) return { workspace, isAdmin: true };

  const { data: membership } = await admin
    .from("mundane_workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", callerId)
    .maybeSingle();

  const isAdmin = !!membership && ["super_admin", "admin"].includes(membership.role);
  return { workspace, isAdmin };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id, userId } = await params;
  const { workspace, isAdmin } = await resolveAdmin(id, user.id);

  if (!workspace) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404 },
      { status: 404 }
    );
  }
  if (!isAdmin) {
    return NextResponse.json(
      { type: "about:blank", title: "Forbidden", status: 403, detail: "Only workspace owners or admins can change member roles" },
      { status: 403 }
    );
  }

  // Cannot change the owner's role via this endpoint
  if (userId === workspace.owner_id) {
    return NextResponse.json(
      { type: "about:blank", title: "Forbidden", status: 403, detail: "Cannot change the workspace owner's role" },
      { status: 403 }
    );
  }

  const body = await req.json() as { role?: string };
  if (!body.role || !(VALID_ROLES as readonly string[]).includes(body.role)) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: `role must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_workspace_members")
    .update({ role: body.role })
    .eq("workspace_id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  await admin.from("mundane_audit_logs").insert({
    workspace_id: id,
    user_id: user.id,
    action: "member_role_changed",
    entity_type: "mundane_workspace_members",
    entity_id: data.id,
    diff: { target_user_id: userId, new_role: body.role },
  });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id, userId } = await params;
  const { workspace, isAdmin } = await resolveAdmin(id, user.id);

  if (!workspace) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404 },
      { status: 404 }
    );
  }
  if (!isAdmin) {
    return NextResponse.json(
      { type: "about:blank", title: "Forbidden", status: 403, detail: "Only workspace owners or admins can remove members" },
      { status: 403 }
    );
  }

  // Cannot remove the owner
  if (userId === workspace.owner_id) {
    return NextResponse.json(
      { type: "about:blank", title: "Forbidden", status: 403, detail: "Cannot remove the workspace owner" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("mundane_workspace_members")
    .delete()
    .eq("workspace_id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  await admin.from("mundane_audit_logs").insert({
    workspace_id: id,
    user_id: user.id,
    action: "member_removed",
    entity_type: "mundane_workspace_members",
    diff: { removed_user_id: userId },
  });

  return new NextResponse(null, { status: 204 });
}
