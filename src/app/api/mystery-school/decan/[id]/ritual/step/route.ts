import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processGraduation } from "@/lib/mystery-school/graduation";

export const dynamic = "force-dynamic";

/**
 * POST /api/mystery-school/decan/[id]/ritual/step
 * Body: { step_index: number }
 * Advances current_step. Enforces sequential progression (step_index must === current_step + 1).
 * When step_index === total_steps → marks ritual complete and sets student_decan_progress.ritual_done = true.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: decanId } = await params;

  const body = await req.json().catch(() => null);
  if (body === null || typeof body.step_index !== "number") {
    return NextResponse.json({ error: "step_index (number) is required" }, { status: 422 });
  }
  const { step_index } = body as { step_index: number };

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });
  }

  const admin = createAdminClient();

  // Fetch current execution row
  const { data: execution, error: execErr } = await admin
    .from("ritual_executions")
    .select("id, current_step, total_steps, is_complete")
    .eq("student_id", student.id)
    .eq("decan_id", decanId)
    .single();

  if (execErr || !execution) {
    return NextResponse.json({ error: "Ritual not started" }, { status: 404 });
  }

  if (execution.is_complete) {
    return NextResponse.json({ error: "Ritual already complete" }, { status: 409 });
  }

  // Enforce sequential: must be exactly current_step + 1
  if (step_index !== execution.current_step + 1) {
    return NextResponse.json(
      {
        error: `Expected step_index ${execution.current_step + 1}, got ${step_index}`,
      },
      { status: 422 }
    );
  }

  const isLastStep = step_index === execution.total_steps;
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = { current_step: step_index };
  if (isLastStep) {
    updatePayload.is_complete = true;
    updatePayload.completed_at = now;
  }

  const { error: updateErr } = await admin
    .from("ritual_executions")
    .update(updatePayload)
    .eq("id", execution.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  if (isLastStep) {
    // Mark ritual_done on student_decan_progress
    await admin
      .from("student_decan_progress")
      .upsert(
        {
          student_id: student.id,
          decan_id: decanId,
          ritual_done: true,
          updated_at: now,
        },
        { onConflict: "student_id,decan_id" }
      );

    // Check overall decan completion
    const { data: progress } = await admin
      .from("student_decan_progress")
      .select("ritual_done, scry_done, journal_done, status")
      .eq("student_id", student.id)
      .eq("decan_id", decanId)
      .single();

    if (
      progress?.ritual_done &&
      progress.scry_done &&
      progress.journal_done &&
      progress.status !== "completed"
    ) {
      await admin
        .from("student_decan_progress")
        .update({ status: "completed", completed_at: now })
        .eq("student_id", student.id)
        .eq("decan_id", decanId);

      // Use the canonical graduation helper which checks Q1 foundation,
      // all 36 decans completed, AND no unexcused missed decans.
      await processGraduation(student.id, admin);
    }
  }

  return NextResponse.json({
    current_step: step_index,
    is_complete: isLastStep,
    completed_at: isLastStep ? now : null,
  });
}
