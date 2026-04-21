/**
 * GET /api/admin/analytics/landing-pages
 * Admin-only analytics overview across all diviners and landing pages.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getPeriodDates(period: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to };
}

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "30d";
  const filterDivinerId = url.searchParams.get("diviner_id");
  const filterTemplateId = url.searchParams.get("template_id");
  const sortBy = url.searchParams.get("sort_by") ?? "views";
  const sortDir = url.searchParams.get("sort_dir") === "asc" ? 1 : -1;

  const { from, to } = getPeriodDates(period);
  const admin = createAdminClient();

  // Fetch events in period
  let query = admin
    .from("diviner_activity_events")
    .select("diviner_id, service_template_id, event_type, ip_hash, created_at")
    .gte("created_at", `${from}T00:00:00.000Z`)
    .lte("created_at", `${to}T23:59:59.999Z`)
    .not("service_template_id", "is", null);

  if (filterDivinerId) query = query.eq("diviner_id", filterDivinerId);
  if (filterTemplateId) query = query.eq("service_template_id", filterTemplateId);

  const { data: events } = await query;
  const rows = events ?? [];

  // ── Aggregate by service template ────────────────────────────────────────────
  const byTemplate: Record<string, {
    views: number; unique_visitors: Set<string>; bookings: number;
  }> = {};

  for (const row of rows) {
    const tid = row.service_template_id as string;
    if (!byTemplate[tid]) byTemplate[tid] = { views: 0, unique_visitors: new Set(), bookings: 0 };
    if (row.event_type === "page_view") {
      byTemplate[tid].views++;
      if (row.ip_hash) byTemplate[tid].unique_visitors.add(row.ip_hash as string);
    }
    if (row.event_type === "booking_completed") byTemplate[tid].bookings++;
  }

  // ── Aggregate by diviner ─────────────────────────────────────────────────────
  const byDiviner: Record<string, {
    views: number; unique_visitors: Set<string>; bookings: number; templates: Set<string>;
  }> = {};

  for (const row of rows) {
    const did = row.diviner_id as string;
    if (!byDiviner[did]) byDiviner[did] = { views: 0, unique_visitors: new Set(), bookings: 0, templates: new Set() };
    if (row.event_type === "page_view") {
      byDiviner[did].views++;
      if (row.ip_hash) byDiviner[did].unique_visitors.add(row.ip_hash as string);
    }
    if (row.event_type === "booking_completed") byDiviner[did].bookings++;
    if (row.service_template_id) byDiviner[did].templates.add(row.service_template_id as string);
  }

  // Fetch template labels
  const templateIds = Object.keys(byTemplate);
  const { data: templateRows } = templateIds.length > 0
    ? await admin.from("service_templates").select("id, name, base_price").in("id", templateIds)
    : { data: [] };
  const templateMap = Object.fromEntries((templateRows ?? []).map((t) => [t.id, t]));

  // Fetch diviner names
  const divinerIds = Object.keys(byDiviner);
  const { data: divinerRows } = divinerIds.length > 0
    ? await admin.from("diviners").select("id, display_name, username").in("id", divinerIds)
    : { data: [] };
  const divinerMap = Object.fromEntries((divinerRows ?? []).map((d) => [d.id, d]));

  // ── Count active diviners per template ──────────────────────────────────────
  const activeDivinersByTemplate: Record<string, Set<string>> = {};
  for (const row of rows) {
    const tid = row.service_template_id as string;
    const did = row.diviner_id as string;
    if (!activeDivinersByTemplate[tid]) activeDivinersByTemplate[tid] = new Set();
    activeDivinersByTemplate[tid].add(did);
  }

  // Build by_service array
  const byService = Object.entries(byTemplate).map(([tid, stats]) => {
    const tpl = templateMap[tid];
    const basePrice = tpl ? Number(tpl.base_price ?? 0) : 0;
    return {
      template_id: tid,
      template_name: tpl?.name ?? tid,
      total_views: stats.views,
      unique_visitors: stats.unique_visitors.size,
      total_bookings: stats.bookings,
      active_diviners: activeDivinersByTemplate[tid]?.size ?? 0,
      avg_conversion: stats.views > 0 ? parseFloat(((stats.bookings / stats.views) * 100).toFixed(2)) : 0,
      total_revenue_estimate: stats.bookings * basePrice,
    };
  });

  // Sort by_service
  const sortFieldService = (s: typeof byService[0]) =>
    sortBy === "bookings" ? s.total_bookings
    : sortBy === "conversion" ? s.avg_conversion
    : sortBy === "revenue" ? s.total_revenue_estimate
    : s.total_views;

  byService.sort((a, b) => sortDir * (sortFieldService(b) - sortFieldService(a)));

  // Build by_diviner array
  const byDivinerArr = Object.entries(byDiviner).map(([did, stats]) => {
    const d = divinerMap[did];
    return {
      diviner_id: did,
      diviner_name: d?.display_name ?? did,
      username: d?.username ?? "",
      total_views: stats.views,
      unique_visitors: stats.unique_visitors.size,
      total_bookings: stats.bookings,
      enabled_services: stats.templates.size,
      avg_conversion: stats.views > 0 ? parseFloat(((stats.bookings / stats.views) * 100).toFixed(2)) : 0,
      total_revenue_estimate: 0, // Would need per-booking revenue data
    };
  });

  byDivinerArr.sort((a, b) => sortDir * (b.total_views - a.total_views));

  // ── Overview totals ──────────────────────────────────────────────────────────
  const allViews = rows.filter((r) => r.event_type === "page_view").length;
  const allBookings = rows.filter((r) => r.event_type === "booking_completed").length;
  const avgConversion = allViews > 0 ? parseFloat(((allBookings / allViews) * 100).toFixed(2)) : 0;
  const topService = byService[0]?.template_name ?? null;
  const topDiviner = byDivinerArr[0]?.username ?? null;

  return NextResponse.json({
    period,
    date_from: from,
    date_to: to,
    overview: {
      total_views: allViews,
      total_bookings: allBookings,
      total_revenue_estimate: byService.reduce((s, t) => s + t.total_revenue_estimate, 0),
      avg_conversion_rate: avgConversion,
      top_performing_service: topService,
      top_performing_diviner: topDiviner,
    },
    by_service: byService,
    by_diviner: byDivinerArr,
  });
}
