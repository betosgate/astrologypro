/**
 * GET /api/admin/analytics/commission
 *
 * Platform-wide commission financial view:
 *   - summary cards (this month / all-time / reversed)
 *   - per-affiliate monthly rollup for the last 12 months
 *
 * No payouts table exists yet — "paid" is always 0 here; "outstanding"
 * equals commission_cents. When the payouts module lands, wire it in.
 */

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const { data: conversions } = await admin
    .from("campaign_conversions")
    .select(
      "affiliate_id, affiliate_type, order_amount_cents, commission_amount_cents, reversed_at, converted_at, commission_source"
    )
    .gte("converted_at", twelveMonthsAgo.toISOString())
    .not("affiliate_id", "is", null);

  const rows = (conversions ?? []) as Array<{
    affiliate_id: string;
    affiliate_type: string;
    order_amount_cents: number | null;
    commission_amount_cents: number | null;
    reversed_at: string | null;
    converted_at: string;
    commission_source: string | null;
  }>;

  const live = rows.filter((r) => !r.reversed_at);
  const reversed = rows.filter((r) => r.reversed_at);

  const inThisMonth = live.filter(
    (r) => new Date(r.converted_at) >= thisMonthStart
  );

  const summary = {
    this_month_cents: inThisMonth.reduce(
      (s, r) => s + Number(r.commission_amount_cents ?? 0),
      0
    ),
    all_time_cents: live.reduce(
      (s, r) => s + Number(r.commission_amount_cents ?? 0),
      0
    ),
    reversed_cents: reversed.reduce(
      (s, r) => s + Number(r.commission_amount_cents ?? 0),
      0
    ),
    paid_cents: 0,
    outstanding_cents: live.reduce(
      (s, r) => s + Number(r.commission_amount_cents ?? 0),
      0
    ),
  };

  // Per-affiliate monthly rollup
  const bucket: Record<
    string,
    {
      affiliate_id: string;
      affiliate_type: string;
      month: string;
      conversions: number;
      gmv_cents: number;
      commission_cents: number;
    }
  > = {};
  for (const r of live) {
    const month = r.converted_at.slice(0, 7);
    const key = `${r.affiliate_type}:${r.affiliate_id}:${month}`;
    if (!bucket[key]) {
      bucket[key] = {
        affiliate_id: r.affiliate_id,
        affiliate_type: r.affiliate_type,
        month,
        conversions: 0,
        gmv_cents: 0,
        commission_cents: 0,
      };
    }
    bucket[key].conversions++;
    bucket[key].gmv_cents += Number(r.order_amount_cents ?? 0);
    bucket[key].commission_cents += Number(r.commission_amount_cents ?? 0);
  }

  // Look up names
  const ids = [...new Set([...live].map((r) => r.affiliate_id))];
  const types = new Set(live.map((r) => r.affiliate_type));
  const [advRes, divAffRes] = await Promise.all([
    types.has("social_advocate") && ids.length > 0
      ? admin.from("social_advocates").select("id, name").in("id", ids)
      : Promise.resolve({ data: [] }),
    types.has("diviner_affiliate") && ids.length > 0
      ? admin.from("diviner_affiliates").select("id, name").in("id", ids)
      : Promise.resolve({ data: [] }),
  ]);
  const nameByKey = new Map<string, string>();
  for (const a of (advRes.data ?? []) as Array<{ id: string; name: string }>)
    nameByKey.set(`social_advocate:${a.id}`, a.name);
  for (const a of (divAffRes.data ?? []) as Array<{ id: string; name: string }>)
    nameByKey.set(`diviner_affiliate:${a.id}`, a.name);

  const monthly = Object.values(bucket)
    .map((b) => ({
      ...b,
      affiliate_name: nameByKey.get(`${b.affiliate_type}:${b.affiliate_id}`) ?? "(unknown)",
      paid_cents: 0,
      outstanding_cents: b.commission_cents,
    }))
    .sort((a, b) => {
      if (a.month !== b.month) return b.month.localeCompare(a.month);
      return b.outstanding_cents - a.outstanding_cents;
    });

  return NextResponse.json({ summary, monthly });
}
