// GET /api/dashboard/affiliate-reports/clicks
// Paginated click log for the caller's own diviner. Cannot return rows
// from campaigns owned by other diviners.
//
// Spec: docs/specs/affiliate-commission-system.md §6.2

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problem(status: number, title: string) {
  return NextResponse.json(
    { type: `https://httpstatuses.io/${status}`, title, status },
    { status },
  );
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return problem(403, "Not a diviner");

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "25", 10), 1),
    100,
  );
  const cursor = searchParams.get("cursor");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const country = searchParams.get("country");
  const affiliateId = searchParams.get("affiliate_id");
  const isBot = searchParams.get("is_bot");

  let query = admin
    .from("campaign_clicks")
    .select(
      "id, campaign_id, campaign_code, destination_type, destination_id, affiliate_id, ip_hash, country_code, user_agent, referrer_url, is_bot, is_unique_click, created_at",
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);
  if (country) query = query.eq("country_code", country);
  if (affiliateId) query = query.eq("affiliate_id", affiliateId);
  if (isBot === "true") query = query.eq("is_bot", true);
  else if (isBot === "false") query = query.eq("is_bot", false);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) return problem(500, error.message);

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
  return NextResponse.json({ data: items, nextCursor, hasMore });
}
