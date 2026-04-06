import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const ALLOWED_STATUSES = ["in_progress", "completed", "certified", "dropped"];

// ─── PATCH /api/admin/users/[id]/training-status ──────────────────────────────
// Updates trainees.training_status for the given user.

export async function PATCH(
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
