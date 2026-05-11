import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/payouts?limit=&offset=
 * Returns the current affiliate's payout history. Filters out dry_run rows
 * (those are admin-only audit data).
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/06-affiliate-ui.md
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const admin = createAdminClient();

  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) {
    return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });
  }

  const { data: payouts, count } = await admin
    .from("affiliate_payouts")
    .select(
      "id, ripe_total_cents, offset_applied_cents, net_transferred_cents, stripe_transfer_id, status, failure_reason, blocked_reason, created_at, transferred_at, trigger_source, notes",
      { count: "exact" },
    )
    .eq("affiliate_account_id", (affiliate as { id: string }).id)
    .neq("status", "dry_run")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({
    items: payouts ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
