// GET /api/dashboard/affiliate-reports/overview
// Diviner-scoped affiliate KPIs for the requested period.
// Scope filter: campaigns where diviner_id = caller.
//
// Spec: docs/specs/affiliate-commission-system.md §6.2

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return problem(403, "Not a diviner");

  const period = parseReportPeriod(
    new URL(request.url).searchParams.get("period"),
  );
  const since = reportPeriodSince(period);

  // Pull campaign ids the caller owns so we can scope conversion + click
  // queries by campaign_id. campaign_clicks has diviner_id directly so
  // we can also filter that side natively.
  const [{ data: campaigns }, { data: assignments }] = await Promise.all([
    admin
      .from("affiliate_campaigns")
      .select("id, status, owner_type")
      .eq("diviner_id", diviner.id),
    admin
      .from("diviner_service_affiliates")
      .select("affiliate_id, is_active")
      .eq("diviner_id", diviner.id)
      .eq("affiliate_type", "diviner_affiliate"),
  ]);

  const campaignIds = (campaigns ?? []).map((c) => c.id as string);
  const activeAffiliateCampaigns = (campaigns ?? []).filter(
    (c) => c.status === "active" && c.owner_type === "affiliate",
  ).length;
  const partnerJunctions = new Set(
    (assignments ?? [])
      .filter((a) => a.is_active)
      .map((a) => a.affiliate_id as string),
  );

  let earnedCents = 0;
  let reversedCents = 0;
  let totalConversions = 0;
  let totalClicks = 0;

  if (campaignIds.length > 0) {
    let convQuery = admin
      .from("campaign_conversions")
      .select("commission_amount_cents, reversed_at, converted_at")
      .in("campaign_id", campaignIds);
    if (since) convQuery = convQuery.gte("converted_at", since);

    let clicksQuery = admin
      .from("campaign_clicks")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id);
    if (since) clicksQuery = clicksQuery.gte("created_at", since);

    const [{ data: conversions }, { count: clickCount }] = await Promise.all([
      convQuery,
      clicksQuery,
    ]);

    for (const c of conversions ?? []) {
      const cents = Number(c.commission_amount_cents ?? 0);
      if (c.reversed_at) reversedCents += cents;
      else {
        totalConversions += 1;
        earnedCents += cents;
      }
    }
    totalClicks = clickCount ?? 0;
  }

  return NextResponse.json({
    data: {
      period,
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      total_earned_cents: earnedCents,
      total_reversed_cents: reversedCents,
      active_affiliate_partnerships: partnerJunctions.size,
      active_affiliate_campaigns: activeAffiliateCampaigns,
    },
  });
}
