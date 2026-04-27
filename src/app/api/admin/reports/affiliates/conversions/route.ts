// GET /api/admin/reports/affiliates/conversions
// Paginated conversion log with admin-level filters.
// Query: cursor, limit (1-100, default 25), date_from, date_to,
//        diviner_id, affiliate_id, status=earned|reversed
//
// Spec: docs/specs/affiliate-commission-system.md §6.1

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
  const divinerId = searchParams.get("diviner_id");
  const affiliateId = searchParams.get("affiliate_id");
  const status = searchParams.get("status");

  const admin = createAdminClient();

  let query = admin
    .from("campaign_conversions")
    .select(
      "id, campaign_id, affiliate_id, affiliate_type, booking_id, order_amount_cents, commission_amount_cents, rate_type_used, rate_value_used, reversed_at, reversed_reason, created_at, campaign:affiliate_campaigns(diviner_id, name)",
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);
  if (affiliateId) query = query.eq("affiliate_id", affiliateId);
  if (status === "earned") query = query.is("reversed_at", null);
  else if (status === "reversed") query = query.not("reversed_at", "is", null);
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

  // diviner_id filter: campaign_conversions has no direct diviner_id, so
  // we filter the SELECT result by the joined campaign.diviner_id.
  type Row = {
    id: string;
    campaign:
      | { diviner_id: string | null; name: string | null }
      | { diviner_id: string | null; name: string | null }[]
      | null;
  };
  let filtered = (data ?? []) as unknown as Row[];
  if (divinerId) {
    filtered = filtered.filter((r) => {
      const camp = Array.isArray(r.campaign) ? r.campaign[0] : r.campaign;
      return camp?.diviner_id === divinerId;
    });
  }

  const hasMore = filtered.length > limit;
  const items = hasMore ? filtered.slice(0, limit) : filtered;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}
