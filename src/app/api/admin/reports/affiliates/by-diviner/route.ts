// GET /api/admin/reports/affiliates/by-diviner
// Per-diviner roll-up of affiliate volume for the requested period.
// Sorted by total_earned_cents desc.
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

  // Pull conversions + clicks in the window. campaign_conversions has no
  // diviner_id of its own — resolve via the joined campaign.
  let convQuery = admin
    .from("campaign_conversions")
    .select(
      "commission_amount_cents, reversed_at, converted_at, campaign:affiliate_campaigns(diviner_id)",
    );
  if (since) convQuery = convQuery.gte("converted_at", since);

  let clicksQuery = admin
    .from("campaign_clicks")
    .select("diviner_id");
  if (since) clicksQuery = clicksQuery.gte("created_at", since);

  const [{ data: conversions }, { data: clicks }, { data: diviners }] =
    await Promise.all([
      convQuery,
      clicksQuery,
      admin.from("diviners").select("id, display_name, username"),
    ]);

  type ConversionRow = {
    commission_amount_cents: number | null;
    reversed_at: string | null;
    campaign:
      | { diviner_id: string | null }
      | { diviner_id: string | null }[]
      | null;
  };

  const totals = new Map<
    string,
    { clicks: number; conversions: number; earned_cents: number; reversed_cents: number }
  >();

  for (const c of (conversions ?? []) as unknown as ConversionRow[]) {
    const camp = Array.isArray(c.campaign) ? c.campaign[0] : c.campaign;
    const did = camp?.diviner_id;
    if (!did) continue;
    const cur = totals.get(did) ?? {
      clicks: 0,
      conversions: 0,
      earned_cents: 0,
      reversed_cents: 0,
    };
    const cents = Number(c.commission_amount_cents ?? 0);
    if (c.reversed_at) {
      cur.reversed_cents += cents;
    } else {
      cur.conversions += 1;
      cur.earned_cents += cents;
    }
    totals.set(did, cur);
  }

  for (const k of clicks ?? []) {
    const did = k.diviner_id as string | null;
    if (!did) continue;
    const cur = totals.get(did) ?? {
      clicks: 0,
      conversions: 0,
      earned_cents: 0,
      reversed_cents: 0,
    };
    cur.clicks += 1;
    totals.set(did, cur);
  }

  const namesById = new Map<string, { display_name: string | null; username: string | null }>();
  for (const d of diviners ?? []) {
    namesById.set(d.id as string, {
      display_name: (d.display_name as string | null) ?? null,
      username: (d.username as string | null) ?? null,
    });
  }

  const rows = Array.from(totals.entries())
    .map(([divinerId, t]) => ({
      diviner_id: divinerId,
      display_name: namesById.get(divinerId)?.display_name ?? null,
      username: namesById.get(divinerId)?.username ?? null,
      ...t,
    }))
    .sort((a, b) => b.earned_cents - a.earned_cents);

  return NextResponse.json({ data: { period, rows } });
}
