import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";


// GET /api/admin/training/quizzes/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  return NextResponse.json({ quiz: data });
}

// PUT /api/admin/training/quizzes/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  if (!Array.isArray(questions)) {
    return NextResponse.json(
      { error: "Questions must be an array." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_quizzes")
    .update({
      title: title.trim(),
      lesson_id,
      pass_score: pass_score ?? 70,
      is_active: is_active ?? true,
      questions,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quiz: data });
}

// DELETE /api/admin/training/quizzes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("training_quizzes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
