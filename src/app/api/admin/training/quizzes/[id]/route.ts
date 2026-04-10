import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listQuizQuestionsCompat,
  normalizeAdminQuizQuestions,
  replaceQuizQuestionsForLessonCompat,
} from "@/lib/training/admin-quiz-questions";

export const dynamic = "force-dynamic";


// GET /api/admin/training/quizzes/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("training_quizzes")
    .select("id, lesson_id, title, questions, pass_score, is_active, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  try {
    const { questions, remediationSupported } = await listQuizQuestionsCompat(
      admin,
      data.lesson_id,
    );
    return NextResponse.json({
      quiz: {
        ...data,
        questions: questions.map((question) => ({
          question: question.question,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation ?? null,
          priority: question.priority ?? 0,
          remediation_video_id: question.remediation_video_id ?? null,
          remediation_video_index: question.remediation_video_index ?? null,
          remediation_start_seconds: question.remediation_start_seconds ?? null,
          remediation_replay_until_seconds:
            question.remediation_replay_until_seconds ?? null,
          remediation_message: question.remediation_message ?? null,
        })),
      },
      remediation_supported: remediationSupported,
    });
  } catch (syncError) {
    return NextResponse.json(
      {
        error:
          syncError instanceof Error ? syncError.message : "Failed to load quiz questions.",
      },
      { status: 500 },
    );
  }
}

// PUT /api/admin/training/quizzes/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    title?: string;
    lesson_id?: string;
    pass_score?: number;
    is_active?: boolean;
    questions?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { title, lesson_id, pass_score, is_active, questions } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!lesson_id) {
    return NextResponse.json(
      { error: "Lesson is required." },
      { status: 400 }
    );
  }
  const normalized = normalizeAdminQuizQuestions(questions);
  if (normalized.error) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existingQuiz, error: existingError } = await admin
    .from("training_quizzes")
    .select("lesson_id")
    .eq("id", id)
    .single();

  if (existingError || !existingQuiz) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  const { data, error } = await admin
    .from("training_quizzes")
    .update({
      title: title.trim(),
      lesson_id,
      pass_score: pass_score ?? 70,
      is_active: is_active ?? true,
      questions: normalized.questions,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    if (existingQuiz.lesson_id !== lesson_id) {
      await replaceQuizQuestionsForLessonCompat(admin, existingQuiz.lesson_id, []);
    }
    const sync = await replaceQuizQuestionsForLessonCompat(
      admin,
      lesson_id,
      normalized.questions,
    );
    return NextResponse.json({
      quiz: data,
      remediation_supported: sync.remediationSupported,
    });
  } catch (syncError) {
    return NextResponse.json(
      {
        error:
          syncError instanceof Error ? syncError.message : "Failed to sync quiz questions.",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/training/quizzes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: existingQuiz } = await admin
    .from("training_quizzes")
    .select("lesson_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin
    .from("training_quizzes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existingQuiz?.lesson_id) {
    await admin.from("quiz_questions").delete().eq("lesson_id", existingQuiz.lesson_id);
  }

  return NextResponse.json({ success: true });
}
