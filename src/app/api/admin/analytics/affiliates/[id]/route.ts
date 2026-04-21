/**
 * GET /api/admin/analytics/affiliates/[id]
 *
 * Deep-dive for a single affiliate. Returns:
 *   - header info
 *   - period KPIs
 *   - assignments across all diviners
 *   - campaigns
 *   - daily time-series
 *   - conversion log
 *   - simple abuse signals (bot %, clicks-per-unique ratio)
 *
 * Query params: ?type=social_advocate|diviner_affiliate (required to disambiguate)
 *               ?period=7d|30d|90d|all (default 30d)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getPeriodFrom(period: string): string {
  if (period === "all") return "2020-01-01T00:00:00.000Z";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const admin = createAdminClient();
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "social_advocate") as
    | "social_advocate"
    | "diviner_affiliate";
  const period = url.searchParams.get("period") ?? "30d";
  const fromTs = getPeriodFrom(period);

  const table = type === "social_advocate" ? "social_advocates" : "diviner_affiliates";
  const { data: aff } = await admin
    .from(table)
    .select("id, name, email, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!aff) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });

  const [assignmentsRes, campaignsRes, clicksRes, conversionsRes] = await Promise.all([
    admin
      .from("diviner_service_affiliates")
      .select(
        "id, diviner_id, destination_type, destination_id, commission_type, commission_value, is_active, assigned_at, revoked_at"
      )
      .eq("affiliate_id", id)
      .eq("affiliate_type", type),
    admin
      .from("affiliate_campaigns")
      .select(
        "id, name, status, diviner_id, campaign_code, destination_type, destination_service_template_id, source_assignment_id, created_at, start_date, end_date"
      )
      .eq("owner_type", "affiliate")
      .eq("owner_affiliate_id", id)
      .eq("owner_affiliate_type", type),
    admin
      .from("campaign_clicks")
      .select("clicked_at, is_bot, is_unique_click, country_code, device_type, ip_hash")
      .eq("affiliate_id", id)
      .eq("affiliate_type", type)
      .gte("clicked_at", fromTs),
    admin
      .from("campaign_conversions")
      .select(
        "id, campaign_id, booking_id, converted_at, order_amount_cents, commission_amount_cents, reversed_at, commission_source"
      )
      .eq("affiliate_id", id)
      .eq("affiliate_type", type)
      .gte("converted_at", fromTs)
      .order("converted_at", { ascending: false }),
  ]);

  const assignments = assignmentsRes.data ?? [];
  const campaigns = (campaignsRes.data ?? []) as Array<{
    id: string;
    name: string;
    status: string;
    diviner_id: string;
    campaign_code: string | null;
    destination_type: string;
    destination_service_template_id: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
  }>;
  const clicks = (clicksRes.data ?? []) as Array<{
    clicked_at: string;
    is_bot: boolean | null;
    is_unique_click: boolean | null;
    ip_hash: string | null;
  }>;
  const conversions = (conversionsRes.data ?? []) as Array<{
    id: string;
    campaign_id: string;
    booking_id: string | null;
    converted_at: string;
    order_amount_cents: number | null;
    commission_amount_cents: number | null;
    reversed_at: string | null;
  }>;

  // Names for diviners + templates
  const divinerIds = [
    ...new Set([
      ...assignments.map((a) => a.diviner_id as string),
      ...campaigns.map((c) => c.diviner_id),
    ]),
  ];
  const tplIds = [
    ...new Set(
      campaigns
        .filter((c) => c.destination_type === "SERVICE" && c.destination_service_template_id)
        .map((c) => c.destination_service_template_id as string)
    ),
  ];
  const [divinersRes, templatesRes] = await Promise.all([
    divinerIds.length > 0
      ? admin.from("diviners").select("id, display_name, username").in("id", divinerIds)
      : Promise.resolve({ data: [] }),
    tplIds.length > 0
      ? admin.from("service_templates").select("id, name").in("id", tplIds)
      : Promise.resolve({ data: [] }),
  ]);
  const divinerById = new Map(
    ((divinersRes.data ?? []) as Array<{ id: string; display_name: string | null; username: string }>).map(
      (d) => [d.id, d]
    )
  );
  const templateName = new Map(
    ((templatesRes.data ?? []) as Array<{ id: string; name: string }>).map((t) => [t.id, t.name])
  );

  // KPIs
  const humanClicks = clicks.filter((c) => !c.is_bot).length;
  const botClicks = clicks.filter((c) => c.is_bot).length;
  const uniqueClicks = clicks.filter((c) => !c.is_bot && c.is_unique_click).length;
  const liveConv = conversions.filter((c) => !c.reversed_at);
  const gmv = liveConv.reduce((s, c) => s + Number(c.order_amount_cents ?? 0), 0);
  const commission = liveConv.reduce(
    (s, c) => s + Number(c.commission_amount_cents ?? 0),
    0
  );

  // Daily chart
  const dailyMap: Record<string, { clicks: number; conversions: number }> = {};
  for (const c of clicks.filter((cc) => !cc.is_bot)) {
    const d = c.clicked_at.slice(0, 10);
    dailyMap[d] ??= { clicks: 0, conversions: 0 };
    dailyMap[d].clicks++;
  }
  for (const c of liveConv) {
    const d = c.converted_at.slice(0, 10);
    dailyMap[d] ??= { clicks: 0, conversions: 0 };
    dailyMap[d].conversions++;
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // Abuse signals
  const totalClicks = clicks.length;
  const botRate = totalClicks > 0 ? Math.round((botClicks / totalClicks) * 1000) / 10 : 0;
  const clicksPerUnique = uniqueClicks > 0 ? Math.round((humanClicks / uniqueClicks) * 10) / 10 : 0;
  // IP clustering: top IP hash share
  const ipCount: Record<string, number> = {};
  for (const c of clicks) {
    if (c.ip_hash) ipCount[c.ip_hash] = (ipCount[c.ip_hash] ?? 0) + 1;
  }
  const topIpShare = (() => {
    const top = Math.max(0, ...Object.values(ipCount));
    return totalClicks > 0 ? Math.round((top / totalClicks) * 1000) / 10 : 0;
  })();

  return NextResponse.json({
    affiliate: {
      id: aff.id,
      name: aff.name,
      email: aff.email,
      type,
      joined_at: aff.created_at,
    },
    period,
    kpis: {
      active_assignments: assignments.filter((a) => a.is_active).length,
      active_campaigns: campaigns.filter((c) => c.status === "active").length,
      clicks: humanClicks,
      unique_clicks: uniqueClicks,
      conversions: liveConv.length,
      gmv_cents: gmv,
      commission_cents: commission,
    },
    assignments: assignments.map((a) => {
      const d = divinerById.get(a.diviner_id as string);
      return {
        id: a.id,
        diviner_id: a.diviner_id,
        diviner_name: d?.display_name ?? d?.username ?? "(unknown)",
        destination_type: a.destination_type,
        destination_name:
          a.destination_type === "PROFILE"
            ? "Profile"
            : templateName.get(a.destination_id as string) ?? "Service",
        commission_type: a.commission_type,
        commission_value: Number(a.commission_value),
        is_active: a.is_active,
        assigned_at: a.assigned_at,
      };
    }),
    campaigns: campaigns.map((c) => {
      const d = divinerById.get(c.diviner_id);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        diviner_name: d?.display_name ?? d?.username ?? "(unknown)",
        campaign_code: c.campaign_code,
        destination_type: c.destination_type,
        destination_name:
          c.destination_type === "SERVICE" && c.destination_service_template_id
            ? templateName.get(c.destination_service_template_id) ?? "Service"
            : "Profile",
      };
    }),
    daily,
    conversions: conversions.map((c) => ({
      id: c.id,
      booking_id: c.booking_id,
      converted_at: c.converted_at,
      order_amount_cents: Number(c.order_amount_cents ?? 0),
      commission_amount_cents: Number(c.commission_amount_cents ?? 0),
      reversed_at: c.reversed_at,
    })),
    abuse_signals: {
      total_clicks: totalClicks,
      bot_clicks: botClicks,
      bot_rate_pct: botRate,
      clicks_per_unique: clicksPerUnique,
      top_ip_share_pct: topIpShare,
    },
  });
}
