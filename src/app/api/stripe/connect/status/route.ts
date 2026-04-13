import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConnectAccountStatus } from "@/lib/stripe/connect";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/connect/status
 * Fetches live Stripe Connect account status for the current diviner,
 * syncs charges_enabled / payouts_enabled back to the DB, and returns
 * the account details (balance, payouts, etc.).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: diviner } = await admin
      .from("diviners")
      .select("id, stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (!diviner?.stripe_account_id) {
      return NextResponse.json({ connected: false });
    }

    const accountId = diviner.stripe_account_id as string;

    // Fetch live status from Stripe
    const status = await getConnectAccountStatus(accountId);

    // Sync back to DB so the UI reflects the real state
    await admin
      .from("diviners")
      .update({
        charges_enabled: status.chargesEnabled,
        payouts_enabled: status.payoutsEnabled,
      })
      .eq("id", diviner.id);

    // Fetch balance for the connected account
    const balance = await stripe.balance.retrieve(
      {},
      { stripeAccount: accountId }
    );

    const availableUsd = balance.available.find((b) => b.currency === "usd");
    const pendingUsd = balance.pending.find((b) => b.currency === "usd");

    // Fetch recent payouts
    const payouts = await stripe.payouts.list(
      { limit: 5 },
      { stripeAccount: accountId }
    );

    return NextResponse.json({
      connected: true,
      accountId,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      balance: {
        available: (availableUsd?.amount ?? 0) / 100,
        pending: (pendingUsd?.amount ?? 0) / 100,
      },
      recentPayouts: payouts.data.map((p) => ({
        id: p.id,
        amount: p.amount / 100,
        currency: p.currency,
        status: p.status,
        arrivalDate: new Date(p.arrival_date * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      })),
    });
  } catch (error) {
    console.error("[stripe/connect/status] error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch Stripe status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
