/**
 * GET /api/dashboard/campaigns/[id]/analytics
 * Returns click analytics for a specific campaign (diviner-owned).
 * Excludes bots from human metrics. Aggregates by day, device, country, source.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getPeriodFrom(period: string, dateFrom?: string): string {
  if (period === "all") return "2020-01-01T00:00:00.000Z";
  if (period === "custom" && dateFrom) return `${dateFrom}T00:00:00.000Z`;
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return from.toISOString();
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  IN: "India", DE: "Germany", FR: "France", BR: "Brazil", MX: "Mexico",
  NL: "Netherlands", SG: "Singapore", JP: "Japan", NG: "Nigeria", ZA: "South Africa",
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json({ type: "https://httpstatuses.io/403", title: "Not a diviner" }, { status: 403 });
  }

  // Verify campaign ownership
  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select("id, name, status, destination_type, destination_service_template_id, campaign_code, share_url, created_at")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ type: "https://httpstatuses.io/404", title: "Campaign not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "30d";
  const dateFrom = url.searchParams.get("date_from") ?? undefined;
  const dateTo = url.searchParams.get("date_to") ?? undefined;
  const fromTs = getPeriodFrom(period, dateFrom);
  const toTs = dateTo ? `${dateTo}T23:59:59.999Z` : new Date().toISOString();

  // Fetch all clicks in period
  const { data: clicks } = await admin
    .from("campaign_clicks")
    .select(
      "clicked_at, is_bot, is_unique_click, device_type, browser, country_code, source, referrer_url, anonymous_visitor_id"
    )
    .eq("campaign_id", id)
    .gte("clicked_at", fromTs)
    .lte("clicked_at", toTs);

  const rows = clicks ?? [];
  const humanRows = rows.filter((r) => !r.is_bot);

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalClicks = rows.length;
  const botClicks = rows.filter((r) => r.is_bot).length;
  const humanClicks = humanRows.length;
  const uniqueClicks = humanRows.filter((r) => r.is_unique_click).length;
  const uniqueRate = humanClicks > 0 ? parseFloat(((uniqueClicks / humanClicks) * 100).toFixed(1)) : 0;

  // Conversions from campaign_conversions
  const { data: convRows } = await admin
    .from("campaign_conversions")
    .select("id, commission_amount_cents")
    .eq("campaign_id", id)
    .gte("converted_at", fromTs)
    .lte("converted_at", toTs);

  const conversions = (convRows ?? []).length;
  const totalCommissionCents = (convRows ?? []).reduce((s, r) => s + (r.commission_amount_cents ?? 0), 0);
  const conversionRate = uniqueClicks > 0 ? parseFloat(((conversions / uniqueClicks) * 100).toFixed(1)) : 0;

  // Days in period
  const msInPeriod = new Date(toTs).getTime() - new Date(fromTs).getTime();
  const daysInPeriod = Math.max(1, Math.ceil(msInPeriod / (1000 * 60 * 60 * 24)));
  const avgClicksPerDay = parseFloat((humanClicks / daysInPeriod).toFixed(1));

  // ── Daily breakdown ────────────────────────────────────────────────────────
  const dailyMap: Record<string, { total: number; unique: number }> = {};
  for (const row of humanRows) {
    const date = (row.clicked_at as string).slice(0, 10);
    if (!dailyMap[date]) dailyMap[date] = { total: 0, unique: 0 };
    dailyMap[date].total++;
    if (row.is_unique_click) dailyMap[date].unique++;
  }

  // Map conversions to daily
  const convByDate: Record<string, number> = {};
  for (const conv of convRows ?? []) {
    const date = ((conv as Record<string, unknown>).converted_at as string | undefined)?.slice(0, 10);
    if (date) convByDate[date] = (convByDate[date] ?? 0) + 1;
  }

  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      total_clicks: d.total,
      unique_clicks: d.unique,
      conversions: convByDate[date] ?? 0,
    }));

  // ── By device ─────────────────────────────────────────────────────────────
  const deviceMap: Record<string, number> = {};
  for (const row of humanRows) {
    const dt = (row.device_type as string) ?? "unknown";
    deviceMap[dt] = (deviceMap[dt] ?? 0) + 1;
  }
  const by_device = Object.entries(deviceMap)
    .sort(([, a], [, b]) => b - a)
    .map(([device_type, clicks]) => ({
      device_type,
      clicks,
      percentage: humanClicks > 0 ? parseFloat(((clicks / humanClicks) * 100).toFixed(1)) : 0,
    }));

  // ── By country ────────────────────────────────────────────────────────────
  const countryMap: Record<string, number> = {};
  for (const row of humanRows) {
    const cc = (row.country_code as string | null) ?? "Unknown";
    countryMap[cc] = (countryMap[cc] ?? 0) + 1;
  }
  const by_country = Object.entries(countryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([country_code, clicks]) => ({
      country_code,
      country_name: COUNTRY_NAMES[country_code] ?? country_code,
      clicks,
      percentage: humanClicks > 0 ? parseFloat(((clicks / humanClicks) * 100).toFixed(1)) : 0,
    }));

  // ── By browser ────────────────────────────────────────────────────────────
  const browserMap: Record<string, number> = {};
  for (const row of humanRows) {
    if (row.browser) {
      // Normalize to major version only
      const major = (row.browser as string).split(" ").slice(0, 2).join(" ");
      browserMap[major] = (browserMap[major] ?? 0) + 1;
    }
  }
  const by_browser = Object.entries(browserMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([browser, clicks]) => ({
      browser,
      clicks,
      percentage: humanClicks > 0 ? parseFloat(((clicks / humanClicks) * 100).toFixed(1)) : 0,
    }));

  // ── By source ─────────────────────────────────────────────────────────────
  const sourceMap: Record<string, number> = {};
  for (const row of humanRows) {
    const src = (row.source as string | null) ?? "direct";
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
  }
  const by_source = Object.entries(sourceMap)
    .sort(([, a], [, b]) => b - a)
    .map(([source, clicks]) => ({
      source,
      clicks,
      percentage: humanClicks > 0 ? parseFloat(((clicks / humanClicks) * 100).toFixed(1)) : 0,
    }));

  // ── Top referrers ─────────────────────────────────────────────────────────
  const referrerMap: Record<string, number> = {};
  for (const row of humanRows) {
    if (row.referrer_url) {
      try {
        const domain = new URL(row.referrer_url as string).hostname.replace(/^www\./, "");
        referrerMap[domain] = (referrerMap[domain] ?? 0) + 1;
      } catch { /* ignore */ }
    }
  }
  const top_referrers = Object.entries(referrerMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([domain, clicks]) => ({ domain, clicks }));

  // ── Hourly heatmap ────────────────────────────────────────────────────────
  const hourMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = 0;
  for (const row of humanRows) {
    const hour = new Date(row.clicked_at as string).getUTCHours();
    hourMap[hour] = (hourMap[hour] ?? 0) + 1;
  }
  const hourly_heatmap = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    clicks: hourMap[hour] ?? 0,
  }));

  // ── Destination name resolution ────────────────────────────────────────────
  let destinationName = "Profile";
  if (campaign.destination_type === "SERVICE" && campaign.destination_service_template_id) {
    const { data: tmpl } = await admin
      .from("service_templates")
      .select("name")
      .eq("id", campaign.destination_service_template_id)
      .maybeSingle();
    if (tmpl) destinationName = tmpl.name as string;
  }

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      destination_type: campaign.destination_type,
      destination_name: destinationName,
      campaign_code: campaign.campaign_code,
      share_url: campaign.share_url,
      status: campaign.status,
      created_at: campaign.created_at,
    },
    summary: {
      total_clicks: totalClicks,
      unique_clicks: uniqueClicks,
      bot_clicks: botClicks,
      human_clicks: humanClicks,
      unique_rate: uniqueRate,
      conversions,
      conversion_rate: conversionRate,
      total_commission_cents: totalCommissionCents,
      avg_clicks_per_day: avgClicksPerDay,
    },
    daily,
    by_device,
    by_country,
    by_browser,
    by_source,
    top_referrers,
    hourly_heatmap,
  });
}
