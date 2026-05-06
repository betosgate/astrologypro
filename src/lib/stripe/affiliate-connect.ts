import { stripe } from "./client";

interface CreateAffiliateConnectAccountParams {
  email: string;
  affiliateAccountId: string;
}

/**
 * Create a Stripe Express account for an affiliate. Currently US/USD only
 * (per Phase 2 master decision §7). Capabilities request `transfers` —
 * affiliates do NOT charge cards through their own account; the platform
 * sends them money via stripe.transfers.create.
 *
 * Keep this helper distinct from createConnectAccount (the diviner one)
 * — different capabilities, different metadata role tag, easier to audit
 * who owns each account class.
 */
export async function createAffiliateConnectAccount({
  email,
  affiliateAccountId,
}: CreateAffiliateConnectAccountParams) {
  return stripe.accounts.create({
    type: "express",
    email,
    country: "US",
    capabilities: {
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: {
      affiliateAccountId,
      role: "affiliate",
    },
  });
}

interface CreateAffiliateOnboardingLinkParams {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

export async function createAffiliateOnboardingLink({
  accountId,
  refreshUrl,
  returnUrl,
}: CreateAffiliateOnboardingLinkParams) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

export async function getAffiliateConnectStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirementsCurrentlyDue: account.requirements?.currently_due ?? [],
    requirementsPastDue: account.requirements?.past_due ?? [],
    disabledReason: account.requirements?.disabled_reason ?? null,
  };
}
