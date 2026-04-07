import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";


/**
 * GET /api/admin/quiz-drafts/:id
 * Returns a single draft.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("quiz_generation_drafts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

/**
 * PUT /api/admin/quiz-drafts/:id
 * Approve a draft: saves the questions to training_quizzes and marks the draft approved.
 * Body: { questions: QuizQuestion[], title: string, lessonId: string, passScore: number }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { questions, title, lessonId, passScore } = await request.json();

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Upsert quiz record
  const { data: quiz, error: quizError } = await admin
    .from("training_quizzes")
    .upsert(
      {
        lesson_id: lessonId,
        title: title ?? "Auto-generated Quiz",
        questions: questions ?? [],
        pass_score: passScore ?? 70,
        is_active: true,
      },
      { onConflict: "lesson_id" }
    )
    .select("id")
    .single();

  if (quizError) {
    console.error("[quiz-drafts] upsert error:", quizError);
    return NextResponse.json({ error: quizError.message }, { status: 500 });
  }

  // Mark draft as approved
  await admin
    .from("quiz_generation_drafts")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ success: true, quizId: quiz?.id });
}

/**
 * DELETE /api/admin/quiz-drafts/:id
 * Marks draft as discarded.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  await admin
    .from("quiz_generation_drafts")
    .update({ status: "discarded", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
