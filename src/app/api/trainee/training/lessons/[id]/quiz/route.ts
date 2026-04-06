import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PASS_THRESHOLD_PCT = 70;

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

  let body: { answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { answers } = body;

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
    .select("id, category_id")
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
  });

  if (attemptError) {
    console.error("quiz_attempts insert error:", attemptError.message);
    return NextResponse.json(
      { error: "Failed to record quiz attempt." },
      { status: 500 }
    );
  }

  // If passed, mark lesson as complete (upsert — idempotent)
  if (passed) {
    await admin
      .from("lesson_completions")
      .upsert(
        { user_id: user.id, lesson_id: lessonId },
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
          await admin
            .from("category_completions")
            .upsert(
              { user_id: user.id, category_id: categoryId },
              { onConflict: "user_id,category_id", ignoreDuplicates: true }
            );
        }
      }
    }
  }

  return NextResponse.json({ score, total, passed, results });
}
