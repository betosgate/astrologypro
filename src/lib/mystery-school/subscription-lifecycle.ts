import Stripe from "stripe";

export interface MysterySchoolLifecycleUpdate {
  status: "active" | "paused" | "cancelled";
  paused_at: string | null;
  cancelled_at: string | null;
  // Billing metadata only. Dashboard access is controlled strictly by status.
  access_expires_at: string | null;
}

export function getSubscriptionPeriodEndIso(
  subscription: Stripe.Subscription
): string | null {
  const subAny = subscription as unknown as { current_period_end?: number };
  return subAny.current_period_end
    ? new Date(subAny.current_period_end * 1000).toISOString()
    : null;
}

export function mapMysterySchoolLifecycleUpdate(
  subscription: Stripe.Subscription,
  nowIso: string
): MysterySchoolLifecycleUpdate {
  const periodEnd = getSubscriptionPeriodEndIso(subscription);
  const cancelAtPeriodEnd =
    (subscription as unknown as { cancel_at_period_end?: boolean })
      .cancel_at_period_end ?? false;
  const stripeStatus = subscription.status;

  const nextStatus: MysterySchoolLifecycleUpdate["status"] =
    stripeStatus === "paused"
      ? "paused"
      : stripeStatus === "active" && cancelAtPeriodEnd
        ? "cancelled"
        : stripeStatus === "active" ||
            stripeStatus === "trialing" ||
            stripeStatus === "past_due"
          ? "active"
          : "cancelled";

  if (nextStatus === "active") {
    return {
      status: "active",
      paused_at: null,
      cancelled_at: cancelAtPeriodEnd ? nowIso : null,
      access_expires_at: cancelAtPeriodEnd ? periodEnd : null,
    };
  }

  if (nextStatus === "paused") {
    return {
      status: "paused",
      paused_at: nowIso,
      cancelled_at: null,
      access_expires_at: null,
    };
  }

  return {
    status: "cancelled",
    paused_at: null,
    cancelled_at: nowIso,
    access_expires_at: periodEnd ?? nowIso,
  };
}
