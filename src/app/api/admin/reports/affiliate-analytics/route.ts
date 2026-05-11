import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/affiliate-analytics?period=30d|90d|365d|all
 * Returns the 9 platform-level metrics shown on the admin analytics page.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/03-admin-analytics.md
 */
export async function GET(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const { period, cutoff } = periodCutoffIso(url.searchParams.get("period"));

  const admin = createAdminClient();

  // 1. Total commission paid out + 4. avg payout amount
  const { data: completedPayouts } = await admin
    .from("affiliate_payouts")
    .select("net_transferred_cents")
    .eq("status", "completed")
    .gte("transferred_at", cutoff);
  const totalPaidCents = (completedPayouts ?? []).reduce(
    (s, r) =>
      s + Number((r as { net_transferred_cents: number | null }).net_transferred_cents ?? 0),
    0,
  );
  const avgPayoutCents =
    (completedPayouts ?? []).length > 0
      ? Math.round(totalPaidCents / (completedPayouts ?? []).length)
      : 0;

  // 2. Outstanding commission
  const { data: outstanding } = await admin
    .from("campaign_conversions")
    .select("commission_amount_cents, payout_status")
    .in("payout_status", ["unpaid", "ripe", "paying"])
    .is("reversed_at", null);
  const outstandingCents = (outstanding ?? []).reduce(
    (s, r) =>
      s + Number((r as { commission_amount_cents: number | null }).commission_amount_cents ?? 0),
    0,
  );

  // 3. Median time-to-payout (RPC)
  const { data: medianRpc } = await admin.rpc(
    "affiliate_median_time_to_payout_days",
    { p_cutoff: cutoff },
  );
  const medianDaysToPayout = Number(medianRpc ?? 0);

  // 5. Payout success rate
  const { count: completedCount } = await admin
    .from("affiliate_payouts")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("created_at", cutoff);
  const { count: failedCount } = await admin
    .from("affiliate_payouts")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("created_at", cutoff);
  const successRateDenom = (completedCount ?? 0) + (failedCount ?? 0);
  const payoutSuccessRate =
    successRateDenom > 0 ? (completedCount ?? 0) / successRateDenom : 0;

  // 6. Reversal rate (over the window)
  const { count: totalConversions } = await admin
    .from("campaign_conversions")
    .select("id", { count: "exact", head: true })
    .gte("converted_at", cutoff);
  const { count: reversedConversions } = await admin
    .from("campaign_conversions")
    .select("id", { count: "exact", head: true })
    .gte("converted_at", cutoff)
    .not("reversed_at", "is", null);
  const reversalRate =
    (totalConversions ?? 0) > 0
      ? (reversedConversions ?? 0) / (totalConversions ?? 0)
      : 0;

  // 7. Refund-after-payout rate
  const { count: paidConversions } = await admin
    .from("campaign_conversions")
    .select("id", { count: "exact", head: true })
    .eq("payout_status", "paid")
    .gte("paid_at", cutoff);
  const { count: offsetAppliedConversions } = await admin
    .from("campaign_conversions")
    .select("id", { count: "exact", head: true })
    .eq("payout_status", "offset_applied")
    .gte("paid_at", cutoff);
  const refundAfterPayoutDenom =
    (paidConversions ?? 0) + (offsetAppliedConversions ?? 0);
  const refundAfterPayoutRate =
    refundAfterPayoutDenom > 0
      ? (offsetAppliedConversions ?? 0) / refundAfterPayoutDenom
      : 0;

  // 8. Commission as % of GMV
  const { data: gmv } = await admin
    .from("campaign_conversions")
    .select("order_amount_cents, commission_amount_cents")
    .is("reversed_at", null)
    .gte("converted_at", cutoff);
  let totalGross = 0;
  let totalCommission = 0;
  for (const r of (gmv ?? []) as Array<Record<string, unknown>>) {
    totalGross += Number((r.order_amount_cents as number | null) ?? 0);
    totalCommission += Number((r.commission_amount_cents as number | null) ?? 0);
  }
  const commissionPctOfGmv = totalGross > 0 ? totalCommission / totalGross : 0;

  // 9. Active affiliate count
  const { data: activeAffiliates } = await admin
    .from("campaign_conversions")
    .select("affiliate_account_id")
    .gte("converted_at", cutoff)
    .is("reversed_at", null);
  const activeSet = new Set<string>();
  for (const r of (activeAffiliates ?? []) as Array<Record<string, unknown>>) {
    const id = r.affiliate_account_id as string | null;
    if (id) activeSet.add(id);
  }

  return NextResponse.json({
    period,
    cutoff,
    metrics: {
      totalPaidCents,
      outstandingCents,
      medianDaysToPayout,
      avgPayoutCents,
      payoutSuccessRate,
      reversalRate,
      refundAfterPayoutRate,
      commissionPctOfGmv,
      activeAffiliateCount: activeSet.size,
    },
  });
}
