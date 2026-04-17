/**
 * GET /api/dashboard/campaigns/[id]/clicks
 * Returns a paginated list of click records for a specific campaign (diviner-owned).
 * Uses keyset pagination via cursor (clicked_at + id tie-breaker).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  // Verify campaign ownership
  const { data: campaign } = await admin
    .from("affiliate_campaigns")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  const url = new URL(req.url);

  // Pagination
  const rawLimit = parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit), MAX_LIMIT);
  const cursor = url.searchParams.get("cursor") ?? null; // UUID of last item

  // Filters
  const deviceType = url.searchParams.get("device_type") ?? null;
  const countryCode = url.searchParams.get("country_code") ?? null;
  const isUniqueParam = url.searchParams.get("is_unique") ?? null;
  const isBotParam = url.searchParams.get("is_bot") ?? "false";

  // Build query — keyset pagination on (clicked_at DESC, id DESC)
  // We need the clicked_at of the cursor row to do keyset pagination
  let cursorClickedAt: string | null = null;
  if (cursor) {
    const { data: cursorRow } = await admin
      .from("campaign_clicks")
      .select("clicked_at")
      .eq("id", cursor)
      .eq("campaign_id", id)
      .maybeSingle();
    cursorClickedAt = (cursorRow?.clicked_at as string) ?? null;
  }

  let query = admin
    .from("campaign_clicks")
    .select(
      "id, clicked_at, is_bot, is_unique_click, device_type, browser, os, country_code, source, referrer_url, utm_source, utm_medium, utm_campaign, utm_content, anonymous_visitor_id",
      { count: "exact" }
    )
    .eq("campaign_id", id);

  // Apply filters
  if (deviceType) query = query.eq("device_type", deviceType);
  if (countryCode) query = query.eq("country_code", countryCode);
  if (isUniqueParam === "true") query = query.eq("is_unique_click", true);
  if (isUniqueParam === "false") query = query.eq("is_unique_click", false);
  if (isBotParam === "true") query = query.eq("is_bot", true);
  if (isBotParam === "false") query = query.eq("is_bot", false);

  // Keyset pagination: rows BEFORE the cursor position (older)
  if (cursor && cursorClickedAt) {
    query = query.or(`clicked_at.lt.${cursorClickedAt},and(clicked_at.eq.${cursorClickedAt},id.lt.${cursor})`);
  }

  const { data: clicks, count } = await query
    .order("clicked_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1); // fetch one extra to detect next page

  const rows = clicks ?? [];
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const next_cursor = hasMore ? (rows[rows.length - 1]?.id ?? null) : null;

  return NextResponse.json({
    clicks: rows.map((r) => ({
      id: r.id,
      clicked_at: r.clicked_at,
      is_bot: r.is_bot,
      is_unique_click: r.is_unique_click,
      device_type: r.device_type,
      browser: r.browser,
      os: r.os,
      country_code: r.country_code,
      source: r.source,
      referrer_url: r.referrer_url,
      utm_source: r.utm_source,
      utm_medium: r.utm_medium,
      utm_campaign: r.utm_campaign,
      utm_content: r.utm_content,
      // Truncate visitor ID for display — last 8 chars only
      visitor_id_hint: r.anonymous_visitor_id
        ? (r.anonymous_visitor_id as string).slice(-8)
        : null,
    })),
    next_cursor,
    total_count: count ?? 0,
  });
}
