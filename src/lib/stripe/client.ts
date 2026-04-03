import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY is not set");

// Explicitly bind globalThis.fetch to bypass Next.js 16 fetch instrumentation
// which can interfere with Stripe's internal network requests
export const stripe = new Stripe(key, {
  httpClient: Stripe.createFetchHttpClient(fetch.bind(globalThis)),
});
