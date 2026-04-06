import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/roles/:id/permissions ─────────────────────────────────────
// Returns the permission codes assigned to a role.

export async function GET(_req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Verify role exists
  const { data: role, error: roleErr } = await admin
    .from("roles")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (roleErr || !role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const { data, error } = await admin
    .from("role_permissions")
    .select("permissions(code)")
    .eq("role_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const permissionCodes = (data ?? [])
    .map((row) => {
      // Supabase returns joined tables as arrays; handle both array and single-object shapes
      const perm = row.permissions as unknown as { code: string } | { code: string }[] | null;
      if (!perm) return null;
      if (Array.isArray(perm)) return perm[0]?.code ?? null;
      return perm.code ?? null;
    })
    .filter((code): code is string => code !== null);

  return NextResponse.json({ permissions: permissionCodes });
}

// ─── PUT /api/admin/roles/:id/permissions ─────────────────────────────────────
// Replaces ALL permissions for this role (full replace, not patch).
// Body: { permissionCodes: string[] }

export async function PUT(req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { permissionCodes } = body as { permissionCodes?: string[] };

  if (!Array.isArray(permissionCodes)) {
    return NextResponse.json({ error: "permissionCodes must be an array" }, { status: 422 });
  }

  const admin = createAdminClient();

  // Verify role exists
  const { data: role, error: roleErr } = await admin
    .from("roles")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (roleErr || !role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  // Resolve permission codes to IDs
  let permissionIds: string[] = [];
  if (permissionCodes.length > 0) {
    const { data: perms, error: permsErr } = await admin
      .from("permissions")
      .select("id, code")
      .in("code", permissionCodes);

    if (permsErr) return NextResponse.json({ error: permsErr.message }, { status: 500 });

    const foundCodes = (perms ?? []).map((p) => p.code);
    const unknown = permissionCodes.filter((c) => !foundCodes.includes(c));
    if (unknown.length > 0) {
      return NextResponse.json({ error: `Unknown permission codes: ${unknown.join(", ")}` }, { status: 422 });
    }

    permissionIds = (perms ?? []).map((p) => p.id);
  }

  // Delete existing role_permissions for this role
  const { error: deleteErr } = await admin
    .from("role_permissions")
    .delete()
    .eq("role_id", id);

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  // Insert new role_permissions
  if (permissionIds.length > 0) {
    const inserts = permissionIds.map((permId) => ({
      role_id: id,
      permission_id: permId,
      granted_by: adminUser.id,
      granted_at: new Date().toISOString(),
    }));

    const { error: insertErr } = await admin.from("role_permissions").insert(inserts);
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Log to admin_activity_log
  await admin
    .from("admin_activity_log")
    .insert({
      admin_user_id: adminUser.email,
      target_user_id: null,
      action_type: "update_role_permissions",
      details: { role_id: id, permissionCodes },
    })
    .maybeSingle();

  return NextResponse.json({ success: true, permissionCodes });
}
