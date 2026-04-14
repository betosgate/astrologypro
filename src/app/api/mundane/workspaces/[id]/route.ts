import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TRADITIONS = ["western", "vedic", "hybrid"] as const;

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

  const { data: workspace, error } = await admin
    .from("mundane_workspaces")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !workspace) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404 },
      { status: 404 }
    );
  }

  // Check access — owner or member
  const isOwner = workspace.owner_id === user.id;
  if (!isOwner) {
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

  // Members list
  const { data: members } = await admin
    .from("mundane_workspace_members")
    .select("id, user_id, role, invited_by, joined_at")
    .eq("workspace_id", id)
    .order("joined_at", { ascending: true });

  return NextResponse.json({ workspace, members: members ?? [] });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: workspace, error: fetchErr } = await admin
    .from("mundane_workspaces")
    .select("id, owner_id")
    .eq("id", id)
    .single();

  if (fetchErr || !workspace) {
    return NextResponse.json(
      { type: "about:blank", title: "Not Found", status: 404 },
      { status: 404 }
    );
  }

  // Must be owner or admin member
  const isOwner = workspace.owner_id === user.id;
  if (!isOwner) {
    const { data: membership } = await admin
      .from("mundane_workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["super_admin", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { type: "about:blank", title: "Forbidden", status: 403, detail: "Only workspace owners or admins can update workspace settings" },
        { status: 403 }
      );
    }
  }

  const body = await req.json() as {
    name?: string;
    description?: string | null;
    tradition?: string;
    settings?: Record<string, unknown>;
  };

  if (body.tradition && !(VALID_TRADITIONS as readonly string[]).includes(body.tradition)) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "tradition must be western, vedic, or hybrid" },
      { status: 422 }
    );
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.description !== undefined) patch.description = body.description?.trim() ?? null;
  if (body.tradition !== undefined) patch.tradition = body.tradition;
  if (body.settings !== undefined) patch.settings = body.settings;

  const { data: updated, error: updateErr } = await admin
    .from("mundane_workspaces")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: updateErr.message },
      { status: 500 }
    );
  }

  await admin.from("mundane_audit_logs").insert({
    workspace_id: id,
    user_id: user.id,
    action: "workspace_updated",
    entity_type: "mundane_workspace",
    entity_id: id,
    diff: patch,
  });

  return NextResponse.json(updated);
}
