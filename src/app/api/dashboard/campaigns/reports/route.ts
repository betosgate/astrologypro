import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/campaigns/reports
 *
 * Returns campaign performance metrics for the authenticated diviner.
 * Query params: period=30d|90d|1y|all (default: 30d)
 */
export async function GET(request: NextRequest) {
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

  try {
    // Step 1: Fetch diviner's campaigns
    const { data: campaignsData, error: campErr } = await admin
      .from("affiliate_campaigns")
      .select("id, name, status, start_date, end_date, commission_type, commission_value, budget_cap_cents, spent_cents, target_product_type, destination_type, destination_service_template_id, channel, created_at")
      .eq("diviner_id", diviner.id)
      .eq("owner_type", "diviner");

    if (campErr) throw campErr;

    const allCampaigns = campaignsData ?? [];
    const campaignIds = allCampaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalConversions: 0,
          totalRevenue: 0,
          totalCommissionsPaid: 0,
          avgROI: 0,
        },
        campaigns: [],
        monthly: [],
        destination_comparison: [],
        top_services: [],
        channel_performance: [],
      });
    }

    // Step 2: Fetch affiliates, conversions, and clicks for those campaigns in parallel
    const [affiliatesRes, conversionsRes, clicksRes] = await Promise.all([
      admin
        .from("campaign_affiliates")
        .select("campaign_id, affiliate_id, affiliate_type")
        .in("campaign_id", campaignIds),
      admin
        .from("campaign_conversions")
        .select("id, campaign_id, affiliate_id, affiliate_type, order_amount_cents, commission_amount_cents, converted_at")
        .in("campaign_id", campaignIds),
      admin
        .from("campaign_clicks")
        .select("campaign_id, is_bot, is_unique_click")
        .in("campaign_id", campaignIds),
    ]);

    const allCampaignAffiliates = affiliatesRes.data ?? [];
    const allConversions = conversionsRes.data ?? [];
    const allClicks = clicksRes.data ?? [];

    // Filter conversions by period
    const conversions = periodStart
      ? allConversions.filter((c) => c.converted_at >= periodStart)
      : allConversions;

    // ---- Build per-campaign metrics ----
    const campaignAffiliateCount = new Map<string, number>();
    for (const ca of allCampaignAffiliates) {
      campaignAffiliateCount.set(
        ca.campaign_id,
        (campaignAffiliateCount.get(ca.campaign_id) ?? 0) + 1
      );
    }

    const campaignConvMap = new Map<
      string,
      { count: number; revenue: number; commissions: number }
    >();
    for (const c of conversions) {
      const entry = campaignConvMap.get(c.campaign_id) ?? {
        count: 0,
        revenue: 0,
        commissions: 0,
      };
      entry.count += 1;
      entry.revenue += Number(c.order_amount_cents ?? 0);
      entry.commissions += Number(c.commission_amount_cents ?? 0);
      campaignConvMap.set(c.campaign_id, entry);
    }

    // ---- Summary ----
    const activeCampaigns = allCampaigns.filter((c) => c.status === "active").length;
    let totalConversions = 0;
    let totalRevenueCents = 0;
    let totalCommissionsCents = 0;

    for (const [, stats] of campaignConvMap) {
      totalConversions += stats.count;
      totalRevenueCents += stats.revenue;
      totalCommissionsCents += stats.commissions;
    }

    const totalRevenue = totalRevenueCents / 100;
    const totalCommissionsPaid = totalCommissionsCents / 100;
    const avgROI =
      totalCommissionsPaid > 0
        ? Math.round(((totalRevenue - totalCommissionsPaid) / totalCommissionsPaid) * 100 * 10) / 10
        : 0;

    const summary = {
      totalCampaigns: allCampaigns.length,
      activeCampaigns,
      totalConversions,
      totalRevenue: round2(totalRevenue),
      totalCommissionsPaid: round2(totalCommissionsPaid),
      avgROI,
    };

    // ---- Click counts per campaign (shared by list + grouped breakdowns) ----
    const campClickMap = new Map<string, { human: number; unique: number }>();
    for (const c of allClicks) {
      if (c.is_bot) continue;
      const entry = campClickMap.get(c.campaign_id) ?? { human: 0, unique: 0 };
      entry.human++;
      if (c.is_unique_click) entry.unique++;
      campClickMap.set(c.campaign_id, entry);
    }

    // ---- Campaigns list ----
    const campaigns = allCampaigns.map((camp) => {
      const stats = campaignConvMap.get(camp.id) ?? {
        count: 0,
        revenue: 0,
        commissions: 0,
      };
      const budgetCapCents = Number(camp.budget_cap_cents ?? 0);
      const spentCents = Number(camp.spent_cents ?? 0);
      const budgetUsedPct =
        budgetCapCents > 0
          ? Math.round((spentCents / budgetCapCents) * 100 * 10) / 10
          : 0;
      const revenueDollars = round2(stats.revenue / 100);
      const commissionDollars = round2(stats.commissions / 100);
      const roi =
        commissionDollars > 0
          ? Math.round(((revenueDollars - commissionDollars) / commissionDollars) * 100 * 10) / 10
          : 0;
      const clicks = campClickMap.get(camp.id) ?? { human: 0, unique: 0 };

      return {
        id: camp.id,
        name: camp.name,
        status: camp.status,
        startDate: camp.start_date,
        endDate: camp.end_date,
        affiliates: campaignAffiliateCount.get(camp.id) ?? 0,
        clicks: clicks.human,
        uniqueClicks: clicks.unique,
        conversions: stats.count,
        revenue: revenueDollars,
        commissionSpent: commissionDollars,
        budgetCap: round2(budgetCapCents / 100),
        budgetUsedPct,
        roi,
      };
    });

    // Sort by revenue descending
    campaigns.sort((a, b) => b.revenue - a.revenue);

    // ---- Monthly breakdown ----
    const monthlyMap = new Map<
      string,
      { conversions: number; revenue: number; commissions: number }
    >();

    for (const c of conversions) {
      const month = (c.converted_at ?? "").slice(0, 7);
      if (!month) continue;
      const entry = monthlyMap.get(month) ?? {
        conversions: 0,
        revenue: 0,
        commissions: 0,
      };
      entry.conversions += 1;
      entry.revenue += Number(c.order_amount_cents ?? 0);
      entry.commissions += Number(c.commission_amount_cents ?? 0);
      monthlyMap.set(month, entry);
    }

    const monthly = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        conversions: data.conversions,
        revenue: round2(data.revenue / 100),
        commissions: round2(data.commissions / 100),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));


    // ---- Destination comparison: PROFILE vs SERVICE ----
    const destMap = new Map<string, { campaigns: number; conversions: number; revenue: number; human_clicks: number; unique_clicks: number }>();
    for (const camp of allCampaigns) {
      const dtype = (camp as Record<string, unknown>).destination_type as string | null ?? "unset";
      const entry = destMap.get(dtype) ?? { campaigns: 0, conversions: 0, revenue: 0, human_clicks: 0, unique_clicks: 0 };
      entry.campaigns++;
      const convStats = campaignConvMap.get(camp.id) ?? { count: 0, revenue: 0, commissions: 0 };
      entry.conversions += convStats.count;
      entry.revenue += convStats.revenue;
      const clicks = campClickMap.get(camp.id) ?? { human: 0, unique: 0 };
      entry.human_clicks += clicks.human;
      entry.unique_clicks += clicks.unique;
      destMap.set(dtype, entry);
    }
    const destination_comparison = Array.from(destMap.entries()).map(([destination_type, data]) => ({
      destination_type,
      campaigns: data.campaigns,
      conversions: data.conversions,
      revenue: round2(data.revenue / 100),
      human_clicks: data.human_clicks,
      unique_clicks: data.unique_clicks,
      conversion_rate: data.unique_clicks > 0
        ? parseFloat(((data.conversions / data.unique_clicks) * 100).toFixed(1))
        : 0,
    }));

    // ---- Top services: SERVICE campaigns sorted by conversions ----
    const serviceCampaigns = allCampaigns
      .filter((c) => (c as Record<string, unknown>).destination_type === "SERVICE")
      .map((camp) => {
        const convStats = campaignConvMap.get(camp.id) ?? { count: 0, revenue: 0, commissions: 0 };
        const clicks = campClickMap.get(camp.id) ?? { human: 0, unique: 0 };
        return {
          campaign_id: camp.id,
          campaign_name: camp.name,
          service_template_id: (camp as Record<string, unknown>).destination_service_template_id as string | null,
          conversions: convStats.count,
          revenue: round2(convStats.revenue / 100),
          human_clicks: clicks.human,
          unique_clicks: clicks.unique,
        };
      })
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10);
    const top_services = serviceCampaigns;

    // ---- Channel performance ----
    const channelMap = new Map<string, { campaigns: number; conversions: number; revenue: number; human_clicks: number }>();
    for (const camp of allCampaigns) {
      const ch = ((camp as Record<string, unknown>).channel as string | null) ?? "unset";
      const entry = channelMap.get(ch) ?? { campaigns: 0, conversions: 0, revenue: 0, human_clicks: 0 };
      entry.campaigns++;
      const convStats = campaignConvMap.get(camp.id) ?? { count: 0, revenue: 0, commissions: 0 };
      entry.conversions += convStats.count;
      entry.revenue += convStats.revenue;
      const clicks = campClickMap.get(camp.id) ?? { human: 0, unique: 0 };
      entry.human_clicks += clicks.human;
      channelMap.set(ch, entry);
    }
    const channel_performance = Array.from(channelMap.entries())
      .map(([channel, data]) => ({
        channel,
        campaigns: data.campaigns,
        conversions: data.conversions,
        revenue: round2(data.revenue / 100),
        human_clicks: data.human_clicks,
      }))
      .sort((a, b) => b.conversions - a.conversions);

    return NextResponse.json({ summary, campaigns, monthly, destination_comparison, top_services, channel_performance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: message, status: 500 },
      { status: 500 }
    );
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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
