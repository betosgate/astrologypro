// GET /api/affiliate/reports/by-campaign
// Per-campaign metrics for campaigns the caller owns. Sorted by
// total_earned_cents desc.
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

  if (ctx.junctionIds.length === 0) {
    return NextResponse.json({ data: { period, rows: [] } });
  }

  const { data: campaigns } = await admin
    .from("affiliate_campaigns")
    .select(
      "id, campaign_code, name, status, diviner_id, created_at, share_url",
    )
    .in("owner_affiliate_id", ctx.junctionIds)
    .eq("owner_affiliate_type", "diviner_affiliate")
    .order("created_at", { ascending: false });
  const campaignIds = (campaigns ?? []).map((c) => c.id as string);

  const totals = new Map<
    string,
    { clicks: number; conversions: number; earned_cents: number; reversed_cents: number }
  >();

  if (campaignIds.length > 0) {
    let convQuery = admin
      .from("campaign_conversions")
      .select("campaign_id, commission_amount_cents, reversed_at, created_at")
      .in("campaign_id", campaignIds);
    if (since) convQuery = convQuery.gte("created_at", since);

    let clicksQuery = admin
      .from("campaign_clicks")
      .select("campaign_id, created_at")
      .in("campaign_id", campaignIds);
    if (since) clicksQuery = clicksQuery.gte("created_at", since);

    const [{ data: conversions }, { data: clicks }] = await Promise.all([
      convQuery,
      clicksQuery,
    ]);

    for (const c of conversions ?? []) {
      const cid = c.campaign_id as string;
      const cur = totals.get(cid) ?? {
        clicks: 0,
        conversions: 0,
        earned_cents: 0,
        reversed_cents: 0,
      };
      const cents = Number(c.commission_amount_cents ?? 0);
      if (c.reversed_at) cur.reversed_cents += cents;
      else {
        cur.conversions += 1;
        cur.earned_cents += cents;
      }
      totals.set(cid, cur);
    }
    for (const k of clicks ?? []) {
      const cid = k.campaign_id as string;
      const cur = totals.get(cid) ?? {
        clicks: 0,
        conversions: 0,
        earned_cents: 0,
        reversed_cents: 0,
      };
      cur.clicks += 1;
      totals.set(cid, cur);
    }
  }

  const rows = (campaigns ?? [])
    .map((c) => {
      const t = totals.get(c.id as string) ?? {
        clicks: 0,
        conversions: 0,
        earned_cents: 0,
        reversed_cents: 0,
      };
      return {
        campaign_id: c.id,
        campaign_code: c.campaign_code,
        name: c.name,
        status: c.status,
        diviner_id: c.diviner_id,
        share_url: c.share_url,
        created_at: c.created_at,
        ...t,
      };
    })
    .sort((a, b) => b.earned_cents - a.earned_cents);

  return NextResponse.json({ data: { period, rows } });
}
