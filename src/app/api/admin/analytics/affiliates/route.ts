/**
 * GET /api/admin/analytics/affiliates
 *
 * Cross-platform affiliate leaderboard. Returns every affiliate that
 * holds at least one assignment OR has at least one click/conversion,
 * with aggregated KPIs for the requested period.
 *
 * Query params: period (7d|30d|90d|all, default 30d), affiliate_type.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getPeriodFrom(period: string): string {
  if (period === "all") return "2020-01-01T00:00:00.000Z";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "30d";
  const typeFilter = url.searchParams.get("affiliate_type");
  const fromTs = getPeriodFrom(period);

  // Load all assignments, clicks, conversions in parallel.
  const [assignmentsRes, clicksRes, conversionsRes, campaignsRes] =
    await Promise.all([
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
          "affiliate_id, affiliate_type, order_amount_cents, commission_amount_cents, reversed_at, converted_at"
        )
        .gte("converted_at", fromTs)
        .not("affiliate_id", "is", null),
      admin
        .from("affiliate_campaigns")
        .select("id, owner_type, owner_affiliate_id, owner_affiliate_type, status")
        .eq("owner_type", "affiliate"),
    ]);

  const assignments = assignmentsRes.data ?? [];
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
    id: string;
    owner_affiliate_id: string;
    owner_affiliate_type: string;
    status: string;
  }>;

  // Build a unique set of (affiliate_id, affiliate_type) across all sources
  const keyOf = (r: { affiliate_id: string; affiliate_type: string }) =>
    `${r.affiliate_type}:${r.affiliate_id}`;
  const everyone = new Map<
    string,
    { affiliate_id: string; affiliate_type: string }
  >();
  for (const a of assignments) everyone.set(keyOf(a), { affiliate_id: a.affiliate_id as string, affiliate_type: a.affiliate_type as string });
  for (const c of clicks) everyone.set(keyOf(c), c);
  for (const c of conversions) everyone.set(keyOf(c), c);

  // Lookup names
  const advIds = [...everyone.values()]
    .filter((e) => e.affiliate_type === "social_advocate")
    .map((e) => e.affiliate_id);
  const divAffIds = [...everyone.values()]
    .filter((e) => e.affiliate_type === "diviner_affiliate")
    .map((e) => e.affiliate_id);

  const [advRes, divAffRes] = await Promise.all([
    advIds.length > 0
      ? admin.from("social_advocates").select("id, name, email").in("id", advIds)
      : Promise.resolve({ data: [] }),
    divAffIds.length > 0
      ? admin.from("diviner_affiliates").select("id, name, email").in("id", divAffIds)
      : Promise.resolve({ data: [] }),
  ]);
  const nameByKey = new Map<string, { name: string; email: string }>();
  for (const a of (advRes.data ?? []) as Array<{ id: string; name: string; email: string }>)
    nameByKey.set(`social_advocate:${a.id}`, a);
  for (const a of (divAffRes.data ?? []) as Array<{ id: string; name: string; email: string }>)
    nameByKey.set(`diviner_affiliate:${a.id}`, a);

  // Aggregate
  const rows = [...everyone.values()].map((e) => {
    const k = keyOf(e);
    const assigns = assignments.filter((a) => keyOf(a) === k);
    const activeAssignments = assigns.filter((a) => a.is_active).length;
    const activeCampaigns = campaigns.filter(
      (c) =>
        c.owner_affiliate_id === e.affiliate_id &&
        c.owner_affiliate_type === e.affiliate_type &&
        c.status === "active"
    ).length;
    const aClicks = clicks.filter((c) => keyOf(c) === k);
    const humanClicks = aClicks.filter((c) => !c.is_bot).length;
    const unique = aClicks.filter((c) => !c.is_bot && c.is_unique_click).length;
    const aConv = conversions.filter((c) => keyOf(c) === k && !c.reversed_at);
    const gmv = aConv.reduce((s, c) => s + Number(c.order_amount_cents ?? 0), 0);
    const commission = aConv.reduce(
      (s, c) => s + Number(c.commission_amount_cents ?? 0),
      0
    );
    const nm = nameByKey.get(k);
    return {
      affiliate_id: e.affiliate_id,
      affiliate_type: e.affiliate_type,
      name: nm?.name ?? "(unknown)",
      email: nm?.email ?? null,
      active_assignments: activeAssignments,
      active_campaigns: activeCampaigns,
      clicks: humanClicks,
      unique_clicks: unique,
      conversions: aConv.length,
      gmv_cents: gmv,
      commission_cents: commission,
    };
  });

  const filtered = typeFilter
    ? rows.filter((r) => r.affiliate_type === typeFilter)
    : rows;
  filtered.sort((a, b) => b.commission_cents - a.commission_cents);

  // Summary
  const summary = {
    period,
    active_affiliates: new Set(
      assignments.filter((a) => a.is_active).map((a) => `${a.affiliate_type}:${a.affiliate_id}`)
    ).size,
    active_assignments: assignments.filter((a) => a.is_active).length,
    total_commission_cents: filtered.reduce((s, r) => s + r.commission_cents, 0),
    total_gmv_cents: filtered.reduce((s, r) => s + r.gmv_cents, 0),
    total_conversions: filtered.reduce((s, r) => s + r.conversions, 0),
  };

  return NextResponse.json({ summary, affiliates: filtered });
}
