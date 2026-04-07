import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import { checkGraduationEligibility, processGraduation } from "@/lib/mystery-school/graduation";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/graduation-check
 * Runs daily at 02:00 UTC.
 *
 * Finds all active Mystery School students whose training_status is not yet
 * 'graduated' but who may have completed all 36 decans and Q1 foundation work.
 * For each candidate, calls checkGraduationEligibility and, if eligible,
 * calls processGraduation to record the graduation and send the email.
 *
 * Students who are blocked (missed decans, incomplete foundation) have their
 * graduation_blocked_reason updated so admins can see why graduation has not fired.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();

  // Find all non-graduated active students who have 36+ completed decans.
  // The subquery acts as a pre-filter to avoid checking every student on every run.
  const { data: candidates, error: candidateError } = await admin
    .from("mystery_school_students")
    .select("id, training_status, user_id")
    .neq("training_status", "graduated")
    .in("status", ["active", "cancelled"]); // cancelled still checks if eligible before access expiry

  if (candidateError) {
    console.error("[graduation-check] Failed to fetch candidates:", candidateError.message);
    return NextResponse.json({ error: candidateError.message }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ checked: 0, graduated: 0, blocked: 0 });
  }

  let checked = 0;
  let graduated = 0;
  let blocked = 0;

  for (const student of candidates) {
    checked++;

    // Pre-check: skip students who haven't finished all 36 decans yet
    // (avoids full eligibility check overhead for students still in progress)
    const { count: completedCount } = await admin
      .from("student_decan_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("status", "completed");

    if ((completedCount ?? 0) < 36) {
      // Not enough decans completed — update blocked reason for admin visibility
      await admin
        .from("mystery_school_students")
        .update({
          graduation_blocked_reason: `${36 - (completedCount ?? 0)} decan(s) remaining`,
        })
        .eq("id", student.id)
        .neq("training_status", "graduated");
      blocked++;
      continue;
    }

    // Full eligibility check
    const eligibility = await checkGraduationEligibility(student.id);

    if (eligibility.eligible) {
      const didGraduate = await processGraduation(student.id, admin);
      if (didGraduate) {
        graduated++;
      }
    } else {
      // Update blocked reason so admins can see why graduation is pending
      await admin
        .from("mystery_school_students")
        .update({
          graduation_blocked_reason: eligibility.blockedReason,
        })
        .eq("id", student.id)
        .neq("training_status", "graduated");
      blocked++;
    }
  }

  console.log(
    `[graduation-check] checked=${checked} graduated=${graduated} blocked=${blocked}`
  );

  return NextResponse.json({ checked, graduated, blocked });
}
