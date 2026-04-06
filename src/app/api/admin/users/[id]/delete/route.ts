import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const TABLE_MAP: Record<string, string> = {
  diviner: "diviners",
  client: "clients",
  advocate: "social_advocates",
  community: "community_members",
  trainee: "trainees",
};

// ─── POST /api/admin/users/[id]/delete ────────────────────────────────────────
// Soft-deletes a user: archives their profile row in deleted_users table.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();
  if (!adminUser?.email || !ADMIN_EMAILS.includes(adminUser.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { role, rowId } = await req.json();

  if (!role || !rowId) {
    return NextResponse.json({ error: "Missing role or rowId" }, { status: 422 });
  }

  const table = TABLE_MAP[role as string];
  if (!table) return NextResponse.json({ error: "Unknown role" }, { status: 422 });

  const admin = createAdminClient();

  // Fetch the original row
  const { data: originalRow, error: fetchErr } = await admin
    .from(table)
    .select("*")
    .eq("id", rowId)
    .eq("user_id", id)
    .maybeSingle();

  if (fetchErr || !originalRow) {
    return NextResponse.json({ error: "Profile row not found" }, { status: 404 });
  }

  // Archive to deleted_users
  const { error: archiveErr } = await admin.from("deleted_users").insert({
    user_id: id,
    original_role: role,
    original_row_id: rowId,
    original_table: table,
    original_data: originalRow,
    deleted_by: adminUser.email,
  });

  if (archiveErr) {
    return NextResponse.json({ error: archiveErr.message }, { status: 500 });
  }

  // Mark original row as inactive — use is_active if supported
  if (!["client", "community"].includes(role)) {
    await admin.from(table).update({ is_active: false }).eq("id", rowId);
  }

  // Log to admin_activity_log
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email,
    target_user_id: id,
    action_type: "soft_delete",
    details: { role, table, rowId },
  }).maybeSingle();

  return NextResponse.json({ success: true });
}
