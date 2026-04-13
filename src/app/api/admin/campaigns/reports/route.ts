import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/campaigns/reports
 *
 * Returns platform-wide campaign performance metrics for admin.
 * Query params: period=30d|90d|1y|all (default: 30d)
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") ?? "30d";
  const since = periodToDate(period);

  const db = createAdminClient();

  try {
    // Fetch all campaigns
    const { data: campaignsData, error: campErr } = await db
      .from("affiliate_campaigns")
      .select("id, diviner_id, name, status, start_date, end_date, commission_type, commission_value, budget_cap_cents, spent_cents, target_product_type, created_at");

    if (campErr) throw campErr;

    const allCampaigns = campaignsData ?? [];
    const campaignIds = allCampaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalCampaigns: 0,
          activeCampaigns: 0,
          platformWideCampaigns: 0,
          divinerCampaigns: 0,
          totalConversions: 0,
          totalRevenue: 0,
          totalCommissions: 0,
        },
        byDiviner: [],
        topCampaigns: [],
        monthly: [],
      });
    }

    // Fetch conversions for all campaigns
    let conversionsQuery = db
      .from("campaign_conversions")
      .select("id, campaign_id, affiliate_id, affiliate_type, order_amount_cents, commission_amount_cents, converted_at")
      .in("campaign_id", campaignIds);

    if (since) {
      conversionsQuery = conversionsQuery.gte("converted_at", since.toISOString());
    }

    const { data: conversionsData, error: convErr } = await conversionsQuery;
    if (convErr) throw convErr;

    const allConversions = conversionsData ?? [];

    // Fetch diviner names
    const divinerIds = [...new Set(allCampaigns.map((c) => c.diviner_id).filter(Boolean))];
    const divinerNameMap = new Map<string, string>();
    if (divinerIds.length > 0) {
      const { data: diviners } = await db
        .from("diviners")
        .select("id, display_name")
        .in("id", divinerIds);
      for (const d of diviners ?? []) {
        divinerNameMap.set(d.id, d.display_name ?? "Unknown");
      }
    }

    // ---- Aggregate per campaign ----
    const campaignConvMap = new Map<
      string,
      { count: number; revenue: number; commissions: number }
    >();
    for (const c of allConversions) {
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
    // Platform-wide = campaigns without a diviner_id (or with a special flag)
    const platformWideCampaigns = allCampaigns.filter((c) => !c.diviner_id).length;
    const divinerCampaigns = allCampaigns.filter((c) => !!c.diviner_id).length;

    let totalConversions = 0;
    let totalRevenueCents = 0;
    let totalCommissionsCents = 0;

    for (const [, stats] of campaignConvMap) {
      totalConversions += stats.count;
      totalRevenueCents += stats.revenue;
      totalCommissionsCents += stats.commissions;
    }

    const summary = {
      totalCampaigns: allCampaigns.length,
      activeCampaigns,
      platformWideCampaigns,
      divinerCampaigns,
      totalConversions,
      totalRevenue: round2(totalRevenueCents / 100),
      totalCommissions: round2(totalCommissionsCents / 100),
    };

    // ---- By Diviner breakdown ----
    const divinerAgg = new Map<
      string,
      { campaigns: number; conversions: number; revenue: number }
    >();

    for (const camp of allCampaigns) {
      const did = camp.diviner_id as string;
      if (!did) continue;
      const entry = divinerAgg.get(did) ?? { campaigns: 0, conversions: 0, revenue: 0 };
      entry.campaigns += 1;
      const stats = campaignConvMap.get(camp.id);
      if (stats) {
        entry.conversions += stats.count;
        entry.revenue += stats.revenue;
      }
      divinerAgg.set(did, entry);
    }

    const byDiviner = Array.from(divinerAgg.entries())
      .map(([did, data]) => ({
        divinerName: divinerNameMap.get(did) ?? "Unknown",
        campaigns: data.campaigns,
        conversions: data.conversions,
        revenue: round2(data.revenue / 100),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ---- Top Campaigns ----
    const topCampaigns = allCampaigns
      .map((camp) => {
        const stats = campaignConvMap.get(camp.id) ?? {
          count: 0,
          revenue: 0,
          commissions: 0,
        };
        return {
          name: camp.name,
          divinerName: camp.diviner_id
            ? divinerNameMap.get(camp.diviner_id) ?? "Unknown"
            : "Platform",
          conversions: stats.count,
          revenue: round2(stats.revenue / 100),
          status: camp.status,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    // ---- Monthly breakdown ----
    const monthlyMap = new Map<
      string,
      { conversions: number; revenue: number; commissions: number }
    >();

    for (const c of allConversions) {
      const month = toMonthKey(c.converted_at);
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

    return NextResponse.json({ summary, byDiviner, topCampaigns, monthly });
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

function toMonthKey(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodToDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case "all":
    default:
      return null;
  }
}
