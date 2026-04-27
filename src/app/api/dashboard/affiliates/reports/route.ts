// GET /api/dashboard/affiliates/reports — diviner-scoped affiliate report.
//
// 2026-04-24: rewired onto System B (campaign_clicks + campaign_conversions
// + affiliate_campaigns). System A (affiliate_commissions +
// affiliate_referral_links + affiliate_payouts) retired — see
// docs/specs/affiliate-commission-system.md §9.
//
// Response shape changes:
// - `summary.totalCommissionsPaid` removed (no payout ledger in Phase 1;
//   Stripe auto-split is deferred to Phase 2).
// - `topLinks` renamed `topCampaigns` and reports `campaign_code` +
//   `name` instead of `slug` + `url`.
// - Per-affiliate `pendingCommission` replaced with `reversedCommission`
//   (no pending state, only earned/reversed).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Returns affiliate performance metrics for the authenticated diviner.
 * Query params: period=30d|90d|1y|all (default: 30d)
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (divinerError || !diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner", status: 403 },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "30d";
  const periodStart = getPeriodStart(period);

  const [affiliatesRes, conversionsRes, campaignsRes, clicksRes] = await Promise.all([
    admin
      .from("diviner_affiliates")
      .select(
        `id, name, email, status, created_at,
         account:affiliate_accounts ( id, name, email )`
      )
      .eq("diviner_id", diviner.id),
    admin
      .from("campaign_conversions")
      .select(
        "id, affiliate_id, campaign_id, order_amount_cents, commission_amount_cents, reversed_at, created_at"
      )
      .eq("affiliate_type", "diviner_affiliate"),
    admin
      .from("affiliate_campaigns")
      .select(
        "id, owner_affiliate_id, owner_affiliate_type, campaign_code, name, status, is_active:status"
      )
      .eq("diviner_id", diviner.id)
      .eq("owner_type", "affiliate")
      .eq("owner_affiliate_type", "diviner_affiliate"),
    admin
      .from("campaign_clicks")
      .select("id, affiliate_id, campaign_id, created_at")
      .eq("diviner_id", diviner.id)
      .eq("affiliate_type", "diviner_affiliate"),
  ]);

  if (affiliatesRes.error) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Database error",
        detail: affiliatesRes.error.message,
        status: 500,
      },
      { status: 500 }
    );
  }

  const allAffiliates = affiliatesRes.data ?? [];
  const allConversions = conversionsRes.data ?? [];
  const allCampaigns = campaignsRes.data ?? [];
  const allClicks = clicksRes.data ?? [];

  // Filter allConversions to only those on this diviner's campaigns.
  // (conversionsRes is not diviner-scoped — campaign_conversions doesn't carry diviner_id.)
  const divinerCampaignIds = new Set(allCampaigns.map((c) => c.id));
  const divinerConversions = allConversions.filter((c) =>
    divinerCampaignIds.has(c.campaign_id)
  );

  // Filter conversions + clicks by period
  const conversions = periodStart
    ? divinerConversions.filter((c) => c.created_at >= periodStart)
    : divinerConversions;
  const clicks = periodStart
    ? allClicks.filter((c) => c.created_at >= periodStart)
    : allClicks;

  // ---- Build summary ----
  const totalAffiliates = allAffiliates.length;
  const activeAffiliates = allAffiliates.filter((a) => a.status === "active").length;

  const totalClicks = clicks.length;
  const totalConversions = conversions.filter((c) => !c.reversed_at).length;
  const conversionRate =
    totalClicks > 0
      ? Math.round((totalConversions / totalClicks) * 1000) / 10
      : 0;

  const totalCommissionsEarned = conversions
    .filter((c) => !c.reversed_at)
    .reduce((sum, c) => sum + (Number(c.commission_amount_cents) || 0), 0);
  const totalCommissionsReversed = conversions
    .filter((c) => c.reversed_at)
    .reduce((sum, c) => sum + (Number(c.commission_amount_cents) || 0), 0);

  const totalRevenue = conversions.reduce(
    (sum, c) => sum + (Number(c.order_amount_cents) || 0),
    0
  );

  const summary = {
    totalAffiliates,
    activeAffiliates,
    totalClicks,
    totalConversions,
    conversionRate,
    totalCommissionsEarned,
    totalCommissionsReversed,
    totalRevenue,
  };

  // ---- Per-affiliate breakdown ----
  const affiliateMap = new Map<
    string,
    {
      clicks: number;
      conversions: number;
      totalCommission: number;
      reversedCommission: number;
      lastActivity: string | null;
    }
  >();

  for (const aff of allAffiliates) {
    affiliateMap.set(aff.id, {
      clicks: 0,
      conversions: 0,
      totalCommission: 0,
      reversedCommission: 0,
      lastActivity: null,
    });
  }

  for (const k of clicks) {
    if (!k.affiliate_id) continue;
    const entry = affiliateMap.get(k.affiliate_id);
    if (entry) entry.clicks += 1;
  }

  for (const c of conversions) {
    const entry = affiliateMap.get(c.affiliate_id);
    if (!entry) continue;
    const amount = Number(c.commission_amount_cents) || 0;
    if (c.reversed_at) {
      entry.reversedCommission += amount;
    } else {
      entry.conversions += 1;
      entry.totalCommission += amount;
    }
    if (!entry.lastActivity || c.created_at > entry.lastActivity) {
      entry.lastActivity = c.created_at;
    }
  }

  type AffiliateRow = {
    id: string;
    name: string | null;
    email: string | null;
    status: string;
    created_at: string;
    account: { id: string; name: string; email: string } | null;
  };
  const affiliates = (allAffiliates as unknown as AffiliateRow[]).map((aff) => {
    const stats = affiliateMap.get(aff.id)!;
    return {
      id: aff.id,
      name: aff.account?.name ?? aff.name ?? "",
      email: aff.account?.email ?? aff.email ?? "",
      status: aff.status,
      clicks: stats.clicks,
      conversions: stats.conversions,
      conversionRate:
        stats.clicks > 0
          ? Math.round((stats.conversions / stats.clicks) * 1000) / 10
          : 0,
      totalCommission: stats.totalCommission,
      reversedCommission: stats.reversedCommission,
      lastActivity: stats.lastActivity,
    };
  });

  affiliates.sort((a, b) => b.totalCommission - a.totalCommission);

  // ---- Monthly breakdown ----
  const monthlyMap = new Map<
    string,
    { clicks: number; conversions: number; commissions: number; revenue: number }
  >();

  for (const k of clicks) {
    const month = k.created_at.slice(0, 7);
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { clicks: 0, conversions: 0, commissions: 0, revenue: 0 });
    }
    monthlyMap.get(month)!.clicks += 1;
  }
  for (const c of conversions) {
    const month = c.created_at.slice(0, 7);
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { clicks: 0, conversions: 0, commissions: 0, revenue: 0 });
    }
    const entry = monthlyMap.get(month)!;
    if (!c.reversed_at) {
      entry.conversions += 1;
      entry.commissions += Number(c.commission_amount_cents) || 0;
    }
    entry.revenue += Number(c.order_amount_cents) || 0;
  }

  const monthly = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      clicks: data.clicks,
      conversions: data.conversions,
      commissions: data.commissions,
      revenue: data.revenue,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ---- Top campaigns ----
  const campaignClicksMap = new Map<string, number>();
  const campaignConvsMap = new Map<string, number>();
  for (const k of clicks) {
    if (!k.campaign_id) continue;
    campaignClicksMap.set(k.campaign_id, (campaignClicksMap.get(k.campaign_id) ?? 0) + 1);
  }
  for (const c of conversions) {
    if (c.reversed_at) continue;
    campaignConvsMap.set(c.campaign_id, (campaignConvsMap.get(c.campaign_id) ?? 0) + 1);
  }
  const topCampaigns = allCampaigns
    .filter((c) => c.status === "active")
    .map((c) => ({
      campaign_code: c.campaign_code,
      name: c.name,
      clicks: campaignClicksMap.get(c.id) ?? 0,
      conversions: campaignConvsMap.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return NextResponse.json({
    summary,
    affiliates,
    monthly,
    topCampaigns,
  });
}

/** Returns an ISO string for the start of the requested period, or null for "all". */
function getPeriodStart(period: string): string | null {
  const now = new Date();
  switch (period) {
    case "30d":
      now.setDate(now.getDate() - 30);
      return now.toISOString();
    case "90d":
      now.setDate(now.getDate() - 90);
      return now.toISOString();
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      return now.toISOString();
    case "all":
      return null;
    default:
      now.setDate(now.getDate() - 30);
      return now.toISOString();
  }
}
