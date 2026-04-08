import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/training/lessons/[id]/triggers
 * Lists all in-video quiz triggers attached to a lesson, ordered by
 * trigger_timestamp_seconds.
 *
 * POST /api/admin/training/lessons/[id]/triggers
 * Body: {
 *   trigger_timestamp_seconds: number,
 *   rewind_target_seconds?: number,
 *   question_id: string,
 *   priority?: number,
 *   is_active?: boolean,
 * }
 * Creates a new trigger for the given lesson.
 *
 * Both endpoints require admin auth.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("lesson_quiz_triggers")
    .select(
      "id, lesson_id, trigger_timestamp_seconds, rewind_target_seconds, question_id, priority, is_active, created_at",
    )
    .eq("lesson_id", lessonId)
    .order("trigger_timestamp_seconds", { ascending: true });

  if (error) {
    console.error("[admin/training/lessons/[id]/triggers GET]", error);
    return NextResponse.json(
      { error: "Failed to load triggers" },
      { status: 500 },
    );
  }

  return NextResponse.json({ triggers: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const triggerTs = Number(body.trigger_timestamp_seconds);
  const rewindTs = Number(body.rewind_target_seconds ?? 0);
  const questionId = typeof body.question_id === "string" ? body.question_id : "";
  const priority = Number.isFinite(Number(body.priority))
    ? Number(body.priority)
    : 0;
  const isActive =
    typeof body.is_active === "boolean" ? body.is_active : true;

  if (!Number.isFinite(triggerTs) || triggerTs < 0) {
    return NextResponse.json(
      { error: "trigger_timestamp_seconds must be a non-negative number" },
      { status: 422 },
    );
  }
  if (!Number.isFinite(rewindTs) || rewindTs < 0) {
    return NextResponse.json(
      { error: "rewind_target_seconds must be a non-negative number" },
      { status: 422 },
    );
  }
  if (rewindTs > triggerTs) {
    return NextResponse.json(
      {
        error:
          "rewind_target_seconds must be less than or equal to trigger_timestamp_seconds",
      },
      { status: 422 },
    );
  }
  if (!questionId) {
    return NextResponse.json(
      { error: "question_id is required" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // Verify the lesson exists.
  const { data: lesson } = await admin
    .from("training_lessons")
    .select("id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Verify the question exists.
  const { data: question } = await admin
    .from("quiz_questions")
    .select("id")
    .eq("id", questionId)
    .maybeSingle();
  if (!question) {
    return NextResponse.json(
      { error: "Quiz question not found" },
      { status: 404 },
    );
  }

  const { data, error } = await admin
    .from("lesson_quiz_triggers")
    .insert({
      lesson_id: lessonId,
      trigger_timestamp_seconds: Math.round(triggerTs),
      rewind_target_seconds: Math.round(rewindTs),
      question_id: questionId,
      priority,
      is_active: isActive,
    })
    .select(
      "id, lesson_id, trigger_timestamp_seconds, rewind_target_seconds, question_id, priority, is_active, created_at",
    )
    .single();

  if (error) {
    console.error("[admin/training/lessons/[id]/triggers POST]", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ trigger: data }, { status: 201 });
}
