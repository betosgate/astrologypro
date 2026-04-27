// GET /api/dashboard/affiliate-reports/conversions
// Paginated conversion log scoped to the caller's diviner. campaign_conversions
// has no diviner_id of its own — we resolve via the diviner's owned
// campaigns and filter `campaign_id IN (...)`.
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
  const affiliateId = searchParams.get("affiliate_id");
  const status = searchParams.get("status");

  // Resolve the caller's own campaigns. Without these, no conversion
  // rows would be visible (cross-diviner data leak prevention).
  const { data: campaigns } = await admin
    .from("affiliate_campaigns")
    .select("id")
    .eq("diviner_id", diviner.id);
  const campaignIds = (campaigns ?? []).map((c) => c.id as string);

  if (campaignIds.length === 0) {
    return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
  }

  let query = admin
    .from("campaign_conversions")
    .select(
      "id, campaign_id, affiliate_id, booking_id, order_amount_cents, commission_amount_cents, rate_type_used, rate_value_used, reversed_at, reversed_reason, created_at",
    )
    .in("campaign_id", campaignIds)
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
  if (error) return problem(500, error.message);

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
  return NextResponse.json({ data: items, nextCursor, hasMore });
}
