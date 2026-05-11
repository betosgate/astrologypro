// GET /api/dashboard/affiliate-reports/by-affiliate/[id]
// Single-affiliate detail for the caller's diviner. The [id] is a
// `diviner_affiliates.id` (junction id). Only the slice tied to the
// caller's own assignments is visible — affiliates who ALSO partner
// with other diviners stay invisible to this caller.
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: junctionId } = await params;

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

  // Ownership: junction must be partnered with this diviner.
  const { data: junction } = await admin
    .from("diviner_affiliates")
    .select(
      "id, status, created_at, accepted_at, invited_at, account:affiliate_accounts(id, name, email, status)",
    )
    .eq("id", junctionId)
    .eq("diviner_id", diviner.id)
    .maybeSingle();
  if (!junction) return problem(404, "Affiliate not found");

  type JR = {
    id: string;
    status: string;
    created_at: string;
    accepted_at: string | null;
    invited_at: string | null;
    account:
      | { id: string; name: string | null; email: string; status: string }
      | { id: string; name: string | null; email: string; status: string }[]
      | null;
  };
  const j = junction as unknown as JR;
  const account = Array.isArray(j.account) ? j.account[0] : j.account;

  const period = parseReportPeriod(
    new URL(request.url).searchParams.get("period"),
  );
  const since = reportPeriodSince(period);

  // The caller's own campaigns (so we don't accidentally show this
  // affiliate's activity through OTHER diviners).
  const { data: campaigns } = await admin
    .from("affiliate_campaigns")
    .select("id, campaign_code, name, status, created_at, channel")
    .eq("diviner_id", diviner.id)
    .eq("owner_affiliate_id", junctionId)
    .order("created_at", { ascending: false });
  const campaignIds = (campaigns ?? []).map((c) => c.id as string);

  // Caller's own assignments to this affiliate (rate history needs them)
  const { data: assignments } = await admin
    .from("diviner_service_affiliates")
    .select(
      "id, destination_type, destination_id, commission_type, commission_value, is_active, assigned_at, revoked_at",
    )
    .eq("diviner_id", diviner.id)
    .eq("affiliate_id", junctionId);
  const assignmentIds = (assignments ?? []).map((a) => a.id as string);

  // Aggregates scoped to the caller's slice only
  let earnedCents = 0;
  let reversedCents = 0;
  let conversionsCount = 0;
  let clicksCount = 0;
  let humanClicksCount = 0;
  let uniqueClicksCount = 0;
  let botClicksCount = 0;
  let rateHistory: Array<Record<string, unknown>> = [];

  const deviceMap: Record<string, number> = {};
  const countryMap: Record<string, number> = {};
  const sourceMap: Record<string, number> = {};
  const channelMap: Record<string, { campaigns: number; clicks: number; conversions: number }> = {};

  const COUNTRY_NAMES: Record<string, string> = {
    US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
    IN: "India", DE: "Germany", FR: "France", BR: "Brazil", MX: "Mexico",
    NL: "Netherlands", SG: "Singapore", JP: "Japan", NG: "Nigeria", ZA: "South Africa",
  };

  if (campaignIds.length > 0) {
    let convQuery = admin
      .from("campaign_conversions")
      .select("campaign_id, commission_amount_cents, reversed_at, converted_at")
      .in("campaign_id", campaignIds);
    if (since) convQuery = convQuery.gte("converted_at", since);

    let clicksQuery = admin
      .from("campaign_clicks")
      .select("campaign_id, is_bot, is_unique_click, device_type, country_code, source")
      .eq("diviner_id", diviner.id)
      .eq("affiliate_id", junctionId);
    if (since) clicksQuery = clicksQuery.gte("clicked_at", since);

    const [{ data: conversions }, { data: clicks }] = await Promise.all([
      convQuery,
      clicksQuery,
    ]);

    const campConvMap: Record<string, number> = {};
    for (const c of conversions ?? []) {
      const cents = Number(c.commission_amount_cents ?? 0);
      if (c.reversed_at) reversedCents += cents;
      else {
        conversionsCount += 1;
        earnedCents += cents;
        campConvMap[c.campaign_id] = (campConvMap[c.campaign_id] ?? 0) + 1;
      }
    }

    const humanClicks: any[] = [];
    const campClickMap: Record<string, number> = {};

    for (const c of clicks ?? []) {
      clicksCount++;
      if (c.is_bot) {
        botClicksCount++;
      } else {
        humanClicksCount++;
        humanClicks.push(c);
        if (c.is_unique_click) uniqueClicksCount++;
        campClickMap[c.campaign_id] = (campClickMap[c.campaign_id] ?? 0) + 1;

        const dt = (c.device_type as string) ?? "unknown";
        deviceMap[dt] = (deviceMap[dt] ?? 0) + 1;

        const cc = (c.country_code as string | null) ?? "Unknown";
        countryMap[cc] = (countryMap[cc] ?? 0) + 1;

        const src = (c.source as string | null) ?? "direct";
        sourceMap[src] = (sourceMap[src] ?? 0) + 1;
      }
    }

    // Channel performance
    for (const camp of campaigns ?? []) {
      const ch = (camp.channel as string | null) ?? "unset";
      if (!channelMap[ch]) channelMap[ch] = { campaigns: 0, clicks: 0, conversions: 0 };
      channelMap[ch].campaigns++;
      channelMap[ch].clicks += campClickMap[camp.id] ?? 0;
      channelMap[ch].conversions += campConvMap[camp.id] ?? 0;
    }
  }

  const by_device = Object.entries(deviceMap)
    .sort(([, a], [, b]) => b - a)
    .map(([device_type, count]) => ({
      device_type,
      clicks: count,
      percentage: humanClicksCount > 0
        ? parseFloat(((count / humanClicksCount) * 100).toFixed(1))
        : 0,
    }));

  const by_country = Object.entries(countryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([country_code, count]) => ({
      country_code,
      country_name: COUNTRY_NAMES[country_code] ?? country_code,
      clicks: count,
      percentage: humanClicksCount > 0
        ? parseFloat(((count / humanClicksCount) * 100).toFixed(1))
        : 0,
    }));

  const by_source = Object.entries(sourceMap)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => ({
      source,
      clicks: count,
      percentage: humanClicksCount > 0
        ? parseFloat(((count / humanClicksCount) * 100).toFixed(1))
        : 0,
    }));

  const channel_performance = Object.entries(channelMap)
    .sort(([, a], [, b]) => b.clicks - a.clicks)
    .map(([channel, data]) => ({ channel, ...data }));

  if (assignmentIds.length > 0) {
    const { data: history } = await admin
      .from("diviner_service_affiliate_rate_history")
      .select(
        "id, assignment_id, old_commission_type, old_commission_value, new_commission_type, new_commission_value, changed_at, changed_by, reason",
      )
      .in("assignment_id", assignmentIds)
      .order("changed_at", { ascending: false })
      .limit(50);
    rateHistory = history ?? [];
  }

  return NextResponse.json({
    data: {
      period,
      junction: {
        id: j.id,
        status: j.status,
        created_at: j.created_at,
        accepted_at: j.accepted_at,
        invited_at: j.invited_at,
      },
      account: account
        ? {
            id: account.id,
            name: account.name,
            email: account.email,
            status: account.status,
          }
        : null,
      kpis: {
        clicks: clicksCount,
        human_clicks: humanClicksCount,
        unique_clicks: uniqueClicksCount,
        bot_clicks: botClicksCount,
        unique_rate: humanClicksCount > 0
          ? parseFloat(((uniqueClicksCount / humanClicksCount) * 100).toFixed(1))
          : 0,
        conversions: conversionsCount,
        conversion_rate: uniqueClicksCount > 0
          ? parseFloat(((conversionsCount / uniqueClicksCount) * 100).toFixed(1))
          : 0,
        earned_cents: earnedCents,
        reversed_cents: reversedCents,
      },
      by_device,
      by_country,
      by_source,
      channel_performance,
      assignments: assignments ?? [],
      campaigns: campaigns ?? [],
      rate_history: rateHistory,
    },
  });
}
