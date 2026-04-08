import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/training/lessons/[id]/triggers/[triggerId]
 * Body: any subset of {
 *   trigger_timestamp_seconds?: number,
 *   rewind_target_seconds?: number,
 *   question_id?: string,
 *   priority?: number,
 *   is_active?: boolean,
 * }
 *
 * DELETE /api/admin/training/lessons/[id]/triggers/[triggerId]
 *
 * Both endpoints require admin auth and verify the trigger belongs to the
 * lesson in the URL.
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; triggerId: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId, triggerId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.trigger_timestamp_seconds !== undefined) {
    const v = Number(body.trigger_timestamp_seconds);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json(
        { error: "trigger_timestamp_seconds must be a non-negative number" },
        { status: 422 },
      );
    }
    updates.trigger_timestamp_seconds = Math.round(v);
  }
  if (body.rewind_target_seconds !== undefined) {
    const v = Number(body.rewind_target_seconds);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json(
        { error: "rewind_target_seconds must be a non-negative number" },
        { status: 422 },
      );
    }
    updates.rewind_target_seconds = Math.round(v);
  }
  if (typeof body.question_id === "string" && body.question_id) {
    updates.question_id = body.question_id;
  }
  if (Number.isFinite(Number(body.priority))) {
    updates.priority = Number(body.priority);
  }
  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // Cross-validate rewind <= trigger after update.
  const { data: existing } = await admin
    .from("lesson_quiz_triggers")
    .select("trigger_timestamp_seconds, rewind_target_seconds, lesson_id")
    .eq("id", triggerId)
    .maybeSingle();
  if (!existing || existing.lesson_id !== lessonId) {
    return NextResponse.json(
      { error: "Trigger not found for this lesson" },
      { status: 404 },
    );
  }
  const finalTrigger =
    (updates.trigger_timestamp_seconds as number | undefined) ??
    existing.trigger_timestamp_seconds;
  const finalRewind =
    (updates.rewind_target_seconds as number | undefined) ??
    existing.rewind_target_seconds;
  if (finalRewind > finalTrigger) {
    return NextResponse.json(
      {
        error:
          "rewind_target_seconds must be less than or equal to trigger_timestamp_seconds",
      },
      { status: 422 },
    );
  }

  const { data, error } = await admin
    .from("lesson_quiz_triggers")
    .update(updates)
    .eq("id", triggerId)
    .eq("lesson_id", lessonId)
    .select(
      "id, lesson_id, trigger_timestamp_seconds, rewind_target_seconds, question_id, priority, is_active, created_at",
    )
    .single();

  if (error) {
    console.error("[admin/training/.../triggers PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trigger: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; triggerId: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId, triggerId } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("lesson_quiz_triggers")
    .delete()
    .eq("id", triggerId)
    .eq("lesson_id", lessonId);

  if (error) {
    console.error("[admin/training/.../triggers DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
