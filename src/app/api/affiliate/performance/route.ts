import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/performance?period=30d|90d|365d|all
 * Returns the 9 metric-card numbers for the affiliate performance page.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/01-affiliate-performance.md
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const { period, cutoff } = periodCutoffIso(url.searchParams.get("period"));

  const admin = createAdminClient();
  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) {
    return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });
  }
  const affiliateId = (affiliate as { id: string }).id;

  // Conversions in window
  const { data: conversions } = await admin
    .from("campaign_conversions")
    .select(
      "id, commission_amount_cents, paid_amount_cents, order_amount_cents, payout_status, reversed_at, paid_at, converted_at",
    )
    .eq("affiliate_account_id", affiliateId)
    .gte("converted_at", cutoff);

  type Row = Record<string, unknown>;
  const all = (conversions ?? []) as Row[];
  let conversionCount = 0;
  let reversedCount = 0;
  let totalCommission = 0;
  let totalOrder = 0;
  let paidCount = 0;
  let totalDaysToPayout = 0;
  for (const r of all) {
    if (r.reversed_at) {
      reversedCount += 1;
      continue;
    }
    conversionCount += 1;
    totalCommission += Number((r.commission_amount_cents as number | null) ?? 0);
    totalOrder += Number((r.order_amount_cents as number | null) ?? 0);
    if (r.payout_status === "paid" && r.paid_at && r.converted_at) {
      const days =
        (new Date(r.paid_at as string).getTime() -
          new Date(r.converted_at as string).getTime()) /
        86_400_000;
      totalDaysToPayout += days;
      paidCount += 1;
    }
  }

  // Click data — derived from campaign_clicks via campaigns owned by this affiliate
  // Use a reasonable join: any click whose campaign's owner_affiliate_account_id matches
  const { data: campaigns } = await admin
    .from("affiliate_campaigns")
    .select("id")
    .eq("owner_affiliate_account_id", affiliateId);
  const campaignIds = (campaigns ?? []).map(
    (c) => (c as { id: string }).id,
  );

  let totalClicks = 0;
  let uniqueClicks = 0;
  if (campaignIds.length > 0) {
    const { count: clickCount } = await admin
      .from("campaign_clicks")
      .select("id", { count: "exact", head: true })
      .in("campaign_id", campaignIds)
      .eq("is_bot", false)
      .gte("clicked_at", cutoff);
    totalClicks = clickCount ?? 0;

    // Unique by visitor_fingerprint or ip — use ip when fingerprint absent.
    // PostgREST can't do COUNT(DISTINCT), so sample the recent rows.
    const { data: clicks } = await admin
      .from("campaign_clicks")
      .select("visitor_fingerprint, ip_address")
      .in("campaign_id", campaignIds)
      .eq("is_bot", false)
      .gte("clicked_at", cutoff)
      .limit(5000);
    const set = new Set<string>();
    for (const c of (clicks ?? []) as Row[]) {
      const key =
        ((c.visitor_fingerprint as string | null) ??
          (c.ip_address as string | null) ??
          "?") + "";
      set.add(key);
    }
    uniqueClicks = set.size;
  }

  const conversionRate = uniqueClicks > 0 ? conversionCount / uniqueClicks : 0;
  const aovCents = conversionCount > 0 ? Math.round(totalOrder / conversionCount) : 0;
  const avgCommCents = conversionCount > 0 ? Math.round(totalCommission / conversionCount) : 0;
  const effectiveRate = totalOrder > 0 ? totalCommission / totalOrder : 0;
  const totalConversionsAll = conversionCount + reversedCount;
  const reversalRate = totalConversionsAll > 0 ? reversedCount / totalConversionsAll : 0;
  const avgDaysToPayout = paidCount > 0 ? totalDaysToPayout / paidCount : 0;

  return NextResponse.json({
    period,
    cutoff,
    metrics: {
      totalClicks,
      uniqueClicks,
      conversionCount,
      conversionRate,
      totalCommissionCents: totalCommission,
      aovCents,
      avgCommCents,
      effectiveRate,
      reversalRate,
      avgDaysToPayout,
    },
  });
}
