import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndAwardTrainingGraduation } from "@/lib/training/graduation";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/training/lessons/[id]/triggers/[triggerId]/answer
 * Body: { answer_index: number }
 *
 * Grades a single in-video quiz trigger answer server-side.
 * Enforces rewatch gate: if a previous attempt was incorrect and the learner
 * has not yet rewatched the required segment, returns 403 rewatch-required.
 *
 * Response (correct):   { correct: true }
 * Response (incorrect): { correct: false, rewind_to: number }
 * Response (gate):      RFC 9457 Problem Details, status 403
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; triggerId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId, triggerId } = await params;

  let body: { answer_index?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        type: "/errors/invalid-body",
        title: "Invalid Request Body",
        status: 400,
        detail: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  const { answer_index } = body;

  if (typeof answer_index !== "number" || !Number.isInteger(answer_index) || answer_index < 0) {
    return NextResponse.json(
      {
        type: "/errors/validation",
        title: "Validation Error",
        status: 422,
        detail: "answer_index must be a non-negative integer.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // 1. Fetch the trigger + joined question (with correct_answer — server only)
  const { data: trigger, error: triggerError } = await admin
    .from("lesson_quiz_triggers")
    .select(
      "id, lesson_id, trigger_timestamp_seconds, rewind_target_seconds, question_id, is_active, quiz_questions(id, question, options, correct_answer)"
    )
    .eq("id", triggerId)
    .eq("lesson_id", lessonId)
    .eq("is_active", true)
    .single();

  if (triggerError || !trigger) {
    return NextResponse.json(
      {
        type: "/errors/not-found",
        title: "Not Found",
        status: 404,
        detail: "Quiz trigger not found or is inactive.",
      },
      { status: 404 }
    );
  }

  const question = (
    Array.isArray(trigger.quiz_questions)
      ? trigger.quiz_questions[0]
      : trigger.quiz_questions
  ) as {
    id: string;
    question: string;
    options: { text: string }[];
    correct_answer: number;
  } | null;

  if (!question) {
    return NextResponse.json(
      {
        type: "/errors/not-found",
        title: "Not Found",
        status: 404,
        detail: "Question associated with this trigger was not found.",
      },
      { status: 404 }
    );
  }

  // 2. Fetch user's existing trigger progress
  const { data: existingProgress } = await admin
    .from("lesson_trigger_progress")
    .select(
      "id, passed, attempts, rewatch_completed, rewatch_required_until_seconds"
    )
    .eq("user_id", user.id)
    .eq("trigger_id", triggerId)
    .maybeSingle();

  // 3. Server-side rewatch gate: if previous attempt failed and rewatch not complete
  if (
    existingProgress &&
    existingProgress.passed === false &&
    existingProgress.attempts > 0 &&
    existingProgress.rewatch_completed === false
  ) {
    return NextResponse.json(
      {
        type: "/errors/rewatch-required",
        title: "Rewatch Required",
        status: 403,
        detail: "You must replay the segment before retrying.",
      },
      { status: 403 }
    );
  }

  // 4. Check answer
  const isCorrect = answer_index === question.correct_answer;
  const now = new Date().toISOString();

  if (isCorrect) {
    // 5a. Correct: upsert progress as passed
    await admin
      .from("lesson_trigger_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          trigger_id: triggerId,
          passed: true,
          attempts: (existingProgress?.attempts ?? 0) + 1,
          rewatch_completed: true,
          passed_at: now,
        },
        { onConflict: "user_id,trigger_id" }
      );

    // 6. Check if ALL triggers for this lesson are now passed.
    // If so, auto-complete the lesson (unless it also has a legacy quiz that
    // hasn't been passed yet — in that case, lesson stays incomplete until
    // both triggers and quiz are passed).
    let allTriggersNowPassed = false;
    const { data: allTriggers } = await admin
      .from("lesson_quiz_triggers")
      .select("id")
      .eq("lesson_id", lessonId)
      .eq("is_active", true);

    if (allTriggers && allTriggers.length > 0) {
      const allTriggerIds = allTriggers.map((t) => t.id);
      const { count: passedTriggerCount } = await admin
        .from("lesson_trigger_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("trigger_id", allTriggerIds)
        .eq("passed", true);

      allTriggersNowPassed = (passedTriggerCount ?? 0) >= allTriggerIds.length;
    }

    if (allTriggersNowPassed) {
      // Check if lesson has a legacy quiz that must also be passed
      const { count: quizCount } = await admin
        .from("quiz_questions")
        .select("id", { count: "exact", head: true })
        .eq("lesson_id", lessonId);

      let quizPassed = true;
      if ((quizCount ?? 0) > 0) {
        const { data: lastAttempt } = await admin
          .from("quiz_attempts")
          .select("passed")
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId)
          .eq("passed", true)
          .limit(1)
          .maybeSingle();
        quizPassed = !!lastAttempt;
      }

      if (quizPassed) {
        // Auto-complete the lesson
        const { data: lessonProgress } = await admin
          .from("lesson_progress")
          .select("id, started_at, time_spent_seconds")
          .eq("user_id", user.id)
          .eq("lesson_id", lessonId)
          .maybeSingle();

        if (lessonProgress) {
          await admin
            .from("lesson_progress")
            .update({ completed_at: now })
            .eq("id", lessonProgress.id);
        }

        await admin
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

        // Check if category is now fully complete
        const { data: lessonRow } = await admin
          .from("training_lessons")
          .select("category_id")
          .eq("id", lessonId)
          .single();

        if (lessonRow?.category_id) {
          const catId = lessonRow.category_id;
          const { data: catLessons } = await admin
            .from("training_lessons")
            .select("id")
            .eq("category_id", catId)
            .eq("is_active", true);

          const catLessonIds = (catLessons ?? []).map((l) => l.id);
          if (catLessonIds.length > 0) {
            const { count: completedCount } = await admin
              .from("lesson_completions")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .in("lesson_id", catLessonIds);

            if ((completedCount ?? 0) >= catLessonIds.length) {
              const { data: progressRows } = await admin
                .from("lesson_progress")
                .select("started_at, time_spent_seconds")
                .eq("user_id", user.id)
                .in("lesson_id", catLessonIds);

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

              await admin
                .from("category_completions")
                .upsert(
                  {
                    user_id: user.id,
                    category_id: catId,
                    ...(catStartedAt ? { started_at: catStartedAt } : {}),
                    ...(catTimeSpent != null ? { time_spent_seconds: catTimeSpent } : {}),
                  },
                  { onConflict: "user_id,category_id", ignoreDuplicates: true }
                );
            }
          }
        }

        // Graduation check — runs after category completion is written.
        // Idempotent; verifies every lesson across all programs is complete.
        checkAndAwardTrainingGraduation(user.id).catch((err) =>
          console.error("[training-graduation] check failed:", err)
        );

        return NextResponse.json({ correct: true, lesson_complete: true });
      }
    }

    return NextResponse.json({ correct: true });
  } else {
    // 5b. Incorrect: increment attempts, require rewatch
    const newAttempts = (existingProgress?.attempts ?? 0) + 1;
    const rewatchRequiredUntil = trigger.rewind_target_seconds + 30;

    await admin
      .from("lesson_trigger_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          trigger_id: triggerId,
          passed: false,
          attempts: newAttempts,
          last_rewind_at: now,
          rewatch_required_until_seconds: rewatchRequiredUntil,
          rewatch_completed: false,
        },
        { onConflict: "user_id,trigger_id" }
      );

    return NextResponse.json({
      correct: false,
      rewind_to: trigger.rewind_target_seconds,
    });
  }
}
