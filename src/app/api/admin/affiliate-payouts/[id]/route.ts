import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/affiliate-payouts/[id]
 * Returns one payout + its line items + the affiliate identity for context.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/07-admin-ui.md
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const admin = createAdminClient();
  const { data: payout } = await admin
    .from("affiliate_payouts")
    .select(
      "id, affiliate_account_id, stripe_account_id, ripe_total_cents, offset_applied_cents, net_transferred_cents, stripe_transfer_id, stripe_idempotency_key, status, failure_reason, blocked_reason, created_at, transferred_at, trigger_source, triggered_by, notes",
    )
    .eq("id", id)
    .maybeSingle();
  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  const p = payout as Record<string, unknown>;
  const { data: items } = await admin
    .from("affiliate_payout_items")
    .select(
      "id, conversion_id, applied_amount_cents, offset_applied_cents, created_at",
    )
    .eq("payout_id", id);

  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select(
      "id, email, status, stripe_account_id, stripe_payouts_enabled, balance_offset_cents",
    )
    .eq("id", p.affiliate_account_id as string)
    .maybeSingle();

  return NextResponse.json({
    payout,
    items: items ?? [],
    affiliate: affiliate ?? null,
  });
}
