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
  const { account, junctionIds } = ctx;

  // Bug-fix (Task 07): real column is `converted_at`, not `created_at`.
  // The endpoint was returning DB errors. Filter switched from junction-
  // bound to account-bound so the overview also rolls up Phase 1.5
  // general credits (those have NULL affiliate_id). Same approach for
  // clicks: filter by campaign_id of the caller's campaigns (covers
  // general clicks whose affiliate_id is NULL too). The zero-junctions
  // early-return is removed because general credits can exist without
  // any per-diviner partnership.
  let convQuery = admin
    .from("campaign_conversions")
    .select("commission_amount_cents, reversed_at, converted_at")
    .eq("affiliate_account_id", account.id);
  if (since) convQuery = convQuery.gte("converted_at", since);

  // Resolve caller's campaign ids first, so the click counter can use
  // them for both per-diviner and general clicks.
  const orParts: string[] = [];
  if (junctionIds.length > 0) {
    orParts.push(
      `and(owner_affiliate_type.eq.diviner_affiliate,owner_affiliate_id.in.(${junctionIds.join(",")}))`,
    );
  }
  orParts.push(
    `and(owner_affiliate_type.eq.general,owner_affiliate_account_id.eq.${account.id})`,
  );
  const { data: callerCampaigns } = await admin
    .from("affiliate_campaigns")
    .select("id")
    .or(orParts.join(","));
  const callerCampaignIds = (callerCampaigns ?? []).map((c) => c.id as string);

  const clicksQuery =
    callerCampaignIds.length > 0
      ? (() => {
          let q = admin
            .from("campaign_clicks")
            .select("id", { count: "exact", head: true })
            .in("campaign_id", callerCampaignIds);
          if (since) q = q.gte("created_at", since);
          return q;
        })()
      : Promise.resolve({ count: 0 } as { count: number });

  // Active campaigns count includes per-diviner + general so the affiliate
  // dashboard reflects everything they're currently running.
  const activeCampaignsQuery = admin
    .from("affiliate_campaigns")
    .select("id", { count: "exact", head: true })
    .in("id", callerCampaignIds.length > 0 ? callerCampaignIds : [""])
    .eq("status", "active");

  const activeAssignmentsQuery =
    junctionIds.length > 0
      ? admin
          .from("diviner_service_affiliates")
          .select("id", { count: "exact", head: true })
          .in("affiliate_id", junctionIds)
          .eq("affiliate_type", "diviner_affiliate")
          .eq("is_active", true)
      : Promise.resolve({ count: 0 } as { count: number });

  const [
    { data: conversions },
    { count: clickCount },
    { count: activeAssignments },
    { count: activeCampaigns },
  ] = await Promise.all([
    convQuery,
    clicksQuery,
    activeAssignmentsQuery,
    activeCampaignsQuery,
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
