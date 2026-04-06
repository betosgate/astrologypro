import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

// ─── GET /api/admin/users/deleted-list ────────────────────────────────────────
// Returns all soft-deleted users that have not been restored yet.

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
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
