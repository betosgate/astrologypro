import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["super_admin", "admin", "astrologer", "researcher", "editor", "viewer"] as const;

type Params = { params: Promise<{ id: string }> };

async function resolveAccess(workspaceId: string, userId: string) {
  const admin = createAdminClient();

  const { data: workspace } = await admin
    .from("mundane_workspaces")
    .select("id, owner_id")
    .eq("id", workspaceId)
    .single();

  if (!workspace) return { workspace: null, isOwner: false, isAdmin: false };

  const isOwner = workspace.owner_id === userId;
  if (isOwner) return { workspace, isOwner: true, isAdmin: true };

  const { data: membership } = await admin
    .from("mundane_workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  const isAdmin = !!membership && ["super_admin", "admin"].includes(membership.role);
  const isMember = !!membership;

  return { workspace, isOwner, isAdmin, isMember };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const access = await resolveAccess(id, user.id);

  if (!access.workspace) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404 },
      { status: 404 }
    );
  }
  if (!access.isOwner && !access.isMember) {
    return NextResponse.json(
      { type: "about:blank", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  const { data: members, error } = await admin
    .from("mundane_workspace_members")
    .select("id, user_id, role, invited_by, joined_at")
    .eq("workspace_id", id)
    .order("joined_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ members: members ?? [] });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const access = await resolveAccess(id, user.id);

  if (!access.workspace) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404 },
      { status: 404 }
    );
  }
  if (!access.isAdmin) {
    return NextResponse.json(
      { type: "about:blank", title: "Forbidden", status: 403, detail: "Only workspace owners or admins can invite members" },
      { status: 403 }
    );
  }

  const body = await req.json() as { user_id?: string; role?: string };

  if (!body.user_id?.trim()) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "user_id is required" },
      { status: 422 }
    );
  }
  const role = body.role ?? "viewer";
  if (!(VALID_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: `role must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_workspace_members")
    .insert({
      workspace_id: id,
      user_id: body.user_id.trim(),
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { type: "about:blank", title: "Conflict", status: 409, detail: "User is already a member of this workspace" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  await admin.from("mundane_audit_logs").insert({
    workspace_id: id,
    user_id: user.id,
    action: "member_invited",
    entity_type: "mundane_workspace_members",
    entity_id: data.id,
    diff: { invited_user_id: body.user_id, role },
  });

  return NextResponse.json(data, { status: 201 });
}
