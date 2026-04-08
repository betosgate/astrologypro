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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quiz_questions")
    .select(
      "id, lesson_id, question, options, correct_answer, explanation, priority, remediation_video_id, remediation_video_index, remediation_start_seconds, remediation_replay_until_seconds, remediation_message",
    )
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

  const {
    question,
    options,
    correct_answer,
    explanation,
    priority,
    remediation_video_id,
    remediation_video_index,
    remediation_start_seconds,
    remediation_replay_until_seconds,
    remediation_message,
  } = body;

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

  // Module 04 remediation metadata validation. All fields nullable; if any
  // start/replay value is supplied, the pair must be coherent (replay > start).
  const remStart =
    typeof remediation_start_seconds === "number" &&
    Number.isFinite(remediation_start_seconds) &&
    remediation_start_seconds >= 0
      ? Math.round(remediation_start_seconds)
      : null;
  const remReplay =
    typeof remediation_replay_until_seconds === "number" &&
    Number.isFinite(remediation_replay_until_seconds) &&
    remediation_replay_until_seconds >= 0
      ? Math.round(remediation_replay_until_seconds)
      : null;
  if (remStart !== null && remReplay !== null && remReplay <= remStart) {
    return NextResponse.json(
      {
        error:
          "remediation_replay_until_seconds must be greater than remediation_start_seconds.",
      },
      { status: 422 },
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
      remediation_video_id: remediation_video_id ?? null,
      remediation_video_index:
        typeof remediation_video_index === "number" &&
        Number.isInteger(remediation_video_index) &&
        remediation_video_index >= 0
          ? remediation_video_index
          : null,
      remediation_start_seconds: remStart,
      remediation_replay_until_seconds: remReplay,
      remediation_message: remediation_message?.trim() || null,
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
