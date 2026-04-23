/**
 * GET /api/admin/analytics/campaigns
 *
 * Platform-wide campaign leaderboard. Ranks every campaign (both
 * `owner_type='diviner'` and `owner_type='affiliate'`) by clicks, views,
 * conversions, CTR, CVR, order revenue, or commission for a configurable
 * date range.
 *
 * Auth: admin only (403 otherwise).
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

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

  const url = new URL(req.url);
  const filters = parseFilters(url);

  const admin = createAdminClient();
  try {
    const { rows, total } = await buildCampaignLeaderboard(admin, filters);
    return NextResponse.json({
      range: filters.range,
      rows,
      total,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Database error";
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Internal error",
        status: 500,
        detail,
      },
      { status: 500, headers: { "Content-Type": "application/problem+json" } },
    );
  }
}

function parseFilters(url: URL): LeaderboardFilters {
  const range = (url.searchParams.get("range") ?? "30d") as LeaderboardFilters["range"];
  const ownerType = (url.searchParams.get("owner_type") ?? "all") as LeaderboardFilters["owner_type"];
  const status = (url.searchParams.get("status") ?? "all") as LeaderboardFilters["status"];
  const search = (url.searchParams.get("search") ?? "").trim();
  const sort = (url.searchParams.get("sort") ?? "clicks") as SortKey;
  const order = (url.searchParams.get("order") ?? "desc") as Order;
  const limitRaw = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const offsetRaw = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.trunc(limitRaw), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(offsetRaw) ? Math.max(Math.trunc(offsetRaw), 0) : 0;

  return { range, owner_type: ownerType, status, search, sort, order, limit, offset };
}
