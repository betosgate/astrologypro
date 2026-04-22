/**
 * GET /api/admin/analytics/campaigns/export
 *
 * CSV export of the campaign leaderboard. Accepts the same filter params
 * as the JSON endpoint so a download respects the admin's current view.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCampaignLeaderboard,
  type LeaderboardFilters,
  type SortKey,
  type Order,
} from "@/lib/admin/campaign-leaderboard";
import {
  csvResponse,
  dateStampUtc,
  checkExportRateLimit,
} from "@/lib/admin/csv-stream";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXPORT_MAX_ROWS = 100_000;

const COLUMNS = [
  "campaign_id",
  "campaign_code",
  "campaign_name",
  "owner_type",
  "owner_affiliate_name",
  "diviner_username",
  "destination_label",
  "status",
  "clicks",
  "views",
  "ctr",
  "conversions",
  "cvr",
  "order_revenue_cents",
  "commission_cents",
  "created_at",
] as const;

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

  const rate = checkExportRateLimit(`campaigns:${user.id}`);
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
  const filters: LeaderboardFilters = {
    range: (url.searchParams.get("range") ?? "30d") as LeaderboardFilters["range"],
    owner_type: (url.searchParams.get("owner_type") ?? "all") as LeaderboardFilters["owner_type"],
    status: (url.searchParams.get("status") ?? "all") as LeaderboardFilters["status"],
    search: (url.searchParams.get("search") ?? "").trim(),
    sort: (url.searchParams.get("sort") ?? "clicks") as SortKey,
    order: (url.searchParams.get("order") ?? "desc") as Order,
    limit: EXPORT_MAX_ROWS,
    offset: 0,
  };

  const started = Date.now();
  const admin = createAdminClient();
  const { rows } = await buildCampaignLeaderboard(admin, filters);

  async function* iter() {
    for (const r of rows) {
      yield {
        campaign_id: r.campaign_id,
        campaign_code: r.campaign_code,
        campaign_name: r.campaign_name,
        owner_type: r.owner_type,
        owner_affiliate_name: r.owner_affiliate_username,
        diviner_username: r.diviner_username,
        destination_label: r.destination_label,
        status: r.status,
        clicks: r.clicks,
        views: r.views,
        ctr: r.ctr.toFixed(4),
        conversions: r.conversions,
        cvr: r.cvr.toFixed(4),
        order_revenue_cents: r.order_revenue_cents,
        commission_cents: r.commission_cents,
        created_at: r.created_at,
      };
    }
  }

  const filename = `campaigns-leaderboard-${dateStampUtc()}.csv`;
  const res = csvResponse(filename, [...COLUMNS], iter());

  console.log(
    JSON.stringify({
      event: "admin_export",
      endpoint: "analytics/campaigns/export",
      user_id: user.id,
      filters,
      row_count: rows.length,
      duration_ms: Date.now() - started,
    }),
  );

  return res;
}
