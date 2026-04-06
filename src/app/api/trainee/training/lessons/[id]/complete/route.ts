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

  // Upsert lesson completion (ignore duplicate via ON CONFLICT DO NOTHING equivalent)
  const { error: completionError } = await admin
    .from("lesson_completions")
    .upsert(
      { user_id: user.id, lesson_id: lessonId },
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
        // All lessons done — record category completion (idempotent)
        const { error: catCompError } = await admin
          .from("category_completions")
          .upsert(
            { user_id: user.id, category_id: categoryId },
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
