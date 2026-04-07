import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/trainee/check-graduation
 * Checks if the authenticated trainee has completed all active lessons.
 * If so, stamps graduated_at and sets training_status = "graduated".
 * Idempotent — safe to call after every lesson completion.
 *
 * Uses lesson_completions (the authoritative completion table used by the
 * current lesson/quiz completion flow) rather than the legacy
 * trainee_lesson_progress table.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: trainee } = await supabase
    .from("trainees")
    .select("id, graduated_at, training_status")
    .eq("user_id", user.id)
    .single();

  if (!trainee) return NextResponse.json({ error: "Trainee not found" }, { status: 404 });

  // Already graduated — nothing to do
  if (trainee.graduated_at) {
    return NextResponse.json({ graduated: true, alreadyGraduated: true });
  }

  const admin = createAdminClient();

  // Count total active lessons across all active programs
  const { count: totalCount } = await admin
    .from("training_lessons")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (!totalCount || totalCount === 0) {
    return NextResponse.json({ graduated: false, reason: "no_lessons" });
  }

  // Count completed lessons for this user from lesson_completions
  // (the authoritative table written by /api/trainee/training/lessons/[id]/complete
  //  and /api/trainee/training/lessons/[id]/quiz)
  const { count: completedCount } = await admin
    .from("lesson_completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((completedCount ?? 0) < totalCount) {
    return NextResponse.json({
      graduated: false,
      completed: completedCount ?? 0,
      total: totalCount,
    });
  }

  // All lessons done — stamp graduation (idempotent: re-read before writing)
  const { data: recheck } = await admin
    .from("trainees")
    .select("graduated_at")
    .eq("id", trainee.id)
    .single();

  if (recheck?.graduated_at) {
    return NextResponse.json({ graduated: true, alreadyGraduated: true });
  }

  const now = new Date().toISOString();
  await admin
    .from("trainees")
    .update({ graduated_at: now, training_status: "graduated" })
    .eq("id", trainee.id);

  return NextResponse.json({ graduated: true, graduatedAt: now });
}
