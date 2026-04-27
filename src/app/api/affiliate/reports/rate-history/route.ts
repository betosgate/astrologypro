// GET /api/affiliate/reports/rate-history
// Rate-edit audit for the caller's own assignments.
//
// Spec: docs/specs/affiliate-commission-system.md §6.3

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";

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
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "25", 10), 1),
    100,
  );
  const cursor = searchParams.get("cursor");

  if (ctx.junctionIds.length === 0) {
    return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
  }

  // Resolve the caller's assignment ids first (rate history rows are
  // keyed on assignment_id, so this is the cleanest scope filter).
  const { data: assignments } = await admin
    .from("diviner_service_affiliates")
    .select("id")
    .in("affiliate_id", ctx.junctionIds)
    .eq("affiliate_type", "diviner_affiliate");
  const assignmentIds = (assignments ?? []).map((a) => a.id as string);
  if (assignmentIds.length === 0) {
    return NextResponse.json({ data: [], nextCursor: null, hasMore: false });
  }

  let query = admin
    .from("diviner_service_affiliate_rate_history")
    .select(
      "id, assignment_id, old_commission_type, old_commission_value, new_commission_type, new_commission_value, changed_at, reason",
    )
    .in("assignment_id", assignmentIds)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) return problem(500, error.message);

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
  return NextResponse.json({ data: items, nextCursor, hasMore });
}
