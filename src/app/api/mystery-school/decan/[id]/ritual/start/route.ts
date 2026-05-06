import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { requireDecanEligibilityOr403 } from "@/lib/mystery-school/decan-gate";

export const dynamic = "force-dynamic";

/**
 * POST /api/mystery-school/decan/[id]/ritual/start
 * Creates a ritual_executions row for this student+decan, or returns the existing one.
 */
export async function POST(
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

  const admin = createAdminClient();

  // Sprint 2026-05-06: hard-block ritual start when Foundation is incomplete.
  const gate = await requireDecanEligibilityOr403(admin, user.id);
  if (gate) return gate;

  const { id: decanId } = await params;
  const student = result.student as unknown as { id: string };

  // Count published steps for total_steps
  const { count: totalSteps } = await admin
    .from("decan_rituals")
    .select("id", { count: "exact", head: true })
    .eq("decan_id", decanId)
    .eq("is_published", true);

  if (!totalSteps || totalSteps === 0) {
    return NextResponse.json({ error: "No published ritual steps for this decan" }, { status: 422 });
  }

  // Upsert — creates row on first call, returns existing on repeat
  const { data: execution, error } = await admin
    .from("ritual_executions")
    .upsert(
      {
        student_id: student.id,
        decan_id: decanId,
        total_steps: totalSteps,
      },
      { onConflict: "student_id,decan_id", ignoreDuplicates: false }
    )
    .select("id, current_step, total_steps, started_at, completed_at, is_complete")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(execution, { status: 200 });
}
