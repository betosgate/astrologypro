import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/mark-all-read
 * Marks every unread notification for the authenticated user as read.
 * Response: { updated: number }
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { error, count } = await admin
    .from("notifications")
    .update({ is_read: true }, { count: "exact" })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("[POST /api/notifications/mark-all-read]", error.message);
    return NextResponse.json({ error: "Failed to mark notifications as read." }, { status: 500 });
  }

  return NextResponse.json({ updated: count ?? 0 });
}
