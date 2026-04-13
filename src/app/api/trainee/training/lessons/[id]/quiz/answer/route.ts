import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listQuizQuestionsCompat } from "@/lib/training/admin-quiz-questions";
import { upsertCorrectQuizQuestionProgress } from "@/lib/training/quiz-question-progress";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/training/lessons/[id]/quiz/answer
 * Body: { question_id: string, answer_index: number }
 *
 * Module 05: per-question grading for the new stepwise lesson quiz flow.
 * Replaces the end-of-quiz batch submission model. Grades a single answer
 * server-side (correct_answer never exposed to the client) and returns
 * remediation metadata when wrong.
 *
 * The legacy batch endpoint (.../quiz POST) is preserved alongside this for
 * any caller still using it.
 *
 * Response (correct):
 *   { correct: true }
 *
 * Response (incorrect):
 *   {
 *     correct: false,
 *     remediation: {
 *       video_id: string | null,
 *       video_index: number | null,
 *       start_seconds: number | null,
 *       replay_until_seconds: number | null,
 *       message: null,
 *     } | null   // null when this question has no remediation metadata
 *   }
 *
 * Errors: 401 unauth, 422 invalid body, 404 question not found / wrong lesson
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;

  let body: { question_id?: unknown; answer_index?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const questionId =
    typeof body.question_id === "string" ? body.question_id.trim() : "";
  const answerIndex = body.answer_index;

  if (!questionId) {
    return NextResponse.json(
      { error: "question_id is required (string)" },
      { status: 422 },
    );
  }
  if (
    typeof answerIndex !== "number" ||
    !Number.isInteger(answerIndex) ||
    answerIndex < 0
  ) {
    return NextResponse.json(
      { error: "answer_index must be a non-negative integer" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  const { questions } = await listQuizQuestionsCompat(admin, lessonId);
  const question = questions.find((candidate) => candidate.id === questionId);

  if (!question) {
    return NextResponse.json(
      { error: "Question not found for this lesson" },
      { status: 404 },
    );
  }

  const optionCount = Array.isArray(question.options) ? question.options.length : 0;
  if (answerIndex >= optionCount) {
    return NextResponse.json(
      { error: "answer_index out of range" },
      { status: 422 },
    );
  }

  const isCorrect = answerIndex === question.correct_answer;

  if (isCorrect) {
    const progress = await upsertCorrectQuizQuestionProgress(admin, {
      userId: user.id,
      lessonId,
      questionId,
      selectedAnswer: answerIndex,
    });
    return NextResponse.json({
      correct: true,
      quiz_progress_supported: progress.supported,
    });
  }

  // Wrong answer — surface only remediation timing metadata so the client can
  // drive the video seek + replay flow. Do not return explanations or hints on
  // wrong answers; those can reveal the answer before the learner succeeds.
  const hasRemediation =
    question.remediation_start_seconds != null ||
    question.remediation_replay_until_seconds != null;

  return NextResponse.json({
    correct: false,
    remediation: hasRemediation
      ? {
          video_id: question.remediation_video_id ?? null,
          video_index: question.remediation_video_index ?? null,
          start_seconds: question.remediation_start_seconds ?? null,
          replay_until_seconds: question.remediation_replay_until_seconds ?? null,
          message: null,
        }
      : null,
  });
}
