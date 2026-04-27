// GET /api/admin/reports/affiliates/rate-history
// Paginated rate-edit audit log across the platform.
// Query: cursor, limit (1-100, default 25), date_from, date_to,
//        diviner_id, affiliate_id (junction id)
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

  const admin = createAdminClient();

  // Resolve assignment-id scope BEFORE the LIMIT when filtering by diviner
  // or affiliate. rate_history is keyed on assignment_id, so filtering at
  // the SQL level keeps pagination correct.
  let scopedAssignmentIds: string[] | null = null;
  if (divinerId || affiliateId) {
    let asgnQuery = admin.from("diviner_service_affiliates").select("id");
    if (divinerId) asgnQuery = asgnQuery.eq("diviner_id", divinerId);
    if (affiliateId) asgnQuery = asgnQuery.eq("affiliate_id", affiliateId);
    const { data: assignments } = await asgnQuery;
    scopedAssignmentIds = (assignments ?? []).map((a) => a.id as string);
    if (scopedAssignmentIds.length === 0) {
      return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
    }
  }

  let query = admin
    .from("diviner_service_affiliate_rate_history")
    .select(
      "id, assignment_id, old_commission_type, old_commission_value, new_commission_type, new_commission_value, changed_at, changed_by, reason, assignment:diviner_service_affiliates(diviner_id, affiliate_id, destination_type, destination_id)",
    )
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (scopedAssignmentIds) query = query.in("assignment_id", scopedAssignmentIds);
  if (dateFrom) query = query.gte("changed_at", dateFrom);
  if (dateTo) query = query.lte("changed_at", dateTo);
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
