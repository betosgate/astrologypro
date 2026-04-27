// GET /api/affiliate/dashboard — KPI summary for the authenticated affiliate.
// Aggregates across ALL their diviner partnerships.
//
// 2026-04-24: rewired onto System B (campaign_clicks + campaign_conversions +
// affiliate_campaigns). System A (affiliate_referral_links +
// affiliate_commissions) retired — see
// docs/specs/affiliate-commission-system.md §9.
//
// KPI shape changed: `pending_commission_cents` / `approved_commission_cents`
// / `total_paid_cents` replaced with `total_earned_cents` + `reversed_cents`.
// Phase 1 has no admin approval state machine, and payouts are deferred
// to Phase 2 (Stripe auto-split). The `top_links` key is renamed
// `recent_campaigns` for clarity.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  const { account, junctionIds } = ctx;

  // Zero-partnership affiliate: short-circuit with empty KPIs
  if (junctionIds.length === 0) {
    return NextResponse.json({
      affiliate: {
        id: account.id,
        name: account.name,
        email: account.email,
        status: account.status,
      },
      kpis: {
        total_clicks: 0,
        total_conversions: 0,
        total_earned_cents: 0,
        reversed_cents: 0,
      },
      partnership_count: 0,
      recent_campaigns: [],
    });
  }

  const [{ count: totalClicks }, { data: conversionRows }, { data: recentCampaigns }] =
    await Promise.all([
      admin
        .from("campaign_clicks")
        .select("id", { count: "exact", head: true })
        .in("affiliate_id", junctionIds),
      admin
        .from("campaign_conversions")
        .select("commission_amount_cents, reversed_at")
        .in("affiliate_id", junctionIds),
      admin
        .from("affiliate_campaigns")
        .select("id, campaign_code, name, status, diviner_id")
        .eq("owner_affiliate_type", "diviner_affiliate")
        .in("owner_affiliate_id", junctionIds)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  let earnedCents = 0;
  let reversedCents = 0;
  let totalConversions = 0;
  for (const row of conversionRows ?? []) {
    const amount = Number(row.commission_amount_cents ?? 0);
    if (row.reversed_at) {
      reversedCents += amount;
    } else {
      earnedCents += amount;
      totalConversions++;
    }
  }

  return NextResponse.json({
    affiliate: {
      id: account.id,
      name: account.name,
      email: account.email,
      status: account.status,
    },
    kpis: {
      total_clicks: totalClicks ?? 0,
      total_conversions: totalConversions,
      total_earned_cents: earnedCents,
      reversed_cents: reversedCents,
    },
    partnership_count: junctionIds.length,
    recent_campaigns: recentCampaigns ?? [],
  });
}
