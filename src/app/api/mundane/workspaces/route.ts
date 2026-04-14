import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TRADITIONS = ["western", "vedic", "hybrid"] as const;

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  // Owned workspaces
  const { data: owned, error: ownedErr } = await admin
    .from("mundane_workspaces")
    .select("id, name, description, tradition, is_active, created_at, owner_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (ownedErr) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: ownedErr.message },
      { status: 500 }
    );
  }

  // Member workspaces (not owned)
  const { data: memberRows, error: memErr } = await admin
    .from("mundane_workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id);

  if (memErr) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: memErr.message },
      { status: 500 }
    );
  }

  const memberWorkspaceIds = (memberRows ?? [])
    .map((r) => r.workspace_id)
    .filter((wid) => !(owned ?? []).some((o) => o.id === wid));

  let memberWorkspaces: typeof owned = [];
  if (memberWorkspaceIds.length > 0) {
    const { data: mw, error: mwErr } = await admin
      .from("mundane_workspaces")
      .select("id, name, description, tradition, is_active, created_at, owner_id")
      .in("id", memberWorkspaceIds)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (mwErr) {
      return NextResponse.json(
        { type: "about:blank", title: "Internal Server Error", status: 500, detail: mwErr.message },
        { status: 500 }
      );
    }
    memberWorkspaces = mw ?? [];
  }

  // Member counts
  const allIds = [...(owned ?? []), ...memberWorkspaces].map((w) => w.id);
  let memberCounts: Record<string, number> = {};
  if (allIds.length > 0) {
    const { data: counts } = await admin
      .from("mundane_workspace_members")
      .select("workspace_id")
      .in("workspace_id", allIds);

    if (counts) {
      memberCounts = counts.reduce<Record<string, number>>((acc, row) => {
        acc[row.workspace_id] = (acc[row.workspace_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  // Role lookup map for member rows
  const roleMap: Record<string, string> = {};
  for (const r of memberRows ?? []) {
    roleMap[r.workspace_id] = r.role;
  }

  const toResult = (w: NonNullable<typeof owned>[number], myRole: string) => ({
    ...w,
    my_role: myRole,
    member_count: memberCounts[w.id] ?? 0,
  });

  return NextResponse.json({
    workspaces: [
      ...(owned ?? []).map((w) => toResult(w, "super_admin")),
      ...memberWorkspaces.map((w) => toResult(w, roleMap[w.id] ?? "viewer")),
    ],
  });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json() as {
    name?: string;
    description?: string | null;
    tradition?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "name is required" },
      { status: 422 }
    );
  }
  if (body.tradition && !(VALID_TRADITIONS as readonly string[]).includes(body.tradition)) {
    return NextResponse.json(
      { type: "about:blank", title: "Validation Error", status: 422, detail: "tradition must be western, vedic, or hybrid" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data: workspace, error: wErr } = await admin
    .from("mundane_workspaces")
    .insert({
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      tradition: body.tradition ?? "western",
      owner_id: user.id,
    })
    .select()
    .single();

  if (wErr) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Server Error", status: 500, detail: wErr.message },
      { status: 500 }
    );
  }

  // Add creator as super_admin member
  await admin.from("mundane_workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "super_admin",
    invited_by: user.id,
  });

  // Audit log
  await admin.from("mundane_audit_logs").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    action: "workspace_created",
    entity_type: "mundane_workspace",
    entity_id: workspace.id,
  });

  return NextResponse.json(workspace, { status: 201 });
}
