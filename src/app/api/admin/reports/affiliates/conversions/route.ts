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

  // Resolve campaign-id scope BEFORE the LIMIT, so divinerId-filtered
  // requests get a full page of matching rows (not a sliver after a
  // post-LIMIT JS filter).
  let scopedCampaignIds: string[] | null = null;
  if (divinerId) {
    const { data: campaigns } = await admin
      .from("affiliate_campaigns")
      .select("id")
      .eq("diviner_id", divinerId);
    scopedCampaignIds = (campaigns ?? []).map((c) => c.id as string);
    if (scopedCampaignIds.length === 0) {
      return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
    }
  }

  // Phase 1.5 + bug-fix:
  // (1) campaign_conversions has `converted_at` (not `created_at`) and
  //     `reversal_reason` (not `reversed_reason`). The pre-existing
  //     endpoint referenced both wrong names; fixed here so the report
  //     actually returns rows.
  // (2) Extend the campaign sub-select to pull owner_affiliate_type and
  //     the destination service_template name so the page can render
  //     "General: <template>" vs "Diviner: <name>" labels per spec §10.
  // (3) affiliate_account_id is post-migration; included so the report
  //     can group by account if needed.
  let query = admin
    .from("campaign_conversions")
    .select(
      `id, campaign_id, affiliate_id, affiliate_type, affiliate_account_id,
       booking_id, order_amount_cents, commission_amount_cents,
       rate_type_used, rate_value_used,
       reversed_at, reversal_reason, converted_at,
       campaign:affiliate_campaigns(
         diviner_id, name, owner_affiliate_type,
         template:service_templates!destination_service_template_id(id, name)
       )`,
    )
    .order("converted_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (scopedCampaignIds) query = query.in("campaign_id", scopedCampaignIds);
  if (dateFrom) query = query.gte("converted_at", dateFrom);
  if (dateTo) query = query.lte("converted_at", dateTo);
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

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
  return NextResponse.json({ data: items, nextCursor, hasMore });
}
