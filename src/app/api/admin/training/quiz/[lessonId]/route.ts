import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  insertQuizQuestionCompat,
  listQuizQuestionsCompat,
  findQuizQuestionCompat,
  normalizeAdminQuizQuestions,
} from "@/lib/training/admin-quiz-questions";

export const dynamic = "force-dynamic";


// GET /api/admin/training/quiz/[lessonId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const admin = createAdminClient();

  try {
    const { questions, remediationSupported } = await listQuizQuestionsCompat(
      admin,
      lessonId,
    );
    return NextResponse.json({
      questions,
      remediation_supported: remediationSupported,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// POST /api/admin/training/quiz/[lessonId]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  let body: {
    question?: string;
    options?: string[];
    correct_answer?: number;
    explanation?: string | null;
    priority?: number;
    remediation_video_id?: string | null;
    remediation_video_index?: number | null;
    remediation_start_seconds?: number | null;
    remediation_replay_until_seconds?: number | null;
    remediation_message?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const normalized = normalizeAdminQuizQuestions([
    {
      question: body.question,
      options: body.options,
      correct_answer: body.correct_answer,
      explanation: body.explanation,
      priority: body.priority,
      remediation_video_id: body.remediation_video_id,
      remediation_video_index: body.remediation_video_index,
      remediation_start_seconds: body.remediation_start_seconds,
      remediation_replay_until_seconds: body.remediation_replay_until_seconds,
      remediation_message: body.remediation_message,
    },
  ]);

  if (normalized.error) {
    return NextResponse.json({ error: normalized.error }, { status: 422 });
  }

  const admin = createAdminClient();
  try {
    const { question, remediationSupported } = await insertQuizQuestionCompat(
      admin,
      lessonId,
      normalized.questions[0],
    );
    return NextResponse.json(
      { question, remediation_supported: remediationSupported },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/training/quiz/[lessonId]?question_id=
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const questionId = req.nextUrl.searchParams.get("question_id");

  if (!questionId) {
    return NextResponse.json({ error: "question_id query param is required." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { question } = await findQuizQuestionCompat(admin, lessonId, questionId);
  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  const { error } = await admin.from("quiz_questions").delete().eq("id", questionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
