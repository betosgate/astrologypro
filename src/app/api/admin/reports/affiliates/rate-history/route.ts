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

  let query = admin
    .from("diviner_service_affiliate_rate_history")
    .select(
      "id, assignment_id, old_commission_type, old_commission_value, new_commission_type, new_commission_value, changed_at, changed_by, reason, assignment:diviner_service_affiliates(diviner_id, affiliate_id, destination_type, destination_id)",
    )
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

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

  type Row = {
    id: string;
    assignment:
      | { diviner_id: string | null; affiliate_id: string | null }
      | { diviner_id: string | null; affiliate_id: string | null }[]
      | null;
  };
  let filtered = (data ?? []) as unknown as Row[];

  if (divinerId || affiliateId) {
    filtered = filtered.filter((r) => {
      const a = Array.isArray(r.assignment) ? r.assignment[0] : r.assignment;
      if (!a) return false;
      if (divinerId && a.diviner_id !== divinerId) return false;
      if (affiliateId && a.affiliate_id !== affiliateId) return false;
      return true;
    });
  }

  const hasMore = filtered.length > limit;
  const items = hasMore ? filtered.slice(0, limit) : filtered;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}
