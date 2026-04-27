import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendMonthlyTransitReady } from "@/lib/email";
import { ensureCurrentMonthTransitsForMember } from "@/lib/community/ensure-monthly-transits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/monthly-transits
 *
 * Runs on the 1st of each month. Generates monthly transit summaries for
 * every active Perennial Mandalism family member that has a generated
 * natal chart, then sends a "your monthly transits are ready" email.
 *
 * Spec source:
 *   tasks/27.04.2026/community-monthly-transit-architecture/05-integrate-generation-triggers.md
 *
 * This route is now a thin orchestration layer over
 * `ensureCurrentMonthTransitsForMember` — the same service powers the
 * mid-month catch-up and lazy-fallback paths so all four triggers share
 * one generator. Email notification stays in the cron because the other
 * triggers (page visit, natal completion) shouldn't email the user.
 *
 * Lifecycle states written by the service:
 *   pending   → generation starts
 *   generated → transit data computed successfully (this route then
 *               attempts the email)
 *   notified  → email delivered (written here, not by the service)
 *   failed    → generation or email failed
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const admin = createAdminClient();

  // ── Find every active Perennial member with at least one eligible
  //    family member (has a generated natal chart).
  //
  //    The cron used to iterate family-member rows directly. We now
  //    iterate at the *member* level so the per-member service handles
  //    the per-family-member loop in one consistent place. This keeps
  //    the generator behaviour identical between cron, lazy fallback,
  //    and natal-completion catch-up.
  const { data: memberRows, error: memberError } = await admin
    .from("community_members")
    .select("id, email, full_name, membership_status")
    .eq("membership_status", "active");

  if (memberError) {
    console.error("[monthly-transits] member query error:", memberError);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  let generated = 0;
  let regenerated = 0;
  let retried = 0;
  let skipped = 0;
  let blocked = 0;
  let failed = 0;
  let notified = 0;

  for (const member of memberRows ?? []) {
    let memberResult;
    try {
      memberResult = await ensureCurrentMonthTransitsForMember(member.id);
    } catch (err) {
      console.error(
        "[monthly-transits] ensure failed for member",
        member.id,
        err
      );
      // Keep the cron going for other members.
      continue;
    }

    generated += memberResult.generated;
    regenerated += memberResult.regenerated;
    retried += memberResult.retried;
    skipped += memberResult.skipped;
    blocked += memberResult.blocked;
    failed += memberResult.failed;

    // ── Email notification for newly-generated rows ─────────────────────
    // Notify on `generated` and `regenerated` (the user effectively has a
    // fresh report), but skip `skipped` (already-current → already
    // notified previously) and `failed` (no report to send). `retried`
    // re-sends notification because the prior failure didn't.
    const newlyAvailable = memberResult.details.filter((d) =>
      d.outcome === "generated" ||
      d.outcome === "regenerated" ||
      d.outcome === "retried"
    );

    if (newlyAvailable.length === 0 || !member.email) continue;

    for (const detail of newlyAvailable) {
      try {
        await sendMonthlyTransitReady({
          to: member.email,
          name: member.full_name ?? "Member",
          month: monthStr,
          familyMemberName: detail.full_name ?? "your family member",
        });

        // Mark the row as notified.
        await admin
          .from("monthly_transits")
          .update({
            generation_status: "notified",
            notification_sent: true,
            notified_at: new Date().toISOString(),
          })
          .eq("family_member_id", detail.family_member_id)
          .eq("month", monthStr);

        notified++;
      } catch (emailErr) {
        // Generation succeeded but email failed — leave row in
        // `generated` state and surface to admin via failure_reason.
        console.error(
          "[monthly-transits] email failed for",
          detail.family_member_id,
          emailErr
        );
        await admin
          .from("monthly_transits")
          .update({ failure_reason: "notification_email_failed" })
          .eq("family_member_id", detail.family_member_id)
          .eq("month", monthStr);
      }
    }
  }

  console.log(
    `[monthly-transits] month=${monthStr} generated=${generated} regenerated=${regenerated} retried=${retried} skipped=${skipped} blocked=${blocked} failed=${failed} notified=${notified}`
  );
  return NextResponse.json({
    month: monthStr,
    generated,
    regenerated,
    retried,
    skipped,
    blocked,
    failed,
    notified,
  });
}
