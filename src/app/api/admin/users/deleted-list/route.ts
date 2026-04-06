import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET /api/admin/users/deleted-list ────────────────────────────────────────
// Returns all soft-deleted users that have not been restored yet.

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("deleted_users")
    .select(
      "id, user_id, original_role, original_table, original_data, deleted_by, deleted_at, restored_at, restored_by"
    )
    .is("restored_at", null)
    .order("deleted_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deletedUsers: data ?? [] });
}
