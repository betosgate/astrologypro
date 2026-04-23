/**
 * GET /api/admin/analytics/commission/export
 *
 * Streams the per-affiliate monthly commission rollup (last 12 months)
 * as CSV. Column contract matches Task 04 spec.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  csvResponse,
  dateStampUtc,
  checkExportRateLimit,
} from "@/lib/admin/csv-stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COLUMNS = [
  "affiliate_id",
  "affiliate_type",
  "affiliate_name",
  "month",
  "conversions",
  "gmv_cents",
  "commission_cents",
  "paid_cents",
  "outstanding_cents",
] as const;

export async function GET(_req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/403",
        title: "Forbidden",
        status: 403,
        detail: "Admin role required",
      },
      { status: 403, headers: { "Content-Type": "application/problem+json" } },
    );
  }

  const rate = checkExportRateLimit(`commission:${user.id}`);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/429",
        title: "Too Many Requests",
        status: 429,
        detail: "Export rate limit exceeded",
      },
      {
        status: 429,
        headers: {
          "Content-Type": "application/problem+json",
          "Retry-After": String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const admin = createAdminClient();
  const started = Date.now();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: conversions } = await admin
    .from("campaign_conversions")
    .select(
      "affiliate_id, affiliate_type, order_amount_cents, commission_amount_cents, reversed_at, converted_at",
    )
    .gte("converted_at", twelveMonthsAgo.toISOString())
    .not("affiliate_id", "is", null);

  const live = ((conversions ?? []) as Array<{
    affiliate_id: string;
    affiliate_type: string;
    order_amount_cents: number | null;
    commission_amount_cents: number | null;
    reversed_at: string | null;
    converted_at: string;
  }>).filter((r) => !r.reversed_at);

  const bucket = new Map<
    string,
    {
      affiliate_id: string;
      affiliate_type: string;
      month: string;
      conversions: number;
      gmv_cents: number;
      commission_cents: number;
    }
  >();
  for (const r of live) {
    const month = r.converted_at.slice(0, 7);
    const key = `${r.affiliate_type}:${r.affiliate_id}:${month}`;
    const entry =
      bucket.get(key) ?? {
        affiliate_id: r.affiliate_id,
        affiliate_type: r.affiliate_type,
        month,
        conversions: 0,
        gmv_cents: 0,
        commission_cents: 0,
      };
    entry.conversions++;
    entry.gmv_cents += Number(r.order_amount_cents ?? 0);
    entry.commission_cents += Number(r.commission_amount_cents ?? 0);
    bucket.set(key, entry);
  }

  const ids = [...new Set(live.map((r) => r.affiliate_id))];
  const types = new Set(live.map((r) => r.affiliate_type));
  const [advRes, divAffRes] = await Promise.all([
    types.has("social_advocate") && ids.length > 0
      ? admin.from("social_advocates").select("id, name").in("id", ids)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null }> }),
    types.has("diviner_affiliate") && ids.length > 0
      ? admin.from("diviner_affiliates").select("id, name").in("id", ids)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null }> }),
  ]);
  const nameByKey = new Map<string, string>();
  for (const a of (advRes.data ?? []) as Array<{ id: string; name: string | null }>)
    nameByKey.set(`social_advocate:${a.id}`, a.name ?? "(unknown)");
  for (const a of (divAffRes.data ?? []) as Array<{ id: string; name: string | null }>)
    nameByKey.set(`diviner_affiliate:${a.id}`, a.name ?? "(unknown)");

  const rows = Array.from(bucket.values()).sort((a, b) => {
    if (a.month !== b.month) return b.month.localeCompare(a.month);
    const c = b.commission_cents - a.commission_cents;
    if (c !== 0) return c;
    return a.affiliate_id.localeCompare(b.affiliate_id);
  });

  async function* iter() {
    for (const b of rows) {
      yield {
        affiliate_id: b.affiliate_id,
        affiliate_type: b.affiliate_type,
        affiliate_name: nameByKey.get(`${b.affiliate_type}:${b.affiliate_id}`) ?? "(unknown)",
        month: b.month,
        conversions: b.conversions,
        gmv_cents: b.gmv_cents,
        commission_cents: b.commission_cents,
        paid_cents: 0,
        outstanding_cents: b.commission_cents,
      };
    }
  }

  const res = csvResponse(`commission-${dateStampUtc()}.csv`, [...COLUMNS], iter());

  console.log(
    JSON.stringify({
      event: "admin_export",
      endpoint: "analytics/commission/export",
      user_id: user.id,
      row_count: rows.length,
      duration_ms: Date.now() - started,
    }),
  );

  return res;
}
