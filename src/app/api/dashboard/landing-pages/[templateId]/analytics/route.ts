/**
 * GET /api/dashboard/landing-pages/[templateId]/analytics
 * Returns per-service landing page analytics for the authenticated diviner.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

async function resolveDiviner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, diviner: null };
  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return { user, diviner };
}

function getPeriodDates(period: string, dateFrom?: string, dateTo?: string): { from: string; to: string } {
  const now = new Date();
  const to = dateTo ?? now.toISOString().slice(0, 10);

  if (period === "custom" && dateFrom) {
    return { from: dateFrom, to };
  }

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;
  const { diviner } = await resolveDiviner();
  if (!diviner) {
    return NextResponse.json({ type: "about:blank", title: "Unauthorized", status: 401 }, { status: 401 });
  }

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "30d";
  const dateFrom = url.searchParams.get("date_from") ?? undefined;
  const dateTo = url.searchParams.get("date_to") ?? undefined;

  const { from, to } = getPeriodDates(period, dateFrom, dateTo);
  const admin = createAdminClient();

  // Fetch all events for this diviner + template in the period
  const { data: events } = await admin
    .from("diviner_activity_events")
    .select("event_type, ip_hash, created_at, traffic_source, referrer, metadata")
    .eq("diviner_id", diviner.id)
    .eq("service_template_id", templateId)
    .gte("created_at", `${from}T00:00:00.000Z`)
    .lte("created_at", `${to}T23:59:59.999Z`);

  const rows = events ?? [];

  // ── Aggregate summary ────────────────────────────────────────────────────────
  const countOf = (type: string) => rows.filter((r) => r.event_type === type).length;
  const uniqueOf = (type: string) =>
    new Set(rows.filter((r) => r.event_type === type).map((r) => r.ip_hash)).size;

  const totalViews = countOf("page_view");
  const uniqueVisitors = uniqueOf("page_view");
  const ctaClicks = countOf("cta_click");
  const leadFormSubmissions = countOf("lead_form_submit");
  const bookingsInitiated = countOf("booking_initiated");
  const bookingsCompleted = countOf("booking_completed");

  const ctaClickRate = totalViews > 0 ? parseFloat(((ctaClicks / totalViews) * 100).toFixed(2)) : 0;
  const bookingConversionRate = totalViews > 0 ? parseFloat(((bookingsCompleted / totalViews) * 100).toFixed(2)) : 0;

  // Estimate avg time from time_on_page events (30s, 60s, 120s)
  const ip_120 = new Set(rows.filter((r) => r.event_type === "time_on_page_120s").map((r) => r.ip_hash));
  const ip_60 = new Set(rows.filter((r) => r.event_type === "time_on_page_60s").map((r) => r.ip_hash));
  const ip_30 = new Set(rows.filter((r) => r.event_type === "time_on_page_30s").map((r) => r.ip_hash));
  const totalSessions = uniqueVisitors || 1;
  const estimatedTotalTime = ip_120.size * 120 + (ip_60.size - ip_120.size) * 60 + (ip_30.size - ip_60.size) * 30;
  const avgTimeOnPage = totalSessions > 0 ? Math.round(estimatedTotalTime / totalSessions) : 0;

  // Estimate avg scroll depth
  const pct100 = uniqueOf("page_scroll_100");
  const pct75 = uniqueOf("page_scroll_75");
  const pct50 = uniqueOf("page_scroll_50");
  const pct25 = uniqueOf("page_scroll_25");
  const scrollTotal = pct100 * 100 + (pct75 - pct100) * 75 + (pct50 - pct75) * 50 + (pct25 - pct50) * 25;
  const avgScrollDepth = totalSessions > 0 ? Math.round(scrollTotal / totalSessions) : 0;

  // ── Daily breakdown ──────────────────────────────────────────────────────────
  const dailyMap: Record<string, {
    views: number; unique_visitors: Set<string>; cta_clicks: number;
    bookings_initiated: number; bookings_completed: number;
  }> = {};

  for (const row of rows) {
    if (!row.event_type || !["page_view", "cta_click", "booking_initiated", "booking_completed"].includes(row.event_type)) continue;
    const date = (row.created_at as string).slice(0, 10);
    if (!dailyMap[date]) {
      dailyMap[date] = { views: 0, unique_visitors: new Set(), cta_clicks: 0, bookings_initiated: 0, bookings_completed: 0 };
    }
    const d = dailyMap[date];
    if (row.event_type === "page_view") { d.views++; if (row.ip_hash) d.unique_visitors.add(row.ip_hash); }
    else if (row.event_type === "cta_click") d.cta_clicks++;
    else if (row.event_type === "booking_initiated") d.bookings_initiated++;
    else if (row.event_type === "booking_completed") d.bookings_completed++;
  }

  const daily = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      views: d.views,
      unique_visitors: d.unique_visitors.size,
      cta_clicks: d.cta_clicks,
      bookings_initiated: d.bookings_initiated,
      bookings_completed: d.bookings_completed,
    }));

  // ── Traffic sources ──────────────────────────────────────────────────────────
  const sourceMap: Record<string, number> = {};
  for (const row of rows.filter((r) => r.event_type === "page_view")) {
    const src = (row.traffic_source as string) || "direct";
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
  }
  const traffic_sources = Object.entries(sourceMap)
    .sort(([, a], [, b]) => b - a)
    .map(([source, views]) => ({
      source,
      views,
      percentage: totalViews > 0 ? parseFloat(((views / totalViews) * 100).toFixed(1)) : 0,
    }));

  // ── Top referrers ────────────────────────────────────────────────────────────
  const referrerMap: Record<string, number> = {};
  for (const row of rows.filter((r) => r.event_type === "page_view" && r.referrer)) {
    try {
      const domain = new URL(row.referrer as string).hostname.replace(/^www\./, "");
      referrerMap[domain] = (referrerMap[domain] ?? 0) + 1;
    } catch { /* ignore */ }
  }
  const top_referrers = Object.entries(referrerMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([domain, views]) => ({ domain, views }));

  // ── Funnel ───────────────────────────────────────────────────────────────────
  const viewToClickDropOff = totalViews > 0 ? parseFloat((((totalViews - ctaClicks) / totalViews) * 100).toFixed(1)) : 0;
  const clickToInitiateDropOff = ctaClicks > 0 ? parseFloat((((ctaClicks - bookingsInitiated) / ctaClicks) * 100).toFixed(1)) : 0;
  const initiateToCompleteDropOff = bookingsInitiated > 0 ? parseFloat((((bookingsInitiated - bookingsCompleted) / bookingsInitiated) * 100).toFixed(1)) : 0;

  return NextResponse.json({
    period,
    date_from: from,
    date_to: to,
    summary: {
      total_views: totalViews,
      unique_visitors: uniqueVisitors,
      cta_clicks: ctaClicks,
      cta_click_rate: ctaClickRate,
      lead_form_submissions: leadFormSubmissions,
      bookings_initiated: bookingsInitiated,
      bookings_completed: bookingsCompleted,
      booking_conversion_rate: bookingConversionRate,
      avg_time_on_page: avgTimeOnPage,
      avg_scroll_depth: avgScrollDepth,
    },
    daily,
    traffic_sources,
    top_referrers,
    funnel: {
      views: totalViews,
      cta_clicks: ctaClicks,
      bookings_initiated: bookingsInitiated,
      bookings_completed: bookingsCompleted,
      drop_off_rates: {
        view_to_click: viewToClickDropOff,
        click_to_initiate: clickToInitiateDropOff,
        initiate_to_complete: initiateToCompleteDropOff,
      },
    },
  });
}
