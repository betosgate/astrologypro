import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── POST /api/admin/roles/:id/clone ─────────────────────────────────────────
// Clone a role with all its permissions.
// Body: { name: string, code: string }
// Returns: { id: string } — the new role's id
// Admin only

export async function POST(req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/401",
        title: "Unauthorized",
        status: 401,
        detail: "Admin authentication required",
      },
      { status: 401 }
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/400",
        title: "Bad Request",
        status: 400,
        detail: "Request body must be valid JSON",
      },
      { status: 400 }
    );
  }

  const { name, code } = body as { name?: string; code?: string };

  if (!name?.trim() || !code?.trim()) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Unprocessable Entity",
        status: 422,
        detail: "name and code are required",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // 1. Fetch source role
  const { data: sourceRole, error: sourceErr } = await admin
    .from("roles")
    .select("id, name, slug, description, priority, status")
    .eq("id", id)
    .maybeSingle();

  if (sourceErr || !sourceRole) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/404",
        title: "Not Found",
        status: 404,
        detail: "Source role not found",
      },
      { status: 404 }
    );
  }

  // 2. Check code uniqueness
  const { data: existing } = await admin
    .from("roles")
    .select("id")
    .eq("slug", code.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Unprocessable Entity",
        status: 422,
        detail: `A role with code "${code}" already exists`,
      },
      { status: 422 }
    );
  }

  // 3. Fetch source role's permissions
  const { data: sourcePerms, error: permsErr } = await admin
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", id);

  if (permsErr) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Internal Server Error",
        status: 500,
        detail: permsErr.message,
      },
      { status: 500 }
    );
  }

  // 4. Create the new role — never mark cloned roles as system roles
  const { data: newRole, error: createErr } = await admin
    .from("roles")
    .insert({
      name: name.trim(),
      slug: code.trim().toLowerCase(),
      description: (sourceRole as Record<string, unknown>).description ?? null,
      priority: (sourceRole as Record<string, unknown>).priority ?? 0,
      status: (sourceRole as Record<string, unknown>).status ?? "active",
      is_system: false,
    })
    .select("id")
    .single();

  if (createErr || !newRole) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Internal Server Error",
        status: 500,
        detail: createErr?.message ?? "Failed to create cloned role",
      },
      { status: 500 }
    );
  }

  const newRoleId = (newRole as Record<string, unknown>).id as string;

  // 5. Copy permissions to the new role
  if ((sourcePerms ?? []).length > 0) {
    const permInserts = (sourcePerms ?? []).map((sp) => ({
      role_id: newRoleId,
      permission_id: (sp as Record<string, unknown>).permission_id as string,
      granted_by: adminUser.id,
      granted_at: new Date().toISOString(),
    }));

    const { error: insertErr } = await admin
      .from("role_permissions")
      .insert(permInserts);

    if (insertErr) {
      // Roll back the role creation so we don't leave orphaned data
      await admin.from("roles").delete().eq("id", newRoleId);
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/500",
          title: "Internal Server Error",
          status: 500,
          detail: insertErr.message,
        },
        { status: 500 }
      );
    }
  }

  // 6. Audit log
  await admin
    .from("admin_activity_log")
    .insert({
      admin_user_id: adminUser.email,
      target_user_id: null,
      action_type: "clone_role",
      details: { source_role_id: id, new_role_id: newRoleId, name: name.trim(), code: code.trim() },
    })
    .maybeSingle();

  return NextResponse.json({ id: newRoleId }, { status: 201 });
}
