// GET /api/admin/reports/affiliates/overview
// Platform-wide affiliate KPIs for the requested period.
// Query: ?period=30d|90d|1y|all (default 30d)
//
// Spec: docs/specs/affiliate-commission-system.md §6.1

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
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
  const user = await getAdminUser();
  if (!user) return problem(403, "Forbidden");

  const period = parseReportPeriod(
    new URL(request.url).searchParams.get("period"),
  );
  const since = reportPeriodSince(period);
  const admin = createAdminClient();

  // Click count (period-bounded if since is set).
  let clicksQuery = admin
    .from("campaign_clicks")
    .select("id", { count: "exact", head: true });
  if (since) clicksQuery = clicksQuery.gte("created_at", since);

  // Conversion list (period-bounded). Aggregate in JS.
  let convQuery = admin
    .from("campaign_conversions")
    .select("commission_amount_cents, reversed_at, converted_at");
  if (since) convQuery = convQuery.gte("converted_at", since);

  // Counts of active campaigns + active affiliates (point-in-time, not
  // period-bounded — these are "current state" metrics).
  const [
    { count: totalClicks },
    { data: conversions },
    { count: activeCampaigns },
    { count: activeAffiliates },
  ] = await Promise.all([
    clicksQuery,
    convQuery,
    admin
      .from("affiliate_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("owner_type", "affiliate"),
    admin
      .from("affiliate_accounts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  let totalConversions = 0;
  let earnedCents = 0;
  let reversedCents = 0;
  for (const c of conversions ?? []) {
    const cents = Number(c.commission_amount_cents ?? 0);
    if (c.reversed_at) {
      reversedCents += cents;
    } else {
      totalConversions += 1;
      earnedCents += cents;
    }
  }

  return NextResponse.json({
    data: {
      period,
      total_clicks: totalClicks ?? 0,
      total_conversions: totalConversions,
      total_earned_cents: earnedCents,
      total_reversed_cents: reversedCents,
      active_campaigns: activeCampaigns ?? 0,
      active_affiliates: activeAffiliates ?? 0,
    },
  });
}
