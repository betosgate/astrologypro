import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/quiz/[lessonId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { lessonId } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quiz_questions")
    .select("id, lesson_id, question, options, correct_answer, explanation, priority")
    .eq("lesson_id", lessonId)
    .order("priority", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data ?? [] });
}

// POST /api/admin/training/quiz/[lessonId]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { lessonId } = await params;

  let body: {
    question?: string;
    options?: string[];
    correct_answer?: number;
    explanation?: string | null;
    priority?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { question, options, correct_answer, explanation, priority } = body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "question is required." }, { status: 422 });
  }

  if (!Array.isArray(options) || options.length < 2) {
    return NextResponse.json(
      { error: "options must be an array with at least 2 items." },
      { status: 422 }
    );
  }

  const sanitizedOptions = options.map((o) => String(o).trim()).filter(Boolean);
  if (sanitizedOptions.length < 2) {
    return NextResponse.json(
      { error: "options must contain at least 2 non-empty strings." },
      { status: 422 }
    );
  }

  if (
    correct_answer === undefined ||
    correct_answer === null ||
    typeof correct_answer !== "number" ||
    !Number.isInteger(correct_answer) ||
    correct_answer < 0 ||
    correct_answer >= sanitizedOptions.length
  ) {
    return NextResponse.json(
      { error: "correct_answer must be a valid 0-based index into options." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("quiz_questions")
    .insert({
      lesson_id: lessonId,
      question: question.trim(),
      options: sanitizedOptions,
      correct_answer,
      explanation: explanation?.trim() ?? null,
      priority: priority ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ question: data }, { status: 201 });
}

// DELETE /api/admin/training/quiz/[lessonId]?question_id=
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { lessonId } = await params;
  const questionId = req.nextUrl.searchParams.get("question_id");

  if (!questionId) {
    return NextResponse.json({ error: "question_id query param is required." }, { status: 422 });
  }

  const admin = createAdminClient();

  // Enforce object-level: question must belong to this lesson
  const { data: existing, error: fetchError } = await admin
    .from("quiz_questions")
    .select("id")
    .eq("id", questionId)
    .eq("lesson_id", lessonId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  const { error } = await admin.from("quiz_questions").delete().eq("id", questionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
