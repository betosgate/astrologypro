// GET /api/affiliate/reports/by-campaign/[id]
// Single-campaign drill for a caller-owned campaign. Returns the
// campaign metadata + KPIs + a paginated tail of recent clicks +
// conversions for the requested period.
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: campaignId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  // Ownership check
  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select(
      "id, campaign_code, name, status, diviner_id, owner_affiliate_id, owner_affiliate_type, source_assignment_id, destination_type, destination_service_template_id, share_url, created_at",
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (
    !campaign ||
    campaign.owner_affiliate_type !== "diviner_affiliate" ||
    !ctx.junctionIds.includes(campaign.owner_affiliate_id as string)
  ) {
    return problem(404, "Campaign not found");
  }

  const period = parseReportPeriod(
    new URL(request.url).searchParams.get("period"),
  );
  const since = reportPeriodSince(period);

  // Aggregates + recent rows for the period.
  let convQuery = admin
    .from("campaign_conversions")
    .select(
      "id, booking_id, order_amount_cents, commission_amount_cents, rate_type_used, rate_value_used, reversed_at, created_at",
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (since) convQuery = convQuery.gte("created_at", since);

  let clicksAggQuery = admin
    .from("campaign_clicks")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  if (since) clicksAggQuery = clicksAggQuery.gte("created_at", since);

  const [{ data: conversions }, { count: totalClicks }] = await Promise.all([
    convQuery,
    clicksAggQuery,
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
      campaign: {
        id: campaign.id,
        campaign_code: campaign.campaign_code,
        name: campaign.name,
        status: campaign.status,
        diviner_id: campaign.diviner_id,
        share_url: campaign.share_url,
        destination_type: campaign.destination_type,
        destination_service_template_id: campaign.destination_service_template_id,
        created_at: campaign.created_at,
      },
      kpis: {
        total_clicks: totalClicks ?? 0,
        total_conversions: totalConversions,
        total_earned_cents: earnedCents,
        total_reversed_cents: reversedCents,
      },
      recent_conversions: conversions ?? [],
    },
  });
}
