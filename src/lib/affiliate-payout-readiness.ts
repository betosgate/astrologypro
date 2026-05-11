import type { SupabaseClient } from "@supabase/supabase-js";

export type ReadinessResult =
  | { ready: true; affiliateAccountId: string }
  | {
      ready: false;
      reason:
        | "not_affiliate"
        | "blocked"
        | "no_stripe_account"
        | "stripe_payouts_disabled";
      message: string;
      cta: "connect" | "resume" | "verify" | "contact_support";
    };

/**
 * Single source of truth for "is this affiliate allowed to create new
 * campaigns / share links?". Every gate calls this — keeps the rule
 * in one place. Grandfathering happens at the call site (don't call
 * this when reading existing campaigns).
 *
 * The `cta` field tells the UI which button to surface.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/03-campaign-gate-middleware.md
 */
export async function checkAffiliatePayoutReadiness(input: {
  admin: SupabaseClient;
  userId: string;
}): Promise<ReadinessResult> {
  const { admin, userId } = input;

  const { data: affiliate, error } = await admin
    .from("affiliate_accounts")
    .select(
      "id, status, stripe_account_id, stripe_payouts_enabled, stripe_details_submitted",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !affiliate) {
    return {
      ready: false,
      reason: "not_affiliate",
      message: "You must be an affiliate to do this.",
      cta: "contact_support",
    };
  }

  const a = affiliate as Record<string, unknown>;

  if (a.status === "blocked") {
    return {
      ready: false,
      reason: "blocked",
      message: "Your affiliate account is blocked. Contact support.",
      cta: "contact_support",
    };
  }

  if (!a.stripe_account_id) {
    return {
      ready: false,
      reason: "no_stripe_account",
      message:
        "Connect a Stripe account before creating new campaigns or share links. Existing campaigns continue to work.",
      cta: "connect",
    };
  }

  if (!a.stripe_payouts_enabled) {
    return {
      ready: false,
      reason: "stripe_payouts_disabled",
      message: a.stripe_details_submitted
        ? "Stripe verification is pending. We'll enable new campaigns the moment Stripe approves your account."
        : "Finish Stripe onboarding to enable new campaigns and share links.",
      cta: a.stripe_details_submitted ? "verify" : "resume",
    };
  }

  return {
    ready: true,
    affiliateAccountId: a.id as string,
  };
}
