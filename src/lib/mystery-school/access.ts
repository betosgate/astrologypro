/**
 * Mystery School access guard.
 *
 * A user has active Mystery School access when ALL of the following are true:
 *   1. They have a community_members row with membership_type = 'mystery_school'
 *      AND membership_status = 'active'
 *   2. They have a mystery_school_students row with status = 'active'
 *      (or access_expires_at is in the future for cancelled-but-still-paid periods)
 *
 * This check must live in the server/API layer — never in UI only.
 */

import { createClient } from "@/lib/supabase/server";

export interface MysterySchoolStudent {
  id: string;
  user_id: string;
  community_member_id: string | null;
  enrolled_at: string;
  training_status: string;
  entry_quarter: string | null;
  entry_year: number | null;
  enrollment_date: string | null;
  stripe_subscription_id: string | null;
  one_time_fee_paid: boolean;
  status: string;
  paused_at: string | null;
  cancelled_at: string | null;
  access_expires_at: string | null;
  quarters_completed: number;
  target_quarters: number;
}

/**
 * Returns the authenticated user's MysterySchoolStudent record if they have
 * active access, or `null` if they are not enrolled / not active.
 *
 * Checks both community_members (membership gate) and mystery_school_students
 * (lifecycle gate) so access cannot be obtained by manipulating either record
 * in isolation.
 *
 * For cancelled students: access is still granted while `access_expires_at` is
 * in the future, matching the business rule that access revokes at end of paid
 * period — not immediately on cancellation.
 */
export async function requireMysterySchoolAccess(): Promise<{
  student: MysterySchoolStudent;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check community membership gate (RLS enforces user_id = auth.uid())
  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_type, membership_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !member ||
    member.membership_type !== "mystery_school" ||
    member.membership_status !== "active"
  ) {
    return null;
  }

  // Check student lifecycle gate
  // Cast via unknown because Supabase generated types may not yet reflect
  // the new columns added in migration 20260406000020.
  const { data: studentRaw } = await supabase
    .from("mystery_school_students")
    .select(
      "id, user_id, community_member_id, enrolled_at, training_status, " +
      "entry_quarter, entry_year, enrollment_date, stripe_subscription_id, " +
      "one_time_fee_paid, status, paused_at, cancelled_at, access_expires_at, " +
      "quarters_completed, target_quarters"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!studentRaw) return null;

  const student = studentRaw as unknown as MysterySchoolStudent;

  // Active students: straightforward pass
  if (student.status === "active") {
    return { student };
  }

  // Cancelled students with a future access_expires_at still have access
  if (
    student.status === "cancelled" &&
    student.access_expires_at &&
    new Date(student.access_expires_at) > new Date()
  ) {
    return { student };
  }

  // Paused, expired, or cancelled-past-expiry → no access
  return null;
}
