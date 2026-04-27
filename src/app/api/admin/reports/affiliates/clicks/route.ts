// GET /api/admin/reports/affiliates/clicks
// Paginated raw click log with admin-level filters.
// Query: cursor, limit (1-100, default 25), date_from, date_to,
//        country, diviner_id, affiliate_id, is_bot=true|false
//
// Spec: docs/specs/affiliate-commission-system.md §6.1, §6 pagination rules

import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problem(status: number, title: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.io/${status}`, title, status },
    { status },
  );
}

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return problem(403, "Forbidden");

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "25", 10), 1),
    100,
  );
  const cursor = searchParams.get("cursor");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const country = searchParams.get("country");
  const divinerId = searchParams.get("diviner_id");
  const affiliateId = searchParams.get("affiliate_id");
  const isBot = searchParams.get("is_bot");

  const admin = createAdminClient();

  let query = admin
    .from("campaign_clicks")
    .select(
      "id, campaign_id, campaign_code, diviner_id, destination_type, destination_id, affiliate_id, affiliate_type, ip, country, user_agent, referrer, is_bot, is_unique_click, created_at",
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);
  if (country) query = query.eq("country", country);
  if (divinerId) query = query.eq("diviner_id", divinerId);
  if (affiliateId) query = query.eq("affiliate_id", affiliateId);
  if (isBot === "true") query = query.eq("is_bot", true);
  else if (isBot === "false") query = query.eq("is_bot", false);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Database error",
        detail: error.message,
        status: 500,
      },
      { status: 500 },
    );
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}
