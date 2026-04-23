// migrated-to-canonical-accounts: 2026-04-23 (Task 06)
// Reports endpoint: now reads affiliate identity via the canonical join.
// Response shape unchanged — flattened name/email/status per affiliate row.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/affiliates/reports
 *
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

  // Resolve diviner record
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

  // Parse period filter
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "30d";
  const periodStart = getPeriodStart(period);

  // Fetch all data in parallel
  const [affiliatesRes, commissionsRes, linksRes, payoutsRes] = await Promise.all([
    admin
      .from("diviner_affiliates")
      .select(
        `id, name, email, status, created_at,
         account:affiliate_accounts ( id, name, email )`
      )
      .eq("diviner_id", diviner.id),
    admin
      .from("affiliate_commissions")
      .select("id, affiliate_id, order_amount_cents, commission_amount_cents, status, created_at")
      .eq("diviner_id", diviner.id),
    admin
      .from("affiliate_referral_links")
      .select("id, affiliate_id, slug, url, clicks, conversions, is_active, created_at")
      .eq("diviner_id", diviner.id),
    admin
      .from("affiliate_payouts")
      .select("amount_cents, status")
      .eq("diviner_id", diviner.id),
  ]);

  if (affiliatesRes.error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: affiliatesRes.error.message, status: 500 },
      { status: 500 }
    );
  }

  const allAffiliates = affiliatesRes.data ?? [];
  const allCommissions = commissionsRes.data ?? [];
  const allLinks = linksRes.data ?? [];
  const allPayouts = payoutsRes.data ?? [];

  // Filter commissions by period
  const commissions = periodStart
    ? allCommissions.filter((c) => c.created_at >= periodStart)
    : allCommissions;

  // Filter links clicks by period (we use link-level totals; for period filtering
  // we use the affiliate_clicks table if a period is set — but since the links table
  // stores cumulative clicks, we only period-filter commissions and use link totals as-is)

  // ---- Build summary ----
  const totalAffiliates = allAffiliates.length;
  const activeAffiliates = allAffiliates.filter((a) => a.status === "active").length;

  const totalClicks = allLinks.reduce((sum, l) => sum + (Number(l.clicks) || 0), 0);
  const totalConversions = commissions.filter(
    (c) => c.status === "approved" || c.status === "paid"
  ).length;
  const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 1000) / 10 : 0;

  const totalCommissionsPaid = allPayouts.reduce(
    (sum, p) => sum + (Number(p.amount_cents) || 0),
    0
  );
  const totalCommissionsPending = commissions
    .filter((c) => c.status === "pending" || c.status === "approved")
    .reduce((sum, c) => sum + (Number(c.commission_amount_cents) || 0), 0);

  const totalRevenue = commissions.reduce(
    (sum, c) => sum + (Number(c.order_amount_cents) || 0),
    0
  );

  const summary = {
    totalAffiliates,
    activeAffiliates,
    totalClicks,
    totalConversions,
    conversionRate,
    totalCommissionsPaid,
    totalCommissionsPending,
    totalRevenue,
  };

  // ---- Per-affiliate breakdown ----
  const affiliateMap = new Map<
    string,
    {
      clicks: number;
      conversions: number;
      totalCommission: number;
      pendingCommission: number;
      lastActivity: string | null;
    }
  >();

  // Initialize from affiliate list
  for (const aff of allAffiliates) {
    affiliateMap.set(aff.id, {
      clicks: 0,
      conversions: 0,
      totalCommission: 0,
      pendingCommission: 0,
      lastActivity: null,
    });
  }

  // Aggregate link clicks per affiliate
  for (const link of allLinks) {
    const entry = affiliateMap.get(link.affiliate_id);
    if (entry) {
      entry.clicks += Number(link.clicks) || 0;
    }
  }

  // Aggregate commissions per affiliate
  for (const c of commissions) {
    const entry = affiliateMap.get(c.affiliate_id);
    if (!entry) continue;

    if (c.status === "approved" || c.status === "paid") {
      entry.conversions += 1;
      entry.totalCommission += Number(c.commission_amount_cents) || 0;
    }
    if (c.status === "pending" || c.status === "approved") {
      entry.pendingCommission += Number(c.commission_amount_cents) || 0;
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
      // Prefer canonical identity; fall back to legacy columns
      name: aff.account?.name ?? aff.name ?? "",
      email: aff.account?.email ?? aff.email ?? "",
      status: aff.status,
      clicks: stats.clicks,
      conversions: stats.conversions,
      conversionRate: stats.clicks > 0 ? Math.round((stats.conversions / stats.clicks) * 1000) / 10 : 0,
      totalCommission: stats.totalCommission,
      pendingCommission: stats.pendingCommission,
      lastActivity: stats.lastActivity,
    };
  });

  // Sort by totalCommission descending
  affiliates.sort((a, b) => b.totalCommission - a.totalCommission);

  // ---- Monthly breakdown ----
  const monthlyMap = new Map<
    string,
    { clicks: number; conversions: number; commissions: number; revenue: number }
  >();

  for (const c of commissions) {
    const month = c.created_at.slice(0, 7); // "YYYY-MM"
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { clicks: 0, conversions: 0, commissions: 0, revenue: 0 });
    }
    const entry = monthlyMap.get(month)!;
    if (c.status === "approved" || c.status === "paid") {
      entry.conversions += 1;
      entry.commissions += Number(c.commission_amount_cents) || 0;
    }
    entry.revenue += Number(c.order_amount_cents) || 0;
  }

  // We cannot easily split link clicks by month from cumulative totals,
  // so monthly clicks are set to 0 (would require affiliate_clicks table aggregation).
  // For a future improvement, query affiliate_clicks grouped by month.
  const monthly = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      clicks: data.clicks,
      conversions: data.conversions,
      commissions: data.commissions,
      revenue: data.revenue,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ---- Top referral links ----
  const topLinks = allLinks
    .filter((l) => l.is_active)
    .map((l) => ({
      slug: l.slug,
      url: l.url,
      clicks: Number(l.clicks) || 0,
      conversions: Number(l.conversions) || 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return NextResponse.json({
    summary,
    affiliates,
    monthly,
    topLinks,
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
