import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listQuizQuestionsCompat,
  normalizeAdminQuizQuestions,
  replaceQuizQuestionsForLessonCompat,
} from "@/lib/training/admin-quiz-questions";

export const dynamic = "force-dynamic";

type TrainingQuizRow = {
  id: string;
  lesson_id: string;
  title: string | null;
  questions: unknown;
  pass_score: number | null;
  is_active: boolean | null;
  created_at: string;
};

async function findQuizByIdOrLessonId(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
) {
  const byId = await admin
    .from("training_quizzes")
    .select("id, lesson_id, title, questions, pass_score, is_active, created_at")
    .eq("id", id)
    .maybeSingle();

  if (byId.error) throw byId.error;
  if (byId.data) {
    return {
      quiz: byId.data as TrainingQuizRow,
      synthetic: false,
    };
  }

  const byLesson = await admin
    .from("training_quizzes")
    .select("id, lesson_id, title, questions, pass_score, is_active, created_at")
    .eq("lesson_id", id)
    .maybeSingle();

  if (byLesson.error) throw byLesson.error;
  if (byLesson.data) {
    return {
      quiz: byLesson.data as TrainingQuizRow,
      synthetic: false,
    };
  }

  const lesson = await admin
    .from("training_lessons")
    .select("id, title, is_active, created_at")
    .eq("id", id)
    .maybeSingle();

  if (lesson.error) throw lesson.error;
  if (!lesson.data) {
    return { quiz: null, synthetic: false };
  }

  const { questions } = await listQuizQuestionsCompat(admin, id);
  if (questions.length === 0) {
    return { quiz: null, synthetic: false };
  }

  return {
      quiz: {
        id: id,
        lesson_id: id,
        title: lesson.data.title ? `${lesson.data.title} Quiz` : "Lesson Quiz",
        questions: [],
        pass_score: 100,
        is_active: lesson.data.is_active ?? true,
        created_at: lesson.data.created_at,
      },
    synthetic: true,
  };
}

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

  try {
    const { quiz } = await findQuizByIdOrLessonId(admin, id);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
    }

    const { questions, remediationSupported } = await listQuizQuestionsCompat(
      admin,
      quiz.lesson_id,
    );
    return NextResponse.json({
      quiz: {
        ...quiz,
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
  const existing = await findQuizByIdOrLessonId(admin, id);

  if (!existing.quiz) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  const payload = {
    title: title.trim(),
    lesson_id,
    pass_score: 100,
    is_active: is_active ?? true,
    questions: normalized.questions,
  };

  const result = existing.synthetic
    ? await admin
        .from("training_quizzes")
        .insert(payload)
        .select()
        .single()
    : await admin
        .from("training_quizzes")
        .update(payload)
        .eq("id", existing.quiz.id)
        .select()
        .single();

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  try {
    if (existing.quiz.lesson_id !== lesson_id) {
      await replaceQuizQuestionsForLessonCompat(admin, existing.quiz.lesson_id, []);
    }
    const sync = await replaceQuizQuestionsForLessonCompat(
      admin,
      lesson_id,
      normalized.questions,
    );
    return NextResponse.json({
      quiz: result.data,
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

  let existing: Awaited<ReturnType<typeof findQuizByIdOrLessonId>>;
  try {
    existing = await findQuizByIdOrLessonId(admin, id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }

  if (!existing.quiz) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  const { error } = existing.synthetic
    ? { error: null }
    : await admin
        .from("training_quizzes")
        .delete()
        .eq("id", existing.quiz.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing.quiz.lesson_id) {
    await admin.from("quiz_questions").delete().eq("lesson_id", existing.quiz.lesson_id);
  }

  return NextResponse.json({ success: true });
}
