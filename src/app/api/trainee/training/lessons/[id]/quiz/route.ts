import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendQuizPassed } from "@/lib/email";
import { checkAndAwardTrainingGraduation } from "@/lib/training/graduation";
import { clearQuizQuestionProgress } from "@/lib/training/quiz-question-progress";

export const dynamic = "force-dynamic";

const PASS_THRESHOLD_PCT = 70;
const COOLDOWN_MINUTES = 30;
const FREE_ATTEMPTS_BEFORE_COOLDOWN = 2; // first 2 attempts have no cooldown

/**
 * POST /api/trainee/training/lessons/[id]/quiz
 * Body: { answers: number[] } — array of selected option indices (0-based), one per question
 *
 * Grades the quiz server-side (correct_answer never exposed to client).
 * Records the attempt in quiz_attempts.
 * If passed: also marks the lesson complete (upserts lesson_completions).
 *
 * Response: {
 *   score: number,
 *   total: number,
 *   passed: boolean,
 *   results: Array<{ question: string, correct: boolean, selected: number, correct_index: number, explanation: string | null }>
 * }
 */
export async function POST(
  req: NextRequest,
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

  let body: { answers?: unknown; time_taken_seconds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { answers, time_taken_seconds: rawTimeTaken } = body;

  // Validate time_taken_seconds — must be a non-negative integer or absent/null
  let timeTakenSeconds: number | null = null;
  if (rawTimeTaken !== undefined && rawTimeTaken !== null) {
    if (typeof rawTimeTaken !== "number" || !Number.isInteger(rawTimeTaken) || rawTimeTaken < 0) {
      return NextResponse.json(
        { error: "time_taken_seconds must be a non-negative integer." },
        { status: 422 }
      );
    }
    timeTakenSeconds = rawTimeTaken;
  }

  if (!Array.isArray(answers)) {
    return NextResponse.json(
      { error: "answers must be an array of integers." },
      { status: 422 }
    );
  }

  // Validate all entries are integers
  if (!answers.every((a) => Number.isInteger(a))) {
    return NextResponse.json(
      { error: "Each answer must be an integer index." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Verify lesson exists and is active
  const { data: lesson, error: lessonError } = await admin
    .from("training_lessons")
    .select("id, title, category_id")
    .eq("id", lessonId)
    .eq("is_active", true)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  // Fetch quiz questions WITH correct_answer (server-side only)
  const { data: questions, error: questionsError } = await admin
    .from("quiz_questions")
    .select("id, question, options, correct_answer, explanation, priority")
    .eq("lesson_id", lessonId)
    .order("priority", { ascending: true });

  if (questionsError) {
    return NextResponse.json(
      { error: questionsError.message },
      { status: 500 }
    );
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json(
      { error: "No quiz questions found for this lesson." },
      { status: 404 }
    );
  }

  // Validate answer count matches question count
  if (answers.length !== questions.length) {
    return NextResponse.json(
      {
        error: `Expected ${questions.length} answers, received ${answers.length}.`,
      },
      { status: 422 }
    );
  }

  // ── Cooldown check ────────────────────────────────────────────────────────
  // Find the most recent failed attempt for this user+lesson
  const { data: recentFailed } = await admin
    .from("quiz_attempts")
    .select("attempted_at, attempt_number")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .eq("passed", false)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .single();

  if (recentFailed && recentFailed.attempt_number >= FREE_ATTEMPTS_BEFORE_COOLDOWN) {
    const cooldownEndsAt = new Date(recentFailed.attempted_at);
    cooldownEndsAt.setMinutes(cooldownEndsAt.getMinutes() + COOLDOWN_MINUTES);

    if (new Date() < cooldownEndsAt) {
      const minutesLeft = Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: `Please wait ${minutesLeft} minute(s) before retrying.`,
          cooldown: true,
          cooldown_ends_at: cooldownEndsAt.toISOString(),
          minutes_left: minutesLeft,
        },
        { status: 429 }
      );
    }
  }

  // ── Count total attempts to set attempt_number ─────────────────────────────
  const { count: attemptCount } = await admin
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId);

  const attemptNumber = (attemptCount ?? 0) + 1;

  // Grade the quiz
  let score = 0;
  const results = questions.map((q, idx) => {
    const selected = answers[idx] as number;
    const correct = selected === q.correct_answer;
    if (correct) score++;

    return {
      question: q.question,
      correct,
      selected,
      correct_index: q.correct_answer,
      explanation: q.explanation ?? null,
    };
  });

  const total = questions.length;
  const passed = total > 0 && (score / total) * 100 >= PASS_THRESHOLD_PCT;

  // Record the attempt (admin client to bypass RLS insert check)
  const { error: attemptError } = await admin.from("quiz_attempts").insert({
    user_id: user.id,
    lesson_id: lessonId,
    answers: answers,
    score,
    total_questions: total,
    passed,
    attempt_number: attemptNumber,
    ...(timeTakenSeconds !== null ? { time_taken_seconds: timeTakenSeconds } : {}),
  });

  if (attemptError) {
    console.error("quiz_attempts insert error:", attemptError.message);
    return NextResponse.json(
      { error: "Failed to record quiz attempt." },
      { status: 500 }
    );
  }

  // If passed, mark lesson as complete — but only when the lesson has no active triggers.
  // Trigger-based lessons are completed exclusively via the trigger answer route.
  // This is the authoritative gate: if ANY active trigger exists, lesson completion
  // must come through that path, never through quiz submission.
  if (passed) {
    clearQuizQuestionProgress(admin, user.id, lessonId).catch((err) =>
      console.error("[quiz_question_progress] clear failed:", err),
    );

    // Check trigger gate — if lesson has active triggers, block completion from here
    const { data: activeTriggers } = await admin
      .from("lesson_quiz_triggers")
      .select("id")
      .eq("lesson_id", lessonId)
      .eq("is_active", true);

    if (activeTriggers && activeTriggers.length > 0) {
      // Quiz passed but lesson has active triggers — return quiz result only.
      // The trigger answer route will complete the lesson once all triggers are passed.
      return NextResponse.json({
        score,
        total,
        passed: true,
        results,
        lesson_complete: false,
        pending_triggers: true,
        message: "Quiz passed. Complete the in-video questions to finish this lesson.",
      });
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

    // Upsert lesson_completions with time tracking fields
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
    const categoryId = lesson.category_id;
    if (categoryId) {
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

          await admin
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
        }
      }
    }

    // Fire-and-forget: quiz passed email + graduation check
    const pct = Math.round((score / total) * 100);
    admin.auth.admin.getUserById(user.id).then(({ data: authUser }) => {
      const traineeEmail = authUser.user?.email ?? "";
      const traineeName =
        authUser.user?.user_metadata?.full_name ??
        authUser.user?.email?.split("@")[0] ??
        "Trainee";
      if (traineeEmail) {
        sendQuizPassed({
          to: traineeEmail,
          name: traineeName,
          lessonTitle: lesson.title,
          score,
          total,
          pct,
        }).catch(() => {});
      }
    }).catch(() => {});

    // Graduation check — runs after category completion is recorded.
    // The shared helper is idempotent and verifies all lessons are done.
    checkAndAwardTrainingGraduation(user.id).catch((err) =>
      console.error("[training-graduation] check failed:", err)
    );
  }

  return NextResponse.json({ score, total, passed, results });
}
