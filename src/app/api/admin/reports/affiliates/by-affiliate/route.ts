// GET /api/admin/reports/affiliates/by-affiliate
// Per-affiliate-account roll-up across all their junctions/diviners.
// Sorted by total_earned_cents desc. Period-bounded.
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

  let convQuery = admin
    .from("campaign_conversions")
    .select("affiliate_id, commission_amount_cents, reversed_at, created_at")
    .eq("affiliate_type", "diviner_affiliate");
  if (since) convQuery = convQuery.gte("created_at", since);

  let clicksQuery = admin
    .from("campaign_clicks")
    .select("affiliate_id")
    .eq("affiliate_type", "diviner_affiliate");
  if (since) clicksQuery = clicksQuery.gte("created_at", since);

  const [{ data: conversions }, { data: clicks }, { data: junctions }] =
    await Promise.all([
      convQuery,
      clicksQuery,
      admin
        .from("diviner_affiliates")
        .select(
          "id, affiliate_account_id, account:affiliate_accounts(id, name, email, status)",
        ),
    ]);

  // Junction → account mapping
  type JunctionRow = {
    id: string;
    affiliate_account_id: string | null;
    account:
      | { id: string; name: string | null; email: string; status: string }
      | { id: string; name: string | null; email: string; status: string }[]
      | null;
  };
  const accountByJunction = new Map<
    string,
    { id: string; name: string | null; email: string; status: string }
  >();
  for (const j of (junctions ?? []) as unknown as JunctionRow[]) {
    const acc = Array.isArray(j.account) ? j.account[0] : j.account;
    if (acc) accountByJunction.set(j.id, acc);
  }

  // Per-account aggregation (multi-junction affiliate sums across all
  // their diviner partnerships).
  const totals = new Map<
    string,
    {
      account_id: string;
      name: string | null;
      email: string;
      status: string;
      clicks: number;
      conversions: number;
      earned_cents: number;
      reversed_cents: number;
      junction_ids: Set<string>;
    }
  >();

  const upsert = (junctionId: string) => {
    const acc = accountByJunction.get(junctionId);
    if (!acc) return null;
    const cur = totals.get(acc.id) ?? {
      account_id: acc.id,
      name: acc.name,
      email: acc.email,
      status: acc.status,
      clicks: 0,
      conversions: 0,
      earned_cents: 0,
      reversed_cents: 0,
      junction_ids: new Set<string>(),
    };
    cur.junction_ids.add(junctionId);
    totals.set(acc.id, cur);
    return cur;
  };

  for (const c of conversions ?? []) {
    const cur = upsert(c.affiliate_id as string);
    if (!cur) continue;
    const cents = Number(c.commission_amount_cents ?? 0);
    if (c.reversed_at) cur.reversed_cents += cents;
    else {
      cur.conversions += 1;
      cur.earned_cents += cents;
    }
  }
  for (const k of clicks ?? []) {
    const cur = upsert(k.affiliate_id as string);
    if (cur) cur.clicks += 1;
  }

  const rows = Array.from(totals.values())
    .map(({ junction_ids, ...rest }) => ({
      ...rest,
      junction_count: junction_ids.size,
    }))
    .sort((a, b) => b.earned_cents - a.earned_cents);

  return NextResponse.json({ data: { period, rows } });
}
