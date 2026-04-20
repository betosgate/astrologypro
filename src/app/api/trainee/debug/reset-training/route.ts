import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/debug/reset-training
 * Resets all training progress and graduation status for the 
 * authenticated trainee. Only allowed for trainee1@test.astrologypro.com.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is trainee1@test.astrologypro.com
  if (user.email !== "trainee1@test.astrologypro.com") {
    return NextResponse.json(
      { error: "Forbidden: Only trainee1 can use this debug tool" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // 1. Delete all completions and progress
  await Promise.all([
    admin.from("lesson_completions").delete().eq("user_id", user.id),
    admin.from("lesson_progress").delete().eq("user_id", user.id),
    admin.from("trainee_lesson_progress").delete().eq("user_id", user.id), // Just in case
    // trainee_tabbie_appointments history and records
    admin.from("trainee_tabbie_appointment_history").delete().eq("user_id", user.id),
    admin.from("trainee_tabbie_appointments").delete().eq("user_id", user.id),
  ]);

  // 2. Reset trainee fields
  const { error: traineeError } = await admin
    .from("trainees")
    .update({
      training_status: "active",
      graduated_at: null,
      certificate_code: null,
      tabbie_appointment_required: false,
      tabbie_appointment_status: "not_required",
      tabbie_appointment_completed: false,
      tabbie_appointment_completed_at: null,
      current_tabbie_appointment_id: null,
      tabbie_appointment_sync_status: null,
      tabbie_appointment_last_synced_at: null,
      tabbie_appointment_completion_source: null,
      tabbie_appointment_completion_notes: null
    })
    .eq("user_id", user.id);

  if (traineeError) {
    return NextResponse.json(
      { error: "Failed to reset trainee status", message: traineeError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Training progress reset successfully",
  });
}
