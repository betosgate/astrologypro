import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendLessonComplete,
  sendCategoryComplete,
} from "@/lib/email";
import { checkAndAwardTrainingGraduation } from "@/lib/training/graduation";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/training/lessons/[id]/complete
 * Marks a lesson as complete for the authenticated user.
 * After marking, checks if all lessons in the category are now complete →
 * if yes, inserts a category_completions record.
 *
 * Idempotent — duplicate lesson completions are silently ignored.
 *
 * NOTE: If the lesson has active in-video quiz triggers, this endpoint
 * returns 422. Completion for trigger-gated lessons is handled exclusively
 * by the trigger answer route once all triggers are passed.
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

  // Verify the lesson exists and is active — also fetch title and category
  const { data: lesson, error: lessonError } = await admin
    .from("training_lessons")
    .select("id, title, category_id")
    .eq("id", lessonId)
    .eq("is_active", true)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const now = new Date().toISOString();

  // ── Trigger gate ────────────────────────────────────────────────────────────
  // Lessons with active in-video quiz triggers are completed exclusively via
  // the trigger answer route. This endpoint must not bypass that requirement.
  const { data: activeTriggers } = await admin
    .from("lesson_quiz_triggers")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("is_active", true);

  if (activeTriggers && activeTriggers.length > 0) {
    return NextResponse.json(
      {
        error: "Complete all in-video quiz questions before marking the lesson done.",
      },
      { status: 422 }
    );
  }

  // Look up lesson_progress to carry started_at / time_spent_seconds into completion record
  const { data: lessonProgress } = await admin
    .from("lesson_progress")
    .select("id, started_at, time_spent_seconds")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  // Mark lesson_progress.completed_at
  if (lessonProgress) {
    await admin
      .from("lesson_progress")
      .update({ completed_at: now })
      .eq("id", lessonProgress.id);
  }

  // Upsert lesson completion with time tracking fields
  // ignoreDuplicates: true — idempotent; we detect "new completion" by checking count
  const { error: completionError, count: insertedCount } = await admin
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
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true, count: "exact" }
    );

  if (completionError) {
    console.error("lesson complete upsert error:", completionError.message);
    return NextResponse.json(
      { error: "Failed to mark lesson complete." },
      { status: 500 }
    );
  }

  // Detect if this is a new (first-time) completion vs. a duplicate upsert
  const isNewCompletion = (insertedCount ?? 0) > 0;

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
        const { error: catCompError, count: catInsertedCount } = await admin
          .from("category_completions")
          .upsert(
            {
              user_id: user.id,
              category_id: categoryId,
              ...(catStartedAt ? { started_at: catStartedAt } : {}),
              ...(catTimeSpent != null ? { time_spent_seconds: catTimeSpent } : {}),
            },
            { onConflict: "user_id,category_id", ignoreDuplicates: true, count: "exact" }
          );

        if (!catCompError) {
          categoryCompleted = (catInsertedCount ?? 0) > 0;
        }
      }
    }
  }

  // ── Fire-and-forget emails + graduation check ───────────────────────────────
  // Only send emails and run graduation for new completions
  if (isNewCompletion) {
    const [authUser, categoryRow] = await Promise.all([
      admin.auth.admin.getUserById(user.id),
      categoryId
        ? admin
            .from("training_categories")
            .select("id, name, training_id")
            .eq("id", categoryId)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    const traineeEmail = authUser.data.user?.email ?? "";
    const traineeName =
      authUser.data.user?.user_metadata?.full_name ??
      authUser.data.user?.email?.split("@")[0] ??
      "Trainee";

    const catData = categoryRow.data as {
      id: string;
      name: string;
      training_id: string | null;
    } | null;

    const lessonTitle = lesson.title;
    const categoryName = catData?.name ?? "";

    // Fetch next lesson title for this category from progress cache
    let nextLessonTitle: string | undefined;
    if (categoryId) {
      const { data: ucpRow } = await admin
        .from("user_category_progress")
        .select("next_lesson_title")
        .eq("user_id", user.id)
        .eq("category_id", categoryId)
        .maybeSingle();
      nextLessonTitle = ucpRow?.next_lesson_title ?? undefined;
    }

    if (traineeEmail) {
      // Lesson complete email
      sendLessonComplete({
        to: traineeEmail,
        name: traineeName,
        lessonTitle,
        categoryName,
        nextLessonTitle,
      }).catch(() => {});

      // Category complete email (only when newly completed this call)
      if (categoryCompleted && catData?.training_id) {
        const { data: progProgressRow } = await admin
          .from("user_program_progress")
          .select("next_category_name")
          .eq("user_id", user.id)
          .eq("program_id", catData.training_id)
          .maybeSingle();

        const nextCategoryName = progProgressRow?.next_category_name ?? undefined;

        const [programRow, lessonsCompletedInCat] = await Promise.all([
          admin
            .from("training_programs")
            .select("name")
            .eq("id", catData.training_id)
            .single(),
          admin
            .from("lesson_completions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .in(
              "lesson_id",
              (
                await admin
                  .from("training_lessons")
                  .select("id")
                  .eq("category_id", categoryId)
                  .eq("is_active", true)
              ).data?.map((l) => l.id) ?? []
            ),
        ]);

        sendCategoryComplete({
          to: traineeEmail,
          name: traineeName,
          categoryName,
          programName: programRow.data?.name ?? "",
          lessonsCompleted: lessonsCompletedInCat.count ?? 0,
          nextCategoryName,
        }).catch(() => {});
      }
    }

    // Graduation check — runs after all emails are queued
    // Uses the shared helper which verifies all lessons complete and is idempotent.
    checkAndAwardTrainingGraduation(user.id).catch((err) =>
      console.error("[training-graduation] check failed:", err)
    );
  }

  return NextResponse.json({ success: true, categoryCompleted });
}
