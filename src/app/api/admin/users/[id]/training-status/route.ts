import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["in_progress", "completed", "certified", "dropped"];

// ─── PATCH /api/admin/users/[id]/training-status ──────────────────────────────
// Updates trainees.training_status for the given user.

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("trainees")
    .update({ training_status: status })
    .eq("user_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log to admin_activity_log
  await admin.from("admin_activity_log").insert({
    admin_user_id: adminUser.email,
    target_user_id: id,
    action_type: "update_training_status",
    details: { new_status: status },
  }).maybeSingle();

  return NextResponse.json({ success: true, status });
}
