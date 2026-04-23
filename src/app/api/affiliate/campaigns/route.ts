// migrated-to-canonical-accounts: 2026-04-23
// Task 05: resolves the caller via affiliate_accounts (not the legacy
// diviner_affiliates.user_id = auth.uid() lookup). Supports multi-diviner
// affiliates — aggregates across every junction the caller owns.
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import { isAffiliateIdentityV2Enabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/campaigns
 *
 * Returns campaign participation, share links, and earnings for the
 * authenticated diviner affiliate (diviner_affiliates table).
 *
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

  if (!isAffiliateIdentityV2Enabled()) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/503", title: "Feature not available", status: 503 },
      { status: 503 }
    );
  }

  const db = createAdminClient();

  // Resolve caller via canonical account + collect their junction IDs.
  // Multi-diviner affiliates have multiple junctions; every downstream query
  // below filters by the full set.
  const ctx = await resolveAffiliateForCaller(db, user.id);
  if (!ctx) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not an active affiliate", status: 403 },
      { status: 403 }
    );
  }

  // Map diviner_id → junction_id so shareable links use the right ref token.
  const { data: junctionRows } = await db
    .from("diviner_affiliates")
    .select("id, diviner_id")
    .eq("affiliate_account_id", ctx.account.id);
  const junctionByDiviner = new Map<string, string>(
    (junctionRows ?? []).map((j) => [j.diviner_id, j.id]),
  );

  if (ctx.junctionIds.length === 0) {
    return NextResponse.json({
      summary: {
        campaignsJoined: 0,
        activeCampaigns: 0,
        totalConversions: 0,
        totalEarned: 0,
        pendingEarnings: 0,
      },
      campaigns: [],
      monthly: [],
      affiliateId: ctx.account.id,
    });
  }

  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") ?? "30d";
  const since = periodToDate(period);

  try {
    // Fetch campaigns this affiliate is enrolled in (across all junctions)
    const { data: campaignLinks, error: linkErr } = await db
      .from("campaign_affiliates")
      .select("campaign_id, custom_commission_value")
      .in("affiliate_id", ctx.junctionIds)
      .eq("affiliate_type", "diviner_affiliate");

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
        monthly: [],
        affiliateId: ctx.account.id,
      });
    }

    // Fetch campaign details and conversions in parallel
    const [campaignsRes, conversionsRes] = await Promise.all([
      db
        .from("affiliate_campaigns")
        .select(
          "id, diviner_id, name, description, status, start_date, end_date, commission_type, commission_value, budget_cap_cents, target_product_type, utm_campaign, utm_source, utm_medium"
        )
        .in("id", campaignIds),
      db
        .from("campaign_conversions")
        .select("id, campaign_id, order_amount_cents, commission_amount_cents, converted_at")
        .in("affiliate_id", ctx.junctionIds)
        .eq("affiliate_type", "diviner_affiliate"),
    ]);

    if (campaignsRes.error) throw campaignsRes.error;
    if (conversionsRes.error) throw conversionsRes.error;

    const allCampaigns = campaignsRes.data ?? [];
    const allConversions = conversionsRes.data ?? [];

    // Filter conversions by period
    const conversions = since
      ? allConversions.filter((c) => new Date(c.converted_at) >= since)
      : allConversions;

    // Fetch diviner names for campaigns that have a diviner_id
    const divinerIds = [
      ...new Set(allCampaigns.map((c) => c.diviner_id).filter(Boolean)),
    ] as string[];
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

    // Build per-campaign conversion stats
    const campaignConvMap = new Map<string, { count: number; earnedCents: number; orderCents: number }>();
    for (const c of conversions) {
      const entry = campaignConvMap.get(c.campaign_id) ?? { count: 0, earnedCents: 0, orderCents: 0 };
      entry.count += 1;
      entry.earnedCents += Number(c.commission_amount_cents ?? 0);
      entry.orderCents += Number(c.order_amount_cents ?? 0);
      campaignConvMap.set(c.campaign_id, entry);
    }

    // Build custom commission override map
    const customCommMap = new Map<string, number | null>();
    for (const l of links) {
      customCommMap.set(l.campaign_id, l.custom_commission_value ?? null);
    }

    // ── Summary ──────────────────────────────────────────────────
    let totalConversions = 0;
    let totalEarnedCents = 0;

    for (const [, stats] of campaignConvMap) {
      totalConversions += stats.count;
      totalEarnedCents += stats.earnedCents;
    }

    const activeCampaigns = allCampaigns.filter((c) => c.status === "active").length;

    const summary = {
      campaignsJoined: allCampaigns.length,
      activeCampaigns,
      totalConversions,
      totalEarned: round2(totalEarnedCents / 100),
      pendingEarnings: round2(totalEarnedCents / 100), // refined when payout system matures
    };

    // ── Campaign list ─────────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

    const campaigns = allCampaigns.map((camp) => {
      const stats = campaignConvMap.get(camp.id) ?? { count: 0, earnedCents: 0, orderCents: 0 };
      const customComm = customCommMap.get(camp.id);
      const commissionRate = customComm ?? Number(camp.commission_value ?? 0);

      // Build unique share link: base URL + junction-scoped ref + UTM params.
      // For campaigns tied to a specific diviner, use that diviner's junction;
      // otherwise fall back to the first junction (for platform campaigns).
      const refJunctionId = camp.diviner_id
        ? junctionByDiviner.get(camp.diviner_id) ?? ctx.junctionIds[0]
        : ctx.junctionIds[0];
      const utmParams = new URLSearchParams({ ref: refJunctionId });
      if (camp.utm_campaign) utmParams.set("utm_campaign", camp.utm_campaign);
      if (camp.utm_source) utmParams.set("utm_source", camp.utm_source);
      if (camp.utm_medium) utmParams.set("utm_medium", camp.utm_medium);

      const shareLink = `${appUrl}/?${utmParams.toString()}`;

      return {
        campaignId: camp.id,
        campaignName: camp.name,
        description: camp.description ?? null,
        divinerName: camp.diviner_id
          ? (divinerNameMap.get(camp.diviner_id) ?? "Unknown Diviner")
          : "Platform",
        isDivinerCampaign: !!camp.diviner_id,
        targetProductType: camp.target_product_type ?? "general",
        status: camp.status,
        startDate: camp.start_date,
        endDate: camp.end_date ?? null,
        commissionRate,
        commissionType: camp.commission_type ?? "percentage",
        myConversions: stats.count,
        myEarned: round2(stats.earnedCents / 100),
        myOrderVolume: round2(stats.orderCents / 100),
        shareLink,
      };
    });

    // Sort: active first, then by earned desc
    campaigns.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      return b.myEarned - a.myEarned;
    });

    // ── Monthly breakdown ─────────────────────────────────────────
    const monthlyMap = new Map<string, { conversions: number; earnedCents: number }>();
    for (const c of allConversions) {
      const month = (c.converted_at ?? "").slice(0, 7);
      if (!month) continue;
      const entry = monthlyMap.get(month) ?? { conversions: 0, earnedCents: 0 };
      entry.conversions += 1;
      entry.earnedCents += Number(c.commission_amount_cents ?? 0);
      monthlyMap.set(month, entry);
    }

    const monthly = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        conversions: data.conversions,
        earned: round2(data.earnedCents / 100),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({ summary, campaigns, monthly, affiliateId: ctx.account.id });
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
