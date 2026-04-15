import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Look up an existing Stripe customer by email, or create one.
 * Stripe Accounts V2 requires a customer object (not just customer_email)
 * when creating Checkout sessions in test mode.
 */
export async function getOrCreateStripeCustomer(
  email: string,
  metadata?: Record<string, string>
): Promise<string> {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const customer = await stripe.customers.create({ email, metadata });
  return customer.id;
}
