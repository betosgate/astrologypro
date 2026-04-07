/**
 * Mystery School Graduation Logic
 *
 * Graduation requires ALL three of:
 *   1. Q1 foundation complete — all 12 foundation weeks done
 *   2. All 36 decans completed (status = 'completed')
 *   3. No unresolved missed decan (status = 'missed' without admin_excused = true)
 *
 * This is the authoritative graduation eligibility check.
 * Used by the graduation cron and can be called from decan completion events.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendGraduationCongratulations } from "@/lib/email";

const TOTAL_DECANS = 36;
const TOTAL_FOUNDATION_WEEKS = 12;

export interface GraduationEligibilityResult {
  eligible: boolean;
  q1Complete: boolean;
  decansComplete: boolean;
  totalDecans: number;
  completedDecans: number;
  unexcusedMissed: number;
  blockedReason: string | null;
}

/**
 * Checks whether a student is eligible to graduate.
 * Uses the admin client because this is called from server-side cron/service context.
 */
export async function checkGraduationEligibility(
  studentId: string
): Promise<GraduationEligibilityResult> {
  const admin = createAdminClient();

  // 1. Q1 foundation check — count weeks where all tasks are marked done.
  // Filter by week_completed_at IS NOT NULL to avoid counting partial weeks
  // (student_foundation_progress rows are created when the first task is
  //  completed, not when the week is fully done).
  const { count: foundationCount } = await admin
    .from("student_foundation_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .not("week_completed_at", "is", null);

  const q1Complete = (foundationCount ?? 0) >= TOTAL_FOUNDATION_WEEKS;

  // 2. Decan completion check — count completed decans
  const { count: completedDecans } = await admin
    .from("student_decan_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "completed");

  const decansComplete = (completedDecans ?? 0) >= TOTAL_DECANS;

  // 3. Unresolved missed check — any missed decans not excused by admin
  const { count: unexcusedMissed } = await admin
    .from("student_decan_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "missed")
    .eq("admin_excused", false);

  const missedCount = unexcusedMissed ?? 0;

  // Build blocked reason for UI display
  const reasons: string[] = [];
  if (!q1Complete) reasons.push("Foundation Q1 not yet complete");
  if (!decansComplete)
    reasons.push(
      `${TOTAL_DECANS - (completedDecans ?? 0)} decan(s) remaining`
    );
  if (missedCount > 0)
    reasons.push(`${missedCount} unresolved missed decan(s)`);

  const eligible = q1Complete && decansComplete && missedCount === 0;

  return {
    eligible,
    q1Complete,
    decansComplete,
    totalDecans: TOTAL_DECANS,
    completedDecans: completedDecans ?? 0,
    unexcusedMissed: missedCount,
    blockedReason: reasons.length > 0 ? reasons.join("; ") : null,
  };
}

/**
 * Processes graduation for an eligible student.
 * Sets graduated_at, graduation_verified_at, training_status = 'graduated'.
 * Sends the graduation congratulations email.
 *
 * Returns true if graduation was applied, false if student was already graduated
 * or is not eligible.
 */
export async function processGraduation(
  studentId: string,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  const eligibility = await checkGraduationEligibility(studentId);

  if (!eligibility.eligible) {
    return false;
  }

  const now = new Date().toISOString();

  // Update student record — only if not already graduated (prevent double-fire)
  const { data: updated, error } = await adminClient
    .from("mystery_school_students")
    .update({
      training_status: "graduated",
      graduated_at: now,
      graduation_verified_at: now,
      graduation_blocked_reason: null,
    })
    .eq("id", studentId)
    .neq("training_status", "graduated") // idempotent guard
    .select("id, user_id")
    .single();

  if (error || !updated) {
    // Either already graduated or DB error — not a hard failure
    console.warn(`[graduation] processGraduation skipped for ${studentId}:`, error?.message ?? "already graduated");
    return false;
  }

  // Fetch user email for the graduation email via Supabase Auth Admin API
  const { data: authUserData } = await adminClient.auth.admin.getUserById(updated.user_id);
  const authUser = authUserData?.user;

  if (authUser?.email) {
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      (meta.full_name as string) ??
      (meta.name as string) ??
      authUser.email.split("@")[0];

    const graduationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com"}/mystery-school/training/graduation`;

    // Fire-and-forget — graduation email should not block the cron
    sendGraduationCongratulations({
      to: authUser.email,
      name,
      graduationDate: new Date(now).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      graduationUrl,
    }).catch((err) => console.error("[graduation-email]", err));
  }

  console.log(`[graduation] Student ${studentId} graduated at ${now}`);
  return true;
}
