import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/training/lessons/[id]/complete
 * Marks a lesson as complete for the authenticated user.
 * After marking, checks if all lessons in the category are now complete →
 * if yes, inserts a category_completions record.
 *
 * Idempotent — duplicate lesson completions are silently ignored.
 *
 * Response: { success: true, categoryCompleted: boolean }
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const admin = createAdminClient();

  // Verify the lesson exists and is active
  const { data: lesson, error: lessonError } = await admin
    .from("training_lessons")
    .select("id, category_id")
    .eq("id", lessonId)
    .eq("is_active", true)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const now = new Date().toISOString();

  // Look up lesson_progress to carry started_at / time_spent_seconds into completion record
  const { data: lessonProgress } = await admin
    .from("lesson_progress")
    .select("id, started_at, time_spent_seconds")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  // Mark lesson_progress.completed_at
  if (lessonProgress) {
    await admin
      .from("lesson_progress")
      .update({ completed_at: now })
      .eq("id", lessonProgress.id);
  }

  // Upsert lesson completion with time tracking fields
  const { error: completionError } = await admin
    .from("lesson_completions")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        ...(lessonProgress?.started_at ? { started_at: lessonProgress.started_at } : {}),
        ...(lessonProgress?.time_spent_seconds != null
          ? { time_spent_seconds: lessonProgress.time_spent_seconds }
          : {}),
      },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
    );

  if (completionError) {
    console.error("lesson complete upsert error:", completionError.message);
    return NextResponse.json(
      { error: "Failed to mark lesson complete." },
      { status: 500 }
    );
  }

  // Check if all lessons in the category are now complete
  let categoryCompleted = false;
  const categoryId = lesson.category_id;

  if (categoryId) {
    // Count total active lessons in the category
    const { count: totalCount } = await admin
      .from("training_lessons")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId)
      .eq("is_active", true);

    if (totalCount && totalCount > 0) {
      // Count how many the user has completed in this category
      const { data: categoryLessons } = await admin
        .from("training_lessons")
        .select("id")
        .eq("category_id", categoryId)
        .eq("is_active", true);

      const categoryLessonIds = (categoryLessons ?? []).map((l) => l.id);

      const { count: completedCount } = await admin
        .from("lesson_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("lesson_id", categoryLessonIds);

      if ((completedCount ?? 0) >= totalCount) {
        // Aggregate started_at (min) and time_spent_seconds (sum) from lesson_progress
        const { data: progressRows } = await admin
          .from("lesson_progress")
          .select("started_at, time_spent_seconds")
          .eq("user_id", user.id)
          .in("lesson_id", categoryLessonIds);

        const catStartedAt =
          progressRows && progressRows.length > 0
            ? progressRows.reduce((min, r) =>
                r.started_at && (!min || r.started_at < min) ? r.started_at : min,
                null as string | null
              )
            : null;

        const catTimeSpent =
          progressRows && progressRows.length > 0
            ? progressRows.reduce((sum, r) => sum + (r.time_spent_seconds ?? 0), 0)
            : null;

        // All lessons done — record category completion (idempotent)
        const { error: catCompError } = await admin
          .from("category_completions")
          .upsert(
            {
              user_id: user.id,
              category_id: categoryId,
              ...(catStartedAt ? { started_at: catStartedAt } : {}),
              ...(catTimeSpent != null ? { time_spent_seconds: catTimeSpent } : {}),
            },
            { onConflict: "user_id,category_id", ignoreDuplicates: true }
          );

        if (!catCompError) {
          categoryCompleted = true;
        }
      }
    }
  }

  return NextResponse.json({ success: true, categoryCompleted });
}
