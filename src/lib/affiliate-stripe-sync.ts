import type { SupabaseClient } from "@supabase/supabase-js";
import { getAffiliateConnectStatus } from "@/lib/stripe/affiliate-connect";

/**
 * Refresh affiliate_accounts.stripe_*_enabled cache columns from Stripe.
 *
 * Idempotent. Safe to call from webhook + status endpoint + admin tools.
 * Throws on the underlying Stripe call; caller decides whether to retry.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/02-stripe-express-onboarding.md
 */
export async function syncAffiliateStripeStatus(input: {
  admin: SupabaseClient;
  affiliateAccountId: string;
  /** When set, bypass the row read (for webhook callers who already have the ID) */
  knownStripeAccountId?: string;
}): Promise<{ payoutsEnabled: boolean; chargesEnabled: boolean }> {
  const { admin, affiliateAccountId, knownStripeAccountId } = input;

  let stripeAccountId = knownStripeAccountId ?? null;
  if (!stripeAccountId) {
    const { data: row } = await admin
      .from("affiliate_accounts")
      .select("stripe_account_id")
      .eq("id", affiliateAccountId)
      .maybeSingle();
    stripeAccountId =
      ((row as Record<string, unknown> | null)?.stripe_account_id as string | null) ?? null;
  }

  if (!stripeAccountId) {
    throw new Error("affiliate has no stripe_account_id");
  }

  const status = await getAffiliateConnectStatus(stripeAccountId);

  await admin
    .from("affiliate_accounts")
    .update({
      stripe_payouts_enabled: status.payoutsEnabled,
      stripe_charges_enabled: status.chargesEnabled,
      stripe_details_submitted: status.detailsSubmitted,
      stripe_account_synced_at: new Date().toISOString(),
    })
    .eq("id", affiliateAccountId);

  // Phase 2 / Task 09 hook: if Stripe still reports outstanding requirements
  // and payouts aren't enabled, fire the verification-needed notification.
  // Best-effort, swallow errors — don't fail the sync on a notification miss.
  if (
    !status.payoutsEnabled &&
    (status.requirementsCurrentlyDue.length > 0 ||
      status.requirementsPastDue.length > 0)
  ) {
    try {
      const { notifyAffiliateStripeVerificationNeeded } = await import(
        "@/lib/affiliate-notifications"
      );
      await notifyAffiliateStripeVerificationNeeded({
        admin,
        affiliateAccountId,
        requirementsCurrentlyDue: status.requirementsCurrentlyDue,
        requirementsPastDue: status.requirementsPastDue,
      });
    } catch (err) {
      console.error(
        "[syncAffiliateStripeStatus] verification notification failed",
        err,
      );
    }
  }

  return {
    payoutsEnabled: status.payoutsEnabled,
    chargesEnabled: status.chargesEnabled,
  };
}
