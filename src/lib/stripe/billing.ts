import { stripe } from "./client";

interface CreateCheckoutSessionParams {
  email: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  email,
  userId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams) {
  return stripe.checkout.sessions.create({
    customer_email: email,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_SETUP!,
        quantity: 1,
      },
      {
        price: process.env.STRIPE_PRICE_MONTHLY!,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
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
