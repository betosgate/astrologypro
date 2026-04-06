import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateMonthlyTransits } from "@/lib/astro/transits";
import type { NatalChartData } from "@/lib/astro/natal-chart";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendMonthlyTransitReady } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/monthly-transits
 * Runs on the 1st of each month. Generates transit reports for all active
 * community family members that have natal charts.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const admin = createAdminClient();

  // Fetch all family members with natal charts whose community membership is active
  const { data: familyMembers, error } = await admin
    .from("community_family_members")
    .select(
      `id, full_name, natal_chart,
       community_members!inner(membership_status)`
    )
    .not("natal_chart", "is", null);

  if (error) {
    console.error("[monthly-transits] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let generated = 0;
  let skipped = 0;

  for (const fm of familyMembers ?? []) {
    const memberData = (fm.community_members as unknown) as { membership_status: string } | null;
    if (memberData?.membership_status !== "active") { skipped++; continue; }
    if (!fm.natal_chart) { skipped++; continue; }

    // Skip if already generated this month
    const { count } = await admin
      .from("monthly_transits")
      .select("id", { count: "exact", head: true })
      .eq("family_member_id", fm.id)
      .eq("month", monthStr);

    if ((count ?? 0) > 0) { skipped++; continue; }

    const transitData = calculateMonthlyTransits(
      fm.natal_chart as NatalChartData,
      year,
      month
    );

    const { data: newTransit } = await admin
      .from("monthly_transits")
      .insert({
        family_member_id: fm.id,
        month: monthStr,
        transit_data: transitData,
        notification_sent: false,
      })
      .select("id")
      .single();

    generated++;

    // Send transit-ready email to the member who owns this family member
    // Only send if insert succeeded and notification not yet sent
    if (newTransit?.id) {
      try {
        // Fetch the owning community_member's email
        const { data: familyRow } = await admin
          .from("community_family_members")
          .select("full_name, member_id")
          .eq("id", fm.id)
          .single();

        if (familyRow?.member_id) {
          const { data: ownerMember } = await admin
            .from("community_members")
            .select("email, full_name, membership_status")
            .eq("id", familyRow.member_id)
            .single();

          if (
            ownerMember?.email &&
            ownerMember.membership_status === "active"
          ) {
            await sendMonthlyTransitReady({
              to: ownerMember.email,
              name: ownerMember.full_name ?? "Member",
              month: monthStr,
              familyMemberName: familyRow.full_name ?? fm.full_name ?? "your family member",
            });

            await admin
              .from("monthly_transits")
              .update({ notification_sent: true })
              .eq("id", newTransit.id);
          }
        }
      } catch (emailErr) {
        console.error("[monthly-transits] Failed to send transit-ready email for", fm.id, emailErr);
      }
    }
  }

  console.log(`[monthly-transits] generated=${generated} skipped=${skipped} month=${monthStr}`);
  return NextResponse.json({ generated, skipped, month: monthStr });
}
