// GET /api/dashboard/affiliates/summary
// Aggregate stats for the authenticated diviner's affiliate network.
//
// 2026-04-24: rewired off System A. `total_paid_cents` and
// `pending_balance_cents` are no longer computable in Phase 1 (no
// payout ledger until Stripe auto-split lands in Phase 2). Response
// keeps the same keys but `total_paid_cents` is always 0 and
// `pending_balance_cents` is renamed semantically to
// `unpaid_earnings_cents` (same integer, clearer meaning).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  // campaign_conversions does NOT carry diviner_id. Resolve it via the
  // diviner's affiliate-owned campaigns, then aggregate only those rows.
  const [affiliatesRes, campaignsRes] = await Promise.all([
    admin
      .from("diviner_affiliates")
      .select("id, status")
      .eq("diviner_id", diviner.id),
    admin
      .from("affiliate_campaigns")
      .select("id")
      .eq("diviner_id", diviner.id)
      .eq("owner_type", "affiliate"),
  ]);

  const affiliates = affiliatesRes.data ?? [];
  const campaignIds = (campaignsRes.data ?? []).map((c) => c.id);

  let totalCommissionsEarned = 0;
  if (campaignIds.length > 0) {
    const { data: conversions } = await admin
      .from("campaign_conversions")
      .select("commission_amount_cents, reversed_at")
      .in("campaign_id", campaignIds);

    for (const c of conversions ?? []) {
      if (c.reversed_at) continue;
      totalCommissionsEarned += Number(c.commission_amount_cents ?? 0);
    }
  }

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter((a) => a.status === "active").length;

  return NextResponse.json({
    data: {
      total_affiliates: totalAffiliates,
      active_affiliates: activeAffiliates,
      total_commissions_earned_cents: totalCommissionsEarned,
      total_paid_cents: 0, // Phase 2 (Stripe auto-split)
      pending_balance_cents: totalCommissionsEarned,
    },
  });
}
