import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndAwardTrainingGraduation } from "@/lib/training/graduation";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/debug/bypass-training
 * Marks all active lessons as completed and triggers graduation for the 
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

  // 1. Get all active lessons
  const { data: lessons, error: lessonsError } = await admin
    .from("training_lessons")
    .select("id")
    .eq("is_active", true);

  if (lessonsError || !lessons) {
    return NextResponse.json(
      { error: "Failed to fetch lessons", message: lessonsError?.message },
      { status: 500 }
    );
  }

  const lessonIds = lessons.map((l) => l.id);

  // 2. Mark all as completed in lesson_completions
  const completionData = lessonIds.map((id) => ({
    user_id: user.id,
    lesson_id: id,
    completed_at: new Date().toISOString(),
  }));

  const { error: completionError } = await admin
    .from("lesson_completions")
    .upsert(completionData, { onConflict: "user_id,lesson_id" });

  if (completionError) {
    return NextResponse.json(
      { error: "Failed to mark lessons completed", message: completionError.message },
      { status: 500 }
    );
  }

  // 3. Mark all as completed in lesson_progress
  const progressData = lessonIds.map((id) => ({
    user_id: user.id,
    lesson_id: id,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    time_spent_seconds: 3600, // mock 1 hour per lesson
  }));

  await admin
    .from("lesson_progress")
    .upsert(progressData, { onConflict: "user_id,lesson_id" });

  // 4. Trigger graduation
  const graduated = await checkAndAwardTrainingGraduation(user.id);

  return NextResponse.json({
    ok: true,
    graduated,
    message: "Training bypassed successfully",
  });
}
