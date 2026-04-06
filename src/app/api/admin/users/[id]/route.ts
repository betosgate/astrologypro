import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";


// ─── GET /api/admin/users/[id] ────────────────────────────────────────────────
// Returns the profile data for a user by auth user_id.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminEmail = await getAdminUser();
  if (!adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  // Fetch the auth user for email
  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(id);
  if (authErr || !authUser.user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const email = authUser.user.email ?? "";

  // Try each role table in order to find the profile
  const tables = [
    { table: "diviners", role: "diviner", nameCol: "display_name" },
    { table: "clients", role: "client", nameCol: "full_name" },
    { table: "social_advocates", role: "advocate", nameCol: "name" },
    { table: "community_members", role: "community", nameCol: "full_name" },
    { table: "trainees", role: "trainee", nameCol: "name" },
  ] as const;

  for (const { table, role, nameCol } of tables) {
    const { data } = await admin
      .from(table)
      .select("id, user_id, phone, is_active")
      .eq("user_id", id)
      .maybeSingle();

    if (data) {
      // Fetch name separately since column differs per table
      const { data: nameRow } = await admin
        .from(table)
        .select(`id, ${nameCol}`)
        .eq("user_id", id)
        .maybeSingle();

      return NextResponse.json({
        userId: id,
        rowId: data.id,
        email,
        name: (nameRow as Record<string, unknown>)?.[nameCol] ?? "",
        phone: data.phone ?? "",
        isActive: data.is_active ?? true,
        role,
        table,
        nameCol,
      });
    }
  }

  return NextResponse.json({ error: "Profile not found" }, { status: 404 });
}

// ─── PUT /api/admin/users/[id] ────────────────────────────────────────────────
// Updates mutable profile fields (not email).

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminEmail = await getAdminUser();
  if (!adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, phone, isActive, role, rowId, nameCol } = body as {
    name?: string;
    phone?: string;
    isActive?: boolean;
    role?: string;
    rowId?: string;
    nameCol?: string;
  };

  if (!rowId || !role || !nameCol) {
    return NextResponse.json({ error: "Missing rowId, role, or nameCol" }, { status: 422 });
  }

  const tableMap: Record<string, string> = {
    diviner: "diviners",
    client: "clients",
    advocate: "social_advocates",
    community: "community_members",
    trainee: "trainees",
  };

  const table = tableMap[role];
  if (!table) return NextResponse.json({ error: "Unknown role" }, { status: 422 });

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  if (name !== undefined) updates[nameCol] = name.trim();
  if (phone !== undefined) updates.phone = phone.trim() || null;
  // is_active not present on clients or community_members — only update if supported
  if (isActive !== undefined && !["client", "community"].includes(role)) {
    updates.is_active = isActive;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 422 });
  }

  const { error } = await admin.from(table).update(updates).eq("id", rowId).eq("user_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log to admin_user_notes for audit trail
  await admin.from("admin_user_notes").insert({
    user_id: id,
    note: `Profile updated by admin: ${JSON.stringify(updates)}`,
    role,
    created_by: adminEmail,
  });

  return NextResponse.json({ success: true });
}
