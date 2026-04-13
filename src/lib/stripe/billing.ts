import { stripe } from "./client";
import { PLANS, type PlanId } from "@/lib/plans";

interface CreateCheckoutSessionParams {
  email: string;
  userId: string;
  planId: PlanId;
  successUrl: string;
  cancelUrl: string;
  affiliateCode?: string;
}

export async function createCheckoutSession({
  email,
  userId,
  planId,
  successUrl,
  cancelUrl,
  affiliateCode,
}: CreateCheckoutSessionParams) {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const setupPriceId = process.env[plan.setupEnvKey];
  const monthlyPriceId = process.env[plan.monthlyEnvKey];

  if (!setupPriceId || !monthlyPriceId) {
    throw new Error(`Stripe price IDs not configured for plan: ${planId}`);
  }

  return stripe.checkout.sessions.create({
    customer_email: email,
    mode: "subscription",
    line_items: [
      {
        price: setupPriceId,
        quantity: 1,
      },
      {
        price: monthlyPriceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      planId,
      ...(affiliateCode ? { affiliateCode } : {}),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}
