// GET /api/affiliate/reports/overview
// Affiliate-scoped KPIs across all the caller's junction partnerships.
//
// Spec: docs/specs/affiliate-commission-system.md §6.3

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import {
  parseReportPeriod,
  reportPeriodSince,
} from "@/lib/affiliate-report-period";

export const dynamic = "force-dynamic";

function problem(status: number, title: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.io/${status}`, title, status },
    { status },
  );
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  const period = parseReportPeriod(
    new URL(request.url).searchParams.get("period"),
  );
  const since = reportPeriodSince(period);
  const { junctionIds } = ctx;

  if (junctionIds.length === 0) {
    return NextResponse.json({
      data: {
        period,
        total_clicks: 0,
        total_conversions: 0,
        total_earned_cents: 0,
        total_reversed_cents: 0,
        active_assignments: 0,
        active_campaigns: 0,
      },
    });
  }

  let convQuery = admin
    .from("campaign_conversions")
    .select("commission_amount_cents, reversed_at, created_at")
    .in("affiliate_id", junctionIds);
  if (since) convQuery = convQuery.gte("created_at", since);

  let clicksQuery = admin
    .from("campaign_clicks")
    .select("id", { count: "exact", head: true })
    .in("affiliate_id", junctionIds);
  if (since) clicksQuery = clicksQuery.gte("created_at", since);

  const [
    { data: conversions },
    { count: clickCount },
    { count: activeAssignments },
    { count: activeCampaigns },
  ] = await Promise.all([
    convQuery,
    clicksQuery,
    admin
      .from("diviner_service_affiliates")
      .select("id", { count: "exact", head: true })
      .in("affiliate_id", junctionIds)
      .eq("affiliate_type", "diviner_affiliate")
      .eq("is_active", true),
    admin
      .from("affiliate_campaigns")
      .select("id", { count: "exact", head: true })
      .in("owner_affiliate_id", junctionIds)
      .eq("owner_affiliate_type", "diviner_affiliate")
      .eq("status", "active"),
  ]);

  let earnedCents = 0;
  let reversedCents = 0;
  let totalConversions = 0;
  for (const c of conversions ?? []) {
    const cents = Number(c.commission_amount_cents ?? 0);
    if (c.reversed_at) reversedCents += cents;
    else {
      totalConversions += 1;
      earnedCents += cents;
    }
  }

  return NextResponse.json({
    data: {
      period,
      total_clicks: clickCount ?? 0,
      total_conversions: totalConversions,
      total_earned_cents: earnedCents,
      total_reversed_cents: reversedCents,
      active_assignments: activeAssignments ?? 0,
      active_campaigns: activeCampaigns ?? 0,
    },
  });
}
