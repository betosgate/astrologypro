import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/earnings-summary
 * Returns aggregated balances for the current affiliate's dashboard.
 *
 * Numbers are computed from campaign_conversions + affiliate_accounts.
 * Cents-based throughout; the UI does the dollar formatting.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/06-affiliate-ui.md
 */
export async function GET() {
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
    .select("id, balance_offset_cents, balance_offset_last_changed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) {
    return NextResponse.json(
      { error: "Affiliate account not found" },
      { status: 404 },
    );
  }

  const a = affiliate as Record<string, unknown>;
  const affiliateId = a.id as string;

  const { data: conversions } = await admin
    .from("campaign_conversions")
    .select(
      "id, commission_amount_cents, paid_amount_cents, payout_status, reversed_at, ripeness_at",
    )
    .eq("affiliate_account_id", affiliateId);

  let earned = 0;
  let paid = 0;
  let pendingRipe = 0;
  let pendingHolding = 0;
  let reversed = 0;
  let offsetApplied = 0;

  const now = Date.now();
  for (const c of (conversions ?? []) as Array<Record<string, unknown>>) {
    const cents = Number((c.commission_amount_cents as number | null) ?? 0);
    if (c.reversed_at) {
      reversed += cents;
      continue;
    }
    earned += cents;
    const status = c.payout_status as string | null;
    if (status === "paid") {
      paid += Number((c.paid_amount_cents as number | null) ?? 0);
    } else if (status === "offset_applied") {
      offsetApplied += Number((c.paid_amount_cents as number | null) ?? 0);
    } else if (status === "ripe" || status === "paying") {
      pendingRipe += cents;
    } else {
      const ripenessMs = c.ripeness_at
        ? new Date(c.ripeness_at as string).getTime()
        : Infinity;
      if (ripenessMs <= now) pendingRipe += cents;
      else pendingHolding += cents;
    }
  }

  const offset = Number((a.balance_offset_cents as number | null) ?? 0);
  const nextCycleNet = Math.max(0, pendingRipe - offset);

  return NextResponse.json({
    earnedCents: earned,
    paidCents: paid,
    pendingRipeCents: pendingRipe,
    pendingHoldingCents: pendingHolding,
    reversedCents: reversed,
    offsetCents: offset,
    offsetLastChangedAt: a.balance_offset_last_changed_at ?? null,
    offsetAppliedHistoricalCents: offsetApplied,
    nextCycleEstimateCents: nextCycleNet,
  });
}
