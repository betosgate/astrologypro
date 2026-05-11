import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/payouts/[id]
 * Returns one payout + its line items for the current affiliate. Refuses
 * to return data for a payout owned by a different affiliate.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/06-affiliate-ui.md
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) {
    return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });
  }

  const { data: payout } = await admin
    .from("affiliate_payouts")
    .select(
      "id, affiliate_account_id, ripe_total_cents, offset_applied_cents, net_transferred_cents, stripe_transfer_id, status, failure_reason, blocked_reason, created_at, transferred_at, trigger_source, notes",
    )
    .eq("id", id)
    .maybeSingle();

  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }
  if (
    (payout as { affiliate_account_id: string }).affiliate_account_id !==
    (affiliate as { id: string }).id
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: items } = await admin
    .from("affiliate_payout_items")
    .select(
      "id, conversion_id, applied_amount_cents, offset_applied_cents, created_at",
    )
    .eq("payout_id", id);

  return NextResponse.json({ payout, items: items ?? [] });
}
