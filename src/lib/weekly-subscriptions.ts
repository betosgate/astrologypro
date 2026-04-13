import { stripe } from "@/lib/stripe/client";

export type WeeklySubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due"
  | "paused";

export function mapStripeSubscriptionStatus(status: string): WeeklySubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
      return "cancelled";
    default:
      return "active";
  }
}

export async function ensureWeeklySubscriptionStripeProduct(params: {
  productId: string;
  title: string;
  description: string | null;
  priceCents: number;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
}) {
  const {
    productId,
    title,
    description,
    priceCents,
    stripeProductId,
    stripePriceId,
  } = params;

  let resolvedProductId = stripeProductId ?? null;
  let resolvedPriceId = stripePriceId ?? null;

  if (!resolvedProductId) {
    const product = await stripe.products.create({
      name: title,
      description: description ?? undefined,
      metadata: {
        type: "weekly_subscription",
        weeklySubscriptionProductId: productId,
      },
    });
    resolvedProductId = product.id;
  }

  let currentPriceValid = false;
  if (resolvedPriceId) {
    const existingPrice = await stripe.prices.retrieve(resolvedPriceId);
    currentPriceValid =
      existingPrice.active &&
      existingPrice.unit_amount === priceCents &&
      existingPrice.recurring?.interval === "month";
  }

  if (!currentPriceValid) {
    const price = await stripe.prices.create({
      product: resolvedProductId,
      unit_amount: priceCents,
      currency: "usd",
      recurring: {
        interval: "month",
      },
      metadata: {
        type: "weekly_subscription",
        weeklySubscriptionProductId: productId,
      },
    });
    resolvedPriceId = price.id;
  }

  return {
    stripeProductId: resolvedProductId,
    stripePriceId: resolvedPriceId,
  };
}
