// GET /api/dashboard/affiliate-reports/by-affiliate
// Per-affiliate roll-up scoped to the caller's diviner. Each row is one
// of the diviner's [diviner_affiliates.id] junctions. The caller never
// sees affiliates partnered with OTHER diviners.
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

  // Junctions partnered with this diviner (active OR ever-assigned —
  // need to show historical performance even after revoke).
  const { data: junctions } = await admin
    .from("diviner_affiliates")
    .select(
      "id, status, account:affiliate_accounts(id, name, email, status)",
    )
    .eq("diviner_id", diviner.id);

  type JunctionRow = {
    id: string;
    status: string;
    account:
      | { id: string; name: string | null; email: string; status: string }
      | { id: string; name: string | null; email: string; status: string }[]
      | null;
  };
  const junctionRows = (junctions ?? []) as unknown as JunctionRow[];
  const junctionIds = junctionRows.map((j) => j.id);

  if (junctionIds.length === 0) {
    return NextResponse.json({ data: { period, rows: [] } });
  }

  // Caller-scoped campaign ids — needed to scope conversions to those
  // the caller actually owns (campaign_conversions has no diviner_id).
  const { data: campaigns } = await admin
    .from("affiliate_campaigns")
    .select("id")
    .eq("diviner_id", diviner.id);
  const campaignIds = (campaigns ?? []).map((c) => c.id as string);

  let totals = new Map<
    string,
    { clicks: number; conversions: number; earned_cents: number; reversed_cents: number }
  >();

  if (campaignIds.length > 0) {
    let convQuery = admin
      .from("campaign_conversions")
      .select("affiliate_id, commission_amount_cents, reversed_at, created_at")
      .in("campaign_id", campaignIds)
      .in("affiliate_id", junctionIds);
    if (since) convQuery = convQuery.gte("created_at", since);

    let clicksQuery = admin
      .from("campaign_clicks")
      .select("affiliate_id, created_at")
      .eq("diviner_id", diviner.id)
      .in("affiliate_id", junctionIds);
    if (since) clicksQuery = clicksQuery.gte("created_at", since);

    const [{ data: conversions }, { data: clicks }] = await Promise.all([
      convQuery,
      clicksQuery,
    ]);

    for (const c of conversions ?? []) {
      const aid = c.affiliate_id as string;
      const cur = totals.get(aid) ?? {
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
      totals.set(aid, cur);
    }
    for (const k of clicks ?? []) {
      const aid = k.affiliate_id as string;
      const cur = totals.get(aid) ?? {
        clicks: 0,
        conversions: 0,
        earned_cents: 0,
        reversed_cents: 0,
      };
      cur.clicks += 1;
      totals.set(aid, cur);
    }
  }

  const rows = junctionRows
    .map((j) => {
      const acc = Array.isArray(j.account) ? j.account[0] : j.account;
      const t = totals.get(j.id) ?? {
        clicks: 0,
        conversions: 0,
        earned_cents: 0,
        reversed_cents: 0,
      };
      return {
        junction_id: j.id,
        junction_status: j.status,
        affiliate_account_id: acc?.id ?? null,
        name: acc?.name ?? null,
        email: acc?.email ?? null,
        account_status: acc?.status ?? null,
        ...t,
      };
    })
    .sort((a, b) => b.earned_cents - a.earned_cents);

  return NextResponse.json({ data: { period, rows } });
}
