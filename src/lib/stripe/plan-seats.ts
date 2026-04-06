import { stripe } from "@/lib/stripe/client";

/**
 * updateStripeExtraSeats
 *
 * Synchronises the extra-seat subscription item quantity for a PM plan.
 * - quantity === 0 and item exists → deletes the item
 * - quantity > 0 and item exists  → updates the quantity
 * - quantity > 0 and item missing → creates the item
 * - quantity === 0 and item missing → no-op
 */
export async function updateStripeExtraSeats(
  subscriptionId: string,
  extraPriceId: string,
  quantity: number
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items"],
  });

  const existingItem = subscription.items.data.find(
    (item) => item.price.id === extraPriceId
  );

  if (quantity === 0 && existingItem) {
    await stripe.subscriptionItems.del(existingItem.id);
  } else if (quantity > 0 && existingItem) {
    await stripe.subscriptionItems.update(existingItem.id, { quantity });
  } else if (quantity > 0 && !existingItem) {
    await stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: extraPriceId,
      quantity,
    });
  }
  // quantity === 0 && !existingItem → nothing to do
}
