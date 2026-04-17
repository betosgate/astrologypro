/**
 * GET /api/admin/campaigns/analytics
 * Platform-wide campaign click analytics for admins.
 * Returns summary, daily breakdown, top campaigns, device/country breakdown.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  IN: "India", DE: "Germany", FR: "France", BR: "Brazil", MX: "Mexico",
  NL: "Netherlands", SG: "Singapore", JP: "Japan", NG: "Nigeria", ZA: "South Africa",
};

function getPeriodFrom(period: string): string {
  if (period === "all") return "2020-01-01T00:00:00.000Z";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return from.toISOString();
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Admin check
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not an admin" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "30d";
  const fromTs = getPeriodFrom(period);
  const toTs = new Date().toISOString();

  // ── Fetch clicks + campaigns in parallel ──────────────────────────────────────
  const [clicksRes, campaignsRes, conversionsRes] = await Promise.all([
    admin
      .from("campaign_clicks")
      .select("campaign_id, clicked_at, is_bot, is_unique_click, device_type, country_code, source")
      .gte("clicked_at", fromTs)
      .lte("clicked_at", toTs),
    admin
      .from("affiliate_campaigns")
      .select("id, name, diviner_id, status, destination_type, channel"),
    admin
      .from("campaign_conversions")
      .select("campaign_id, commission_amount_cents")
      .gte("converted_at", fromTs)
      .lte("converted_at", toTs),
  ]);

  const clicks = clicksRes.data ?? [];
  const campaigns = campaignsRes.data ?? [];
  const conversions = conversionsRes.data ?? [];

  const humanClicks = clicks.filter((c) => !c.is_bot);
  const botClicks = clicks.filter((c) => c.is_bot);
  const uniqueClicks = humanClicks.filter((c) => c.is_unique_click);

  // ── Summary ────────────────────────────────────────────────────────────────────
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalCommissionCents = conversions.reduce((s, r) => s + (r.commission_amount_cents ?? 0), 0);

  const summary = {
    total_campaigns: campaigns.length,
    active_campaigns: activeCampaigns,
    total_clicks: clicks.length,
    human_clicks: humanClicks.length,
    unique_clicks: uniqueClicks.length,
    bot_clicks: botClicks.length,
    unique_rate: humanClicks.length > 0
      ? parseFloat(((uniqueClicks.length / humanClicks.length) * 100).toFixed(1))
      : 0,
    total_conversions: conversions.length,
    total_commission_cents: totalCommissionCents,
    conversion_rate: uniqueClicks.length > 0
      ? parseFloat(((conversions.length / uniqueClicks.length) * 100).toFixed(1))
      : 0,
  };

  // ── Daily breakdown ────────────────────────────────────────────────────────────
  const dailyMap: Record<string, { total: number; unique: number; bots: number }> = {};
  for (const c of clicks) {
    const date = (c.clicked_at as string).slice(0, 10);
    if (!dailyMap[date]) dailyMap[date] = { total: 0, unique: 0, bots: 0 };
    if (c.is_bot) { dailyMap[date].bots++; continue; }
    dailyMap[date].total++;
    if (c.is_unique_click) dailyMap[date].unique++;
  }
  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, total_clicks: d.total, unique_clicks: d.unique, bot_clicks: d.bots }));

  // ── Top campaigns by clicks ────────────────────────────────────────────────────
  const campClickMap: Record<string, number> = {};
  for (const c of humanClicks) {
    campClickMap[c.campaign_id] = (campClickMap[c.campaign_id] ?? 0) + 1;
  }
  const campConvMap: Record<string, number> = {};
  for (const c of conversions) {
    campConvMap[c.campaign_id] = (campConvMap[c.campaign_id] ?? 0) + 1;
  }
  const campaignById = new Map(campaigns.map((c) => [c.id, c]));

  const top_campaigns = Object.entries(campClickMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([campaign_id, clicks_count]) => {
      const camp = campaignById.get(campaign_id);
      return {
        campaign_id,
        name: camp?.name ?? "Unknown",
        status: camp?.status ?? "unknown",
        destination_type: camp?.destination_type ?? null,
        channel: camp?.channel ?? null,
        clicks: clicks_count,
        conversions: campConvMap[campaign_id] ?? 0,
      };
    });

  // ── By device ─────────────────────────────────────────────────────────────────
  const deviceMap: Record<string, number> = {};
  for (const c of humanClicks) {
    const dt = (c.device_type as string) ?? "unknown";
    deviceMap[dt] = (deviceMap[dt] ?? 0) + 1;
  }
  const by_device = Object.entries(deviceMap)
    .sort(([, a], [, b]) => b - a)
    .map(([device_type, count]) => ({
      device_type,
      clicks: count,
      percentage: humanClicks.length > 0
        ? parseFloat(((count / humanClicks.length) * 100).toFixed(1))
        : 0,
    }));

  // ── By country ────────────────────────────────────────────────────────────────
  const countryMap: Record<string, number> = {};
  for (const c of humanClicks) {
    const cc = (c.country_code as string | null) ?? "Unknown";
    countryMap[cc] = (countryMap[cc] ?? 0) + 1;
  }
  const by_country = Object.entries(countryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([country_code, count]) => ({
      country_code,
      country_name: COUNTRY_NAMES[country_code] ?? country_code,
      clicks: count,
      percentage: humanClicks.length > 0
        ? parseFloat(((count / humanClicks.length) * 100).toFixed(1))
        : 0,
    }));

  // ── By source ─────────────────────────────────────────────────────────────────
  const sourceMap: Record<string, number> = {};
  for (const c of humanClicks) {
    const src = (c.source as string | null) ?? "direct";
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
  }
  const by_source = Object.entries(sourceMap)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => ({
      source,
      clicks: count,
      percentage: humanClicks.length > 0
        ? parseFloat(((count / humanClicks.length) * 100).toFixed(1))
        : 0,
    }));

  // ── Channel performance ───────────────────────────────────────────────────────
  // Group campaigns by channel, sum clicks and conversions
  const channelMap: Record<string, { campaigns: number; clicks: number; conversions: number }> = {};
  for (const camp of campaigns) {
    const ch = (camp.channel as string | null) ?? "unset";
    if (!channelMap[ch]) channelMap[ch] = { campaigns: 0, clicks: 0, conversions: 0 };
    channelMap[ch].campaigns++;
    channelMap[ch].clicks += campClickMap[camp.id] ?? 0;
    channelMap[ch].conversions += campConvMap[camp.id] ?? 0;
  }
  const channel_performance = Object.entries(channelMap)
    .sort(([, a], [, b]) => b.clicks - a.clicks)
    .map(([channel, data]) => ({ channel, ...data }));

  return NextResponse.json({
    period,
    summary,
    daily,
    top_campaigns,
    by_device,
    by_country,
    by_source,
    channel_performance,
  });
}
