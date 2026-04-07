import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/users/:id/relationships ───────────────────────────────────
// Returns { asParent: Relationship[], asChild: Relationship[] }
// Includes user display names for parent/child.

export async function GET(_req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Verify auth user exists
  const { data: authUserData, error: authErr } = await admin.auth.admin.getUserById(id);
  if (authErr || !authUserData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [asParentResult, asChildResult] = await Promise.all([
    admin
      .from("user_relationships")
      .select(
        "id, child_user_id, relationship_type, status, active_from, active_to, transferred_to, notes, created_at, updated_at"
      )
      .eq("parent_user_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("user_relationships")
      .select(
        "id, parent_user_id, relationship_type, status, active_from, active_to, transferred_to, notes, created_at, updated_at"
      )
      .eq("child_user_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (asParentResult.error)
    return NextResponse.json({ error: asParentResult.error.message }, { status: 500 });
  if (asChildResult.error)
    return NextResponse.json({ error: asChildResult.error.message }, { status: 500 });

  // Collect all related user IDs to resolve display names
  const relatedIds = new Set<string>();
  (asParentResult.data ?? []).forEach((r) => relatedIds.add(r.child_user_id));
  (asChildResult.data ?? []).forEach((r) => relatedIds.add(r.parent_user_id));

  const nameMap: Record<string, string> = {};
  for (const uid of relatedIds) {
    const { data: authUser } = await admin.auth.admin.getUserById(uid);
    if (authUser?.user?.email) {
      nameMap[uid] =
        authUser.user.user_metadata?.full_name ??
        authUser.user.user_metadata?.name ??
        authUser.user.email;
    }
  }

  const asParent = (asParentResult.data ?? []).map((r) => ({
    ...r,
    child_display_name: nameMap[r.child_user_id] ?? r.child_user_id,
  }));

  const asChild = (asChildResult.data ?? []).map((r) => ({
    ...r,
    parent_display_name: nameMap[r.parent_user_id] ?? r.parent_user_id,
  }));

  return NextResponse.json({ asParent, asChild });
}

// ─── POST /api/admin/users/:id/relationships ──────────────────────────────────
// Creates a new active relationship where :id is the parent.
// Body: { child_user_id, relationship_type, notes? }

export async function POST(req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { child_user_id, relationship_type, notes } = body as {
    child_user_id?: string;
    relationship_type?: string;
    notes?: string;
  };

  if (!child_user_id || !relationship_type) {
    return NextResponse.json(
      { error: "child_user_id and relationship_type are required" },
      { status: 422 }
    );
  }

  if (id === child_user_id) {
    return NextResponse.json(
      { error: "parent_user_id and child_user_id cannot be the same" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Check for duplicate active relationship of same type for this child
  const { data: existing } = await admin
    .from("user_relationships")
    .select("id")
    .eq("child_user_id", child_user_id)
    .eq("relationship_type", relationship_type)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An active relationship of this type already exists for the child user." },
      { status: 422 }
    );
  }

  const { data, error } = await admin
    .from("user_relationships")
    .insert({
      parent_user_id: id,
      child_user_id,
      relationship_type,
      status: "active",
      active_from: new Date().toISOString(),
      notes: notes?.trim() || null,
      created_by: adminUser.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log to admin_activity_log
  await admin
    .from("admin_activity_log")
    .insert({
      admin_user_id: adminUser.email,
      target_user_id: id,
      action_type: "create_relationship",
      details: { parent_user_id: id, child_user_id, relationship_type },
    })
    .maybeSingle();

  return NextResponse.json(data, { status: 201 });
}

// ─── PATCH /api/admin/users/:id/relationships/:relationshipId ─────────────────
// Updates relationship status or handles a transfer.
// Body: { status, transferred_to?, notes? }
// For transfers: sets current to 'transferred', active_to=now(),
//   creates new active relationship to the new parent.

export async function PATCH(req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  // Extract relationshipId from path: /api/admin/users/:id/relationships/:relationshipId
  const pathParts = url.pathname.split("/");
  const relationshipId = pathParts[pathParts.length - 1];

  if (!relationshipId || relationshipId === "relationships") {
    return NextResponse.json({ error: "relationshipId is required in the path" }, { status: 422 });
  }

  const body = await req.json();
  const { status, transferred_to, notes } = body as {
    status?: string;
    transferred_to?: string;
    notes?: string;
  };

  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 422 });
  }

  const admin = createAdminClient();

  // Fetch the relationship
  const { data: rel, error: fetchErr } = await admin
    .from("user_relationships")
    .select("*")
    .eq("id", relationshipId)
    .eq("parent_user_id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!rel) return NextResponse.json({ error: "Relationship not found" }, { status: 404 });

  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    status,
    updated_at: now,
    notes: notes?.trim() ?? rel.notes,
  };

  if (status === "transferred") {
    if (!transferred_to) {
      return NextResponse.json(
        { error: "transferred_to is required when status='transferred'" },
        { status: 422 }
      );
    }
    updates.active_to = now;
    updates.transferred_to = transferred_to;
  }

  const { error: updateErr } = await admin
    .from("user_relationships")
    .update(updates)
    .eq("id", relationshipId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // For transfers: create a new active relationship to the new parent
  if (status === "transferred" && transferred_to) {
    const { error: newRelErr } = await admin.from("user_relationships").insert({
      parent_user_id: transferred_to,
      child_user_id: rel.child_user_id,
      relationship_type: rel.relationship_type,
      status: "active",
      active_from: now,
      notes: notes?.trim() || null,
      created_by: adminUser.id,
    });

    if (newRelErr) return NextResponse.json({ error: newRelErr.message }, { status: 500 });
  }

  // Log to admin_activity_log
  await admin
    .from("admin_activity_log")
    .insert({
      admin_user_id: adminUser.email,
      target_user_id: id,
      action_type: "update_relationship",
      details: { relationship_id: relationshipId, status, transferred_to: transferred_to ?? null },
    })
    .maybeSingle();

  return NextResponse.json({ success: true });
}
