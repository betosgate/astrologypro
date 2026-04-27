import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/advocate/campaigns
 *
 * V2 model: returns affiliate-owned campaigns for the authenticated
 * affiliate (social_advocate OR diviner_affiliate) along with their
 * aggregated click/conversion/commission stats for the requested period.
 *
 * Source of truth: affiliate_campaigns WHERE owner_type='affiliate'.
 * Legacy campaign_affiliates is NOT consulted here.
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

  const db = createAdminClient();

  // Resolve affiliate identity — social_advocate first, then diviner_affiliate
  const { data: advocate } = await db
    .from("social_advocates")
    .select("id, referral_code")
    .eq("user_id", user.id)
    .maybeSingle();

  let affiliateId: string | null = null;
  let affiliateType: "social_advocate" | "diviner_affiliate" | null = null;
  let referralCode: string | null = null;

  if (advocate) {
    affiliateId = advocate.id as string;
    affiliateType = "social_advocate";
    referralCode = (advocate.referral_code as string | null) ?? null;
  } else {
    const { data: divAff } = await db
      .from("diviner_affiliates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (divAff) {
      affiliateId = divAff.id as string;
      affiliateType = "diviner_affiliate";
    }
  }

  if (!affiliateId || !affiliateType) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found", status: 404 },
      { status: 404 }
    );
  }

  const { searchParams } = req.nextUrl;
  const period = searchParams.get("period") ?? "30d";
  const since = periodToDate(period);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://astrologypro.com";

  try {
    // Load affiliate-owned campaigns for this affiliate
    const { data: campaignsData, error: campaignsErr } = await db
      .from("affiliate_campaigns")
      .select(
        `id, diviner_id, name, status, start_date, end_date, campaign_code,
         commission_type, commission_value, commission_type_snapshot,
         commission_value_snapshot, target_product_type, destination_type,
         destination_service_template_id`
      )
      .eq("owner_type", "affiliate")
      .eq("owner_affiliate_id", affiliateId)
      .eq("owner_affiliate_type", affiliateType);

    if (campaignsErr) throw campaignsErr;

    const allCampaigns = campaignsData ?? [];

    if (allCampaigns.length === 0) {
      return NextResponse.json({
        summary: {
          campaignsJoined: 0,
          activeCampaigns: 0,
          totalConversions: 0,
          totalEarned: 0,
          pendingEarnings: 0,
        },
        campaigns: [],
        referralCode: referralCode ?? "",
        appUrl,
      });
    }

    const campaignIds = allCampaigns.map((c) => c.id as string);
    const divinerIds = [
      ...new Set(
        allCampaigns.map((c) => c.diviner_id as string | null).filter(Boolean) as string[]
      ),
    ];
    const templateIds = [
      ...new Set(
        allCampaigns
          .map((c) => c.destination_service_template_id as string | null)
          .filter(Boolean) as string[]
      ),
    ];

    const sinceIso = since ? since.toISOString() : null;

    const [divinersRes, templatesRes, conversionsRes] = await Promise.all([
      divinerIds.length > 0
        ? db
            .from("diviners")
            .select("id, display_name, username")
            .in("id", divinerIds)
        : Promise.resolve({ data: [] as Array<{ id: string; display_name: string | null; username: string | null }> }),
      templateIds.length > 0
        ? db.from("service_templates").select("id, name").in("id", templateIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      (async () => {
        let q = db
          .from("campaign_conversions")
          .select("id, campaign_id, commission_amount_cents, converted_at, reversed_at")
          .in("campaign_id", campaignIds);
        if (sinceIso) q = q.gte("converted_at", sinceIso);
        return q;
      })(),
    ]);

    if ("error" in conversionsRes && conversionsRes.error) throw conversionsRes.error;

    const divinerNameMap = new Map<string, string>();
    const divinerUserMap = new Map<string, string | null>();
    for (const d of (divinersRes.data ?? []) as Array<{ id: string; display_name: string | null; username: string | null }>) {
      divinerNameMap.set(d.id, d.display_name ?? d.username ?? "Diviner");
      divinerUserMap.set(d.id, d.username);
    }
    const templateNameMap = new Map<string, string>();
    for (const t of (templatesRes.data ?? []) as Array<{ id: string; name: string }>) {
      templateNameMap.set(t.id, t.name);
    }

    // Build per-campaign conversion map (exclude reversed conversions
    // from earnings — they were already reversed out).
    const campaignConvMap = new Map<string, { count: number; earned: number }>();
    const conversions = (conversionsRes.data ?? []) as Array<{
      campaign_id: string;
      commission_amount_cents: number | null;
      reversed_at: string | null;
    }>;
    for (const c of conversions) {
      if (c.reversed_at) continue;
      const entry = campaignConvMap.get(c.campaign_id) ?? { count: 0, earned: 0 };
      entry.count += 1;
      entry.earned += Number(c.commission_amount_cents ?? 0);
      campaignConvMap.set(c.campaign_id, entry);
    }

    // Summary
    let totalConversions = 0;
    let totalEarnedCents = 0;
    for (const [, stats] of campaignConvMap) {
      totalConversions += stats.count;
      totalEarnedCents += stats.earned;
    }
    const activeCampaigns = allCampaigns.filter((c) => c.status === "active").length;

    const summary = {
      campaignsJoined: allCampaigns.length,
      activeCampaigns,
      totalConversions,
      totalEarned: round2(totalEarnedCents / 100),
      // Without a payout flag on campaign_conversions, treat all credited
      // earnings as pending.
      pendingEarnings: round2(totalEarnedCents / 100),
    };

    // Shape rows for the UI
    const appUrlNormalized = appUrl.replace(/\/$/, "");
    const campaigns = allCampaigns.map((camp) => {
      const stats = campaignConvMap.get(camp.id as string) ?? { count: 0, earned: 0 };
      const divinerName =
        (camp.diviner_id && divinerNameMap.get(camp.diviner_id as string)) ?? "Diviner";
      // Prefer the frozen snapshot; fall back to the live rate so we never
      // show zero when a legacy row is missing a snapshot.
      const rawType =
        (camp.commission_type_snapshot as string | null) ??
        (camp.commission_type as string | null) ??
        "percent";
      const rawValue =
        camp.commission_value_snapshot != null
          ? Number(camp.commission_value_snapshot)
          : Number(camp.commission_value ?? 0);
      // The UI's fmtCommission() checks for `fixed`; normalize both
      // vocabularies to the legacy keyword the UI expects.
      const commissionType =
        rawType === "flat" || rawType === "fixed" ? "fixed" : "percentage";

      return {
        campaignId: camp.id as string,
        campaignName: (camp.name as string) ?? "Untitled campaign",
        divinerName,
        // All V2 affiliate-owned campaigns are tied to a diviner via their
        // source assignment.
        isDivinerCampaign: true,
        targetProductType: (camp.target_product_type as string | null) ?? "general",
        status: (camp.status as string) ?? "active",
        startDate: (camp.start_date as string | null) ?? null,
        myConversions: stats.count,
        myEarnings: round2(stats.earned / 100),
        commissionRate: rawValue,
        commissionType,
        shareLink: `${appUrlNormalized}/r/${camp.campaign_code}`,
        subId: (camp.campaign_code as string) ?? (camp.id as string).slice(0, 8),
      };
    });

    campaigns.sort((a, b) => b.myEarnings - a.myEarnings);

    return NextResponse.json({
      summary,
      campaigns,
      referralCode: referralCode ?? "",
      appUrl,
    });
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
