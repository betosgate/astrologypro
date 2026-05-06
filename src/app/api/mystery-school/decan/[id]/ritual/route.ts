import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { requireDecanEligibilityOr403 } from "@/lib/mystery-school/decan-gate";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/decan/[id]/ritual
 * Returns ritual steps (published only) + current student execution state.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Sprint 2026-05-06: hard-block ritual read when Foundation is incomplete.
  const gate = await requireDecanEligibilityOr403(createAdminClient(), user.id);
  if (gate) return gate;

  const { id: decanId } = await params;
  const student = result.student as unknown as { id: string };

  const [stepsRes, execRes] = await Promise.all([
    supabase
      .from("decan_rituals")
      .select("id, step_order, step_type, content, is_published")
      .eq("decan_id", decanId)
      .eq("is_published", true)
      .order("step_order"),
    supabase
      .from("ritual_executions")
      .select("id, current_step, total_steps, started_at, completed_at, is_complete")
      .eq("student_id", student.id)
      .eq("decan_id", decanId)
      .maybeSingle(),
  ]);

  const steps = stepsRes.data ?? [];
  const execution = execRes.data ?? null;

  return NextResponse.json({
    decan_id: decanId,
    steps,
    execution: execution
      ? {
          id: execution.id,
          current_step: execution.current_step,
          total_steps: execution.total_steps,
          started_at: execution.started_at,
          completed_at: execution.completed_at,
          is_complete: execution.is_complete,
        }
      : null,
  });
}
