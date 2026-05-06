import type { SupabaseClient } from "@supabase/supabase-js";

const SUPPORTED_COUNTRIES = new Set(["US"]);

export type CountryEligibilityResult =
  | { eligible: true; detectedCountryCode: "US" }
  | {
      eligible: false;
      message: string;
      detectedCountryCode: string | null;
    };

/**
 * Pre-validate an affiliate's country before calling Stripe. If they're
 * outside the supported list, surface a friendly message rather than a
 * Stripe error.
 *
 * Detection priority:
 *   1. affiliate_accounts.payout_details.country (if present — JSONB)
 *   2. affiliate_accounts.timezone heuristic (Intl-derived; "US" if America/*)
 *   3. Default to "US" — onboarding will fail at Stripe with clear errors if wrong
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/02-stripe-express-onboarding.md
 */
export async function checkAffiliateCountryEligible(input: {
  admin: SupabaseClient;
  affiliateAccountId: string;
  userEmail: string;
}): Promise<CountryEligibilityResult> {
  const { admin, affiliateAccountId } = input;

  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("payout_details, timezone")
    .eq("id", affiliateAccountId)
    .maybeSingle();

  let detected: string | null = null;
  const payoutDetails =
    ((affiliate as Record<string, unknown> | null)?.payout_details as {
      country?: string;
    } | null) ?? null;
  const timezone = (affiliate as Record<string, unknown> | null)?.timezone as
    | string
    | undefined;

  if (payoutDetails?.country) {
    detected = payoutDetails.country.toUpperCase().slice(0, 2);
  } else if (timezone) {
    const tz = String(timezone);
    if (tz.startsWith("America/")) detected = "US";
  }

  if (!detected) {
    return { eligible: true, detectedCountryCode: "US" };
  }

  if (SUPPORTED_COUNTRIES.has(detected)) {
    return { eligible: true, detectedCountryCode: "US" };
  }

  return {
    eligible: false,
    detectedCountryCode: detected,
    message: `Affiliate payouts are currently US-only. Your account is registered in ${detected}; we'll notify you when international support launches.`,
  };
}
