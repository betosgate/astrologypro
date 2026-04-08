/**
 * Mystery School access guard.
 *
 * Parallel membership model:
 *   - mystery_school_students is the authoritative MS entitlement
 *   - community_members may be PM, MS (legacy), or absent
 *   - A user with both PM community_members AND mystery_school_students
 *     has dual entitlement
 *
 * A user has active Mystery School access when:
 *   - They have a mystery_school_students row with status = 'active'
 *   - OR status = 'cancelled' but access_expires_at is in the future
 *   - OR they are a legacy active community_members mystery_school user,
 *     in which case we provision the missing mystery_school_students row
 *     on demand and then grant access through that record
 *
 * This check must live in the server/API layer — never in UI only.
 */

import { createAdminClient } from "@/lib/supabase/admin";
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
  one_time_fee_amount: number | null;
  start_quarter: string;
  status: string;
  paused_at: string | null;
  cancelled_at: string | null;
  access_expires_at: string | null;
  quarters_completed: number;
  target_quarters: number;
  graduated_at?: string | null;
}

/**
 * Returns the authenticated user's MysterySchoolStudent record if they have
 * active access, or `null` if they are not enrolled / not active.
 *
 * The mystery_school_students table is the single source of truth for MS
 * entitlement (parallel membership model). community_members is NOT checked
 * for membership_type — it may still be 'perennial_mandalism' for dual-
 * entitlement users.
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

  const selectColumns =
    "id, user_id, community_member_id, enrolled_at, training_status, " +
    "entry_quarter, entry_year, enrollment_date, stripe_subscription_id, " +
    "one_time_fee_paid, one_time_fee_amount, start_quarter, status, " +
    "paused_at, cancelled_at, access_expires_at, quarters_completed, " +
    "target_quarters, graduated_at";

  // Check student lifecycle gate — this is the authoritative MS entitlement.
  // Cast via unknown because Supabase generated types may not yet reflect
  // the expanded Mystery School lifecycle columns.
  const { data: studentRaw } = await supabase
    .from("mystery_school_students")
    .select(selectColumns)
    .eq("user_id", user.id)
    .maybeSingle();

  if (studentRaw) {
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
  }

  // Temporary legacy fallback: provision missing mystery_school_students rows
  // for pre-parallel-membership users still stored only in community_members.
  const { data: legacyMember } = await supabase
    .from("community_members")
    .select("id, joined_at, membership_status, stripe_subscription_id")
    .eq("user_id", user.id)
    .eq("membership_type", "mystery_school")
    .maybeSingle();

  if (legacyMember?.membership_status !== "active") {
    return null;
  }

  const admin = createAdminClient();
  const enrolledAt = legacyMember.joined_at ?? new Date().toISOString();
  const { data: provisionedStudent } = await admin
    .from("mystery_school_students")
    .upsert(
      {
        user_id: user.id,
        community_member_id: legacyMember.id,
        enrolled_at: enrolledAt,
        enrollment_date: enrolledAt,
        start_quarter: "next",
        training_status: "foundation",
        stripe_subscription_id: legacyMember.stripe_subscription_id ?? null,
        one_time_fee_paid: true,
        one_time_fee_amount: 97.0,
        status: "active",
      },
      { onConflict: "user_id" }
    )
    .select(selectColumns)
    .single();

  if (!provisionedStudent) {
    return null;
  }

  return { student: provisionedStudent as unknown as MysterySchoolStudent };
}
