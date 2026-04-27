// GET /api/affiliate/commissions — paginated list of commissions across
// all of the caller's diviner partnerships.
//
// 2026-04-24: rewired onto `campaign_conversions`. System A
// (`affiliate_commissions`) retired — see
// docs/specs/affiliate-commission-system.md §9.
//
// Filters:
//   status=earned → reversed_at IS NULL
//   status=reversed → reversed_at IS NOT NULL
// Pagination: cursor on (created_at, id) DESC with tie-breaker on id.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
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
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  if (ctx.junctionIds.length === 0) {
    return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const cursor = searchParams.get("cursor");

  let query = admin
    .from("campaign_conversions")
    .select(
      "id, affiliate_id, campaign_id, booking_id, order_amount_cents, commission_amount_cents, rate_type_used, rate_value_used, reversed_at, reversed_reason, created_at",
    )
    .in("affiliate_id", ctx.junctionIds)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (statusFilter === "earned") query = query.is("reversed_at", null);
  else if (statusFilter === "reversed") query = query.not("reversed_at", "is", null);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) return problem(500, "Database error", error.message);

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}
