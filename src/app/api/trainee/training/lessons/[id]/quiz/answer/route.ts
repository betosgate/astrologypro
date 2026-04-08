import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
 *     explanation: string | null,
 *     remediation: {
 *       video_id: string | null,
 *       video_index: number | null,
 *       start_seconds: number | null,
 *       replay_until_seconds: number | null,
 *       message: string | null,
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

  // Lookup the question, scoped to the lesson in the URL (object-level
  // authorization — a question from a different lesson cannot be graded via
  // this URL).
  const { data: question, error } = await admin
    .from("quiz_questions")
    .select(
      "id, lesson_id, options, correct_answer, explanation, remediation_video_id, remediation_video_index, remediation_start_seconds, remediation_replay_until_seconds, remediation_message",
    )
    .eq("id", questionId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error || !question) {
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
    return NextResponse.json({ correct: true });
  }

  // Wrong answer — surface remediation metadata so the client can drive the
  // video seek + replay flow. When the question has no remediation set, return
  // remediation: null so the client can fall back to inline retry.
  const hasRemediation =
    question.remediation_start_seconds != null ||
    question.remediation_replay_until_seconds != null ||
    question.remediation_message != null;

  return NextResponse.json({
    correct: false,
    explanation: question.explanation ?? null,
    remediation: hasRemediation
      ? {
          video_id: question.remediation_video_id ?? null,
          video_index: question.remediation_video_index ?? null,
          start_seconds: question.remediation_start_seconds ?? null,
          replay_until_seconds: question.remediation_replay_until_seconds ?? null,
          message: question.remediation_message ?? null,
        }
      : null,
  });
}
