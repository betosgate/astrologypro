import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/decan/[id]/ritual
 * Returns ritual steps (published only) + current student execution state.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: decanId } = await params;

  const { data: member } = await supabase
    .from("community_members")
    .select("membership_type, membership_status")
    .eq("user_id", user.id)
    .single();

  if (
    !member ||
    member.membership_type !== "mystery_school" ||
    member.membership_status !== "active"
  ) {
    return NextResponse.json(
      { error: "Mystery School membership required" },
      { status: 403 }
    );
  }

  const { data: student } = await supabase
    .from("mystery_school_students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });
  }

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
