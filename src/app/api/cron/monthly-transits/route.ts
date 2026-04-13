import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateMonthlyTransits } from "@/lib/astro/transits";
import type { NatalChartData } from "@/lib/astro/natal-chart";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendMonthlyTransitReady } from "@/lib/email";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/monthly-transits
 *
 * Runs on the 1st of each month. Generates monthly transit reports for all
 * active Perennial Mandalism family members that have generated natal charts.
 *
 * Lifecycle states written:
 *   pending   → generation starts
 *   generated → transit data computed successfully
 *   notified  → email delivered
 *   failed    → generation or email failed (surfaced to admin ops)
 *
 * Generation and notification are tracked independently:
 *   - A transit can be 'generated' even if notification fails.
 *   - Failed notifications remain visible to admin for resend.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const admin = createAdminClient();

  // Fetch all family members with generated natal charts whose membership is active
  const { data: familyMembers, error } = await admin
    .from("community_family_members")
    .select(
      `id, full_name, natal_chart, member_id,
       community_members!inner(id, membership_status, email, full_name)`
    )
    .eq("natal_status", "generated")
    .not("natal_chart", "is", null);

  if (error) {
    console.error("[monthly-transits] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let notified = 0;

  for (const fm of familyMembers ?? []) {
    const memberData = (fm.community_members as unknown) as {
      id: string;
      membership_status: string;
      email: string | null;
      full_name: string | null;
    } | null;

    if (memberData?.membership_status !== "active") { skipped++; continue; }
    if (!fm.natal_chart) { skipped++; continue; }

    // Skip if a non-failed transit already exists for this month
    const { data: existing } = await admin
      .from("monthly_transits")
      .select("id, generation_status")
      .eq("family_member_id", fm.id)
      .eq("month", monthStr)
      .maybeSingle();

    if (existing && existing.generation_status !== "failed") {
      skipped++;
      continue;
    }

    const attemptedAt = new Date().toISOString();

    // If a failed record exists, update it in place; otherwise insert
    let transitId: string | null = existing?.id ?? null;

    if (!transitId) {
      // Reserve the row as 'pending' before computation
      const { data: pendingRow, error: insertErr } = await admin
        .from("monthly_transits")
        .insert({
          family_member_id: fm.id,
          month: monthStr,
          transit_data: {},
          generation_status: "pending",
          notification_sent: false,
          last_attempted_at: attemptedAt,
        })
        .select("id")
        .single();

      if (insertErr || !pendingRow) {
        console.error("[monthly-transits] failed to reserve pending row for", fm.id, insertErr);
        failed++;
        continue;
      }
      transitId = pendingRow.id;
    }

    // Compute transit data
    let transitData;
    try {
      transitData = calculateMonthlyTransits(
        fm.natal_chart as NatalChartData,
        year,
        month
      );
    } catch (calcErr) {
      console.error("[monthly-transits] calculation failed for", fm.id, calcErr);
      await admin
        .from("monthly_transits")
        .update({
          generation_status: "failed",
          failure_reason: calcErr instanceof Error ? calcErr.message : "calculation_error",
          retry_count: (existing?.generation_status === "failed" ? 1 : 0) + 1,
          last_attempted_at: attemptedAt,
        })
        .eq("id", transitId);
      failed++;
      continue;
    }

    // Persist generated transit data
    const { error: updateErr } = await admin
      .from("monthly_transits")
      .update({
        transit_data: transitData,
        generation_status: "generated",
        generated_at: attemptedAt,
        failure_reason: null,
        last_attempted_at: attemptedAt,
      })
      .eq("id", transitId);

    if (updateErr) {
      console.error("[monthly-transits] failed to save transit for", fm.id, updateErr);
      failed++;
      continue;
    }

    generated++;

    // ── Send notification — tracked independently from generation ────────────
    if (memberData?.email && memberData.membership_status === "active") {
      try {
        await sendMonthlyTransitReady({
          to: memberData.email,
          name: memberData.full_name ?? "Member",
          month: monthStr,
          familyMemberName: fm.full_name ?? "your family member",
        });

        await admin
          .from("monthly_transits")
          .update({
            generation_status: "notified",
            notification_sent: true,
            notified_at: new Date().toISOString(),
          })
          .eq("id", transitId);

        notified++;
      } catch (emailErr) {
        // Generation succeeded but email failed — stay in 'generated' state.
        // Admin can see notification_sent=false and resend.
        console.error("[monthly-transits] email failed for", fm.id, emailErr);
        await admin
          .from("monthly_transits")
          .update({
            failure_reason: "notification_email_failed",
          })
          .eq("id", transitId);
      }
    }
  }

  console.log(
    `[monthly-transits] month=${monthStr} generated=${generated} notified=${notified} skipped=${skipped} failed=${failed}`
  );
  return NextResponse.json({ generated, notified, skipped, failed, month: monthStr });
}
