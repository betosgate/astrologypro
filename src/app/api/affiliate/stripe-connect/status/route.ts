import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAffiliateStripeStatus } from "@/lib/affiliate-stripe-sync";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/stripe-connect/status
 * Returns the cached Stripe status from affiliate_accounts.
 *
 * If the cache is older than 60 seconds AND a stripe_account_id is set,
 * triggers a synchronous remote refresh before responding so the UI
 * never displays stale state on first load post-onboarding return.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/02-stripe-express-onboarding.md
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
    .select(
      "id, stripe_account_id, stripe_payouts_enabled, stripe_charges_enabled, stripe_details_submitted, stripe_account_synced_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ connected: false });
  }

  const STALE_MS = 60_000;
  const lastSync = (affiliate as Record<string, unknown>).stripe_account_synced_at
    ? new Date(
        (affiliate as Record<string, unknown>).stripe_account_synced_at as string,
      ).getTime()
    : 0;
  const ageMs = Date.now() - lastSync;
  const stripeAccountId = (affiliate as Record<string, unknown>).stripe_account_id as
    | string
    | null
    | undefined;

  if (stripeAccountId && ageMs > STALE_MS) {
    try {
      await syncAffiliateStripeStatus({
        admin,
        affiliateAccountId: (affiliate as { id: string }).id,
      });
    } catch (err) {
      console.error("[affiliate/stripe-connect/status] sync error:", err);
    }
  }

  const { data: fresh } = await admin
    .from("affiliate_accounts")
    .select(
      "stripe_account_id, stripe_payouts_enabled, stripe_charges_enabled, stripe_details_submitted, stripe_account_synced_at",
    )
    .eq("id", (affiliate as { id: string }).id)
    .maybeSingle();

  const f = fresh as Record<string, unknown> | null;
  return NextResponse.json({
    connected: !!f?.stripe_account_id,
    stripeAccountId: (f?.stripe_account_id as string | null) ?? null,
    payoutsEnabled: !!f?.stripe_payouts_enabled,
    chargesEnabled: !!f?.stripe_charges_enabled,
    detailsSubmitted: !!f?.stripe_details_submitted,
    syncedAt: (f?.stripe_account_synced_at as string | null) ?? null,
  });
}
