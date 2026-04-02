import { stripe } from "./client";

interface CreateConnectAccountParams {
  email: string;
  divinerId: string;
}

export async function createConnectAccount({
  email,
  divinerId,
}: CreateConnectAccountParams) {
  return stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      divinerId,
    },
  });
}

interface CreateConnectOnboardingLinkParams {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

export async function createConnectOnboardingLink({
  accountId,
  refreshUrl,
  returnUrl,
}: CreateConnectOnboardingLinkParams) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

interface CreatePaymentIntentParams {
  amount: number;
  connectedAccountId: string;
  platformFeeAmount: number;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent({
  amount,
  connectedAccountId,
  platformFeeAmount,
  metadata,
}: CreatePaymentIntentParams) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    application_fee_amount: Math.round(platformFeeAmount * 100),
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata: metadata ?? {},
  });
}

export async function getConnectAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}
