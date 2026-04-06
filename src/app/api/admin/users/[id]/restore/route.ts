import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

// ─── POST /api/admin/users/[id]/restore ──────────────────────────────────────
// Restores a soft-deleted user: marks the deleted_users row as restored
// and re-activates the original profile row.

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
  const { deletedRecordId } = (await req.json()) as { deletedRecordId?: string };

  if (!deletedRecordId) {
    return NextResponse.json({ error: "Missing deletedRecordId" }, { status: 422 });
  }

  const admin = createAdminClient();

  // Fetch the deleted_users record
  const { data: deletedRecord, error: fetchErr } = await admin
    .from("deleted_users")
    .select("*")
    .eq("id", deletedRecordId)
    .eq("user_id", id)
    .is("restored_at", null)
    .maybeSingle();

  if (fetchErr || !deletedRecord) {
    return NextResponse.json({ error: "Deleted record not found" }, { status: 404 });
  }

  const { original_table, original_row_id, original_role } = deletedRecord as {
    original_table: string;
    original_row_id: string;
    original_role: string;
  };

  // Re-activate the original row if is_active supported
  if (!["client", "community"].includes(original_role)) {
    await admin.from(original_table).update({ is_active: true }).eq("id", original_row_id);
  }

  // Mark as restored
  await admin.from("deleted_users").update({
    restored_at: new Date().toISOString(),
    restored_by: adminUser.email,
  }).eq("id", deletedRecordId);

  // Log to admin_activity_log
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email,
    target_user_id: id,
    action_type: "restore_user",
    details: { deletedRecordId, original_table, original_role },
  }).maybeSingle();

  return NextResponse.json({ success: true });
}
