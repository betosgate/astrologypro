import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/affiliate-payouts?status=&affiliate_account_id=&since=&limit=&offset=
 * Admin-only payouts list. Filters by status, affiliate, and date range.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/07-admin-ui.md
 */
export async function GET(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const affiliateAccountId = url.searchParams.get("affiliate_account_id");
  const since = url.searchParams.get("since");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const admin = createAdminClient();
  let query = admin
    .from("affiliate_payouts")
    .select(
      "id, affiliate_account_id, stripe_account_id, ripe_total_cents, offset_applied_cents, net_transferred_cents, stripe_transfer_id, status, failure_reason, blocked_reason, created_at, transferred_at, trigger_source, triggered_by, notes",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (affiliateAccountId)
    query = query.eq("affiliate_account_id", affiliateAccountId);
  if (since) query = query.gte("created_at", since);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
