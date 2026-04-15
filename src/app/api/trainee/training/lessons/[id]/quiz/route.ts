import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendQuizPassed } from "@/lib/email";
import { checkAndAwardTrainingGraduation } from "@/lib/training/graduation";
import { clearQuizQuestionProgress } from "@/lib/training/quiz-question-progress";

export const dynamic = "force-dynamic";

const PASS_THRESHOLD_PCT = 100;
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

  // If passed, clear per-question stepwise progress. Lesson completion
  // is now handled exclusively via the manual /complete route.
  if (passed) {
    clearQuizQuestionProgress(admin, user.id, lessonId).catch((err) =>
      console.error("[quiz_question_progress] clear failed:", err),
    );

    // Fire-and-forget: quiz passed email. Graduation and category checks
    // are deferred until the learner clicks "Mark as Complete".
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
  }

  return NextResponse.json({ score, total, passed, results });
}
