// Required env vars:
// STRIPE_SECRET_KEY — already used by platform billing
// NEXT_PUBLIC_APP_URL — already set
// STRIPE_DIVINER_WEBHOOK_SECRET — add to Vercel for diviner subscription events

import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Get or create a Stripe customer for a diviner.
 * Stores the customer ID on the diviners row if newly created.
 * Returns the Stripe customer ID.
 */
export async function getOrCreateDivinerCustomer(
  divinerId: string,
  email: string,
  name: string
): Promise<string> {
  const admin = createAdminClient();

  // Check if the diviner already has a customer ID
  const { data: diviner } = await admin
    .from("diviners")
    .select("stripe_customer_id")
    .eq("id", divinerId)
    .single();

  if (diviner?.stripe_customer_id) {
    return diviner.stripe_customer_id;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { diviner_id: divinerId },
  });

  // Persist the customer ID
  await admin
    .from("diviners")
    .update({ stripe_customer_id: customer.id })
    .eq("id", divinerId);

  return customer.id;
}

/**
 * Create a Stripe Checkout session for a diviner SaaS plan subscription.
 * Returns the hosted checkout URL.
 */
export async function createDivinerPlanCheckout(params: {
  divinerId: string;
  email: string;
  name: string;
  stripePriceId: string;
  successUrl: string;
  cancelUrl: string;
  addonPriceIds?: string[];
}): Promise<string> {
  const { divinerId, email, name, stripePriceId, successUrl, cancelUrl, addonPriceIds } = params;

  const customerId = await getOrCreateDivinerCustomer(divinerId, email, name);

  const lineItems: { price: string; quantity: number }[] = [
    { price: stripePriceId, quantity: 1 },
    ...(addonPriceIds ?? []).map((priceId) => ({ price: priceId, quantity: 1 })),
  ];

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: lineItems,
    metadata: {
      diviner_id: divinerId,
      type: "diviner_saas",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error("Stripe checkout session did not return a URL");
  }

  return session.url;
}

/**
 * Create a Stripe Billing Portal session for a diviner.
 * Returns the portal URL.
 */
export async function createDivinerBillingPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Cancel a diviner plan subscription at the end of the current billing period.
 */
export async function cancelDivinerPlanAtPeriodEnd(
  stripeSubscriptionId: string
): Promise<void> {
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}
