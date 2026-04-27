/**
 * GET /api/admin/analytics/affiliates/export
 *
 * Streams the affiliate leaderboard as CSV, honoring the same `period`
 * and `affiliate_type` filters as the JSON endpoint.
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
  "affiliate_email",
  "active_assignments",
  "active_campaigns",
  "clicks",
  "unique_clicks",
  "conversions",
  "gmv_cents",
  "commission_cents",
] as const;

function periodToSince(period: string): string {
  if (period === "all") return "2020-01-01T00:00:00.000Z";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
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

  const rate = checkExportRateLimit(`affiliates:${user.id}`);
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

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "30d";
  const typeFilter = url.searchParams.get("affiliate_type");
  const fromTs = periodToSince(period);

  const admin = createAdminClient();
  const started = Date.now();

  const [assignmentsRes, clicksRes, conversionsRes, campaignsRes] = await Promise.all([
    admin
      .from("diviner_service_affiliates")
      .select("id, affiliate_id, affiliate_type, is_active"),
    admin
      .from("campaign_clicks")
      .select("affiliate_id, affiliate_type, is_bot, is_unique_click")
      .gte("clicked_at", fromTs)
      .not("affiliate_id", "is", null),
    admin
      .from("campaign_conversions")
      .select(
        "affiliate_id, affiliate_type, order_amount_cents, commission_amount_cents, reversed_at",
      )
      .gte("converted_at", fromTs)
      .not("affiliate_id", "is", null),
    admin
      .from("affiliate_campaigns")
      .select("id, owner_type, owner_affiliate_id, owner_affiliate_type, status")
      .eq("owner_type", "affiliate"),
  ]);

  const assignments = (assignmentsRes.data ?? []) as Array<{
    affiliate_id: string;
    affiliate_type: string;
    is_active: boolean;
  }>;
  const clicks = (clicksRes.data ?? []) as Array<{
    affiliate_id: string;
    affiliate_type: string;
    is_bot: boolean | null;
    is_unique_click: boolean | null;
  }>;
  const conversions = (conversionsRes.data ?? []) as Array<{
    affiliate_id: string;
    affiliate_type: string;
    order_amount_cents: number | null;
    commission_amount_cents: number | null;
    reversed_at: string | null;
  }>;
  const campaigns = (campaignsRes.data ?? []) as Array<{
    owner_affiliate_id: string | null;
    owner_affiliate_type: string | null;
    status: string;
  }>;

  const keyOf = (r: { affiliate_id: string; affiliate_type: string }) =>
    `${r.affiliate_type}:${r.affiliate_id}`;
  const everyone = new Map<string, { affiliate_id: string; affiliate_type: string }>();
  for (const a of assignments) everyone.set(keyOf(a), { affiliate_id: a.affiliate_id, affiliate_type: a.affiliate_type });
  for (const c of clicks) everyone.set(keyOf(c), { affiliate_id: c.affiliate_id, affiliate_type: c.affiliate_type });
  for (const c of conversions) everyone.set(keyOf(c), { affiliate_id: c.affiliate_id, affiliate_type: c.affiliate_type });

  const advIds = [...everyone.values()]
    .filter((e) => e.affiliate_type === "social_advocate")
    .map((e) => e.affiliate_id);
  const divAffIds = [...everyone.values()]
    .filter((e) => e.affiliate_type === "diviner_affiliate")
    .map((e) => e.affiliate_id);

  // migrated-to-canonical-accounts: 2026-04-23 (Task 06)
  const [advRes, divAffRes] = await Promise.all([
    advIds.length > 0
      ? admin.from("social_advocates").select("id, name, email").in("id", advIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null; email: string | null }> }),
    divAffIds.length > 0
      ? admin
          .from("diviner_affiliates")
          .select("id, name, email, account:affiliate_accounts(name, email)")
          .in("id", divAffIds)
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            name: string | null;
            email: string | null;
            account?: { name?: string; email?: string } | null;
          }>,
        }),
  ]);
  const nameByKey = new Map<string, { name: string; email: string | null }>();
  for (const a of (advRes.data ?? []) as Array<{ id: string; name: string | null; email: string | null }>)
    nameByKey.set(`social_advocate:${a.id}`, { name: a.name ?? "(unknown)", email: a.email });
  for (const a of (divAffRes.data ?? []) as Array<{
    id: string;
    name: string | null;
    email: string | null;
    account?: { name?: string; email?: string } | null;
  }>) {
    nameByKey.set(`diviner_affiliate:${a.id}`, {
      name: a.account?.name ?? a.name ?? "(unknown)",
      email: a.account?.email ?? a.email,
    });
  }

  const rows = [...everyone.values()]
    .filter((e) => !typeFilter || e.affiliate_type === typeFilter)
    .map((e) => {
      const k = keyOf(e);
      const activeAssignments = assignments.filter((a) => keyOf(a) === k && a.is_active).length;
      const activeCampaigns = campaigns.filter(
        (c) =>
          c.owner_affiliate_id === e.affiliate_id &&
          c.owner_affiliate_type === e.affiliate_type &&
          c.status === "active",
      ).length;
      const aClicks = clicks.filter((c) => keyOf(c) === k);
      const humanClicks = aClicks.filter((c) => !c.is_bot).length;
      const unique = aClicks.filter((c) => !c.is_bot && c.is_unique_click).length;
      const aConv = conversions.filter((c) => keyOf(c) === k && !c.reversed_at);
      const gmv = aConv.reduce((s, c) => s + Number(c.order_amount_cents ?? 0), 0);
      const commission = aConv.reduce(
        (s, c) => s + Number(c.commission_amount_cents ?? 0),
        0,
      );
      const nm = nameByKey.get(k);
      return {
        affiliate_id: e.affiliate_id,
        affiliate_type: e.affiliate_type,
        affiliate_name: nm?.name ?? "(unknown)",
        affiliate_email: nm?.email ?? null,
        active_assignments: activeAssignments,
        active_campaigns: activeCampaigns,
        clicks: humanClicks,
        unique_clicks: unique,
        conversions: aConv.length,
        gmv_cents: gmv,
        commission_cents: commission,
      };
    })
    .sort((a, b) => {
      const c = b.commission_cents - a.commission_cents;
      if (c !== 0) return c;
      return a.affiliate_id.localeCompare(b.affiliate_id);
    });

  async function* iter() {
    for (const r of rows) yield r;
  }

  const res = csvResponse(
    `affiliates-leaderboard-${dateStampUtc()}.csv`,
    [...COLUMNS],
    iter(),
  );

  console.log(
    JSON.stringify({
      event: "admin_export",
      endpoint: "analytics/affiliates/export",
      user_id: user.id,
      period,
      row_count: rows.length,
      duration_ms: Date.now() - started,
    }),
  );

  return res;
}
