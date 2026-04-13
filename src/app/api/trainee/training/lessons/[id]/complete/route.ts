import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendLessonComplete,
  sendCategoryComplete,
} from "@/lib/email";
import { completeLessonAndProgressForUser } from "@/lib/training/completion";
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

  // ── Trigger gate ────────────────────────────────────────────────────────────
  // Lessons with active in-video quiz triggers are completed exclusively via
  // the trigger answer route. This endpoint must not bypass that requirement.
  const { data: activeTriggers } = await admin
    .from("lesson_quiz_triggers")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("is_active", true);

  if (activeTriggers && activeTriggers.length > 0) {
    const activeTriggerIds = activeTriggers.map((t) => t.id);
    const { count: passedCount } = await admin
      .from("lesson_trigger_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("trigger_id", activeTriggerIds)
      .eq("passed", true);

    if ((passedCount ?? 0) < activeTriggerIds.length) {
      return NextResponse.json(
        {
          error: "Pass all in-video quiz questions before marking the lesson complete.",
        },
        { status: 422 }
      );
    }
  }

  // ── Standard quiz gate ─────────────────────────────────────────────────────
  // If the lesson has quiz questions, the learner must have at least one
  // passing quiz attempt before the lesson can be marked complete. This
  // server-side check mirrors the client canComplete gate and prevents
  // bypass via a direct API call.
  const { count: quizQuestionCount } = await admin
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("lesson_id", lessonId);

  if (quizQuestionCount && quizQuestionCount > 0) {
    const { data: passedAttempt } = await admin
      .from("quiz_attempts")
      .select("id")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .eq("passed", true)
      .limit(1)
      .maybeSingle();

    if (!passedAttempt) {
      return NextResponse.json(
        {
          error: "Pass the lesson quiz before marking the lesson complete.",
        },
        { status: 422 },
      );
    }
  }

  let isNewCompletion = false;
  let categoryCompleted = false;
  try {
    const result = await completeLessonAndProgressForUser(admin, user.id, lessonId);
    isNewCompletion = result.inserted;
    categoryCompleted = result.categoryCompleted;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark lesson complete.";
    console.error("lesson completion sync error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
  const categoryId = lesson.category_id;

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

    // Graduation check — runs after category completion is recorded.
    // The shared helper is idempotent and verifies all lessons are done.
    checkAndAwardTrainingGraduation(user.id).catch((err) =>
      console.error("[training-graduation] check failed:", err)
    );
  }

  return NextResponse.json({ success: true, categoryCompleted });
}
