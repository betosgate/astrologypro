import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY is not set");

// Use undici fetch to bypass Next.js 16 fetch instrumentation
// which can interfere with Stripe's internal requests
export const stripe = new Stripe(key, {
  // @ts-expect-error - httpClient is a valid option in Stripe v21
  httpClient: Stripe.createFetchHttpClient(fetch.bind(globalThis)),
});
