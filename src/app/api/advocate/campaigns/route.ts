import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/advocate/campaigns
 *
 * Returns campaign participation and earnings for the authenticated advocate.
 * Query params: period=30d|90d|1y|all (default: 30d)
 */
export async function GET(req: NextRequest) {
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

  // Resolve advocate record
  const { data: advocate } = await supabase
    .from("social_advocates")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!advocate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Advocate not found", status: 404 },
      { status: 404 }
    );
  }

  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") ?? "30d";
  const since = periodToDate(period);

  const db = createAdminClient();

  try {
    // Fetch campaigns this advocate is part of
    const { data: campaignLinks, error: linkErr } = await db
      .from("campaign_affiliates")
      .select("campaign_id, custom_commission_value")
      .eq("affiliate_id", advocate.id)
      .eq("affiliate_type", "advocate");

    if (linkErr) throw linkErr;

    const links = campaignLinks ?? [];
    const campaignIds = links.map((l) => l.campaign_id);

    if (campaignIds.length === 0) {
      return NextResponse.json({
        summary: {
          campaignsJoined: 0,
          activeCampaigns: 0,
          totalConversions: 0,
          totalEarned: 0,
          pendingEarnings: 0,
        },
        campaigns: [],
      });
    }

    // Fetch campaign details and conversions in parallel
    const [campaignsRes, conversionsRes] = await Promise.all([
      db
        .from("affiliate_campaigns")
        .select("id, diviner_id, name, status, start_date, end_date, commission_type, commission_value")
        .in("id", campaignIds),
      db
        .from("campaign_conversions")
        .select("id, campaign_id, order_amount_cents, commission_amount_cents, converted_at")
        .eq("affiliate_id", advocate.id)
        .eq("affiliate_type", "advocate"),
    ]);

    if (campaignsRes.error) throw campaignsRes.error;
    if (conversionsRes.error) throw conversionsRes.error;

    const allCampaigns = campaignsRes.data ?? [];
    const allConversions = conversionsRes.data ?? [];

    // Filter conversions by period
    const conversions = since
      ? allConversions.filter((c) => new Date(c.converted_at) >= since)
      : allConversions;

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

    // Build per-campaign conversion map
    const campaignConvMap = new Map<
      string,
      { count: number; earned: number }
    >();
    for (const c of conversions) {
      const entry = campaignConvMap.get(c.campaign_id) ?? { count: 0, earned: 0 };
      entry.count += 1;
      entry.earned += Number(c.commission_amount_cents ?? 0);
      campaignConvMap.set(c.campaign_id, entry);
    }

    // Build custom commission map
    const customCommMap = new Map<string, number | null>();
    for (const l of links) {
      customCommMap.set(l.campaign_id, l.custom_commission_value ?? null);
    }

    // ---- Summary ----
    let totalConversions = 0;
    let totalEarnedCents = 0;

    for (const [, stats] of campaignConvMap) {
      totalConversions += stats.count;
      totalEarnedCents += stats.earned;
    }

    const activeCampaigns = allCampaigns.filter((c) => c.status === "active").length;

    // Pending earnings: for simplicity, we treat all earned as "pending" since
    // we don't have a paid flag on campaign_conversions.
    // If a payout system exists, this would be adjusted.
    const pendingEarningsCents = totalEarnedCents;

    const summary = {
      campaignsJoined: allCampaigns.length,
      activeCampaigns,
      totalConversions,
      totalEarned: round2(totalEarnedCents / 100),
      pendingEarnings: round2(pendingEarningsCents / 100),
    };

    // ---- Campaign list ----
    const campaigns = allCampaigns.map((camp) => {
      const stats = campaignConvMap.get(camp.id) ?? { count: 0, earned: 0 };
      const customComm = customCommMap.get(camp.id);
      const commissionRate = customComm ?? Number(camp.commission_value ?? 0);

      return {
        campaignName: camp.name,
        divinerName: camp.diviner_id
          ? divinerNameMap.get(camp.diviner_id) ?? "Unknown"
          : "Platform",
        status: camp.status,
        startDate: camp.start_date,
        myConversions: stats.count,
        myEarnings: round2(stats.earned / 100),
        commissionRate,
      };
    });

    // Sort by earnings descending
    campaigns.sort((a, b) => b.myEarnings - a.myEarnings);

    return NextResponse.json({ summary, campaigns });
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
