import test from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import {
  getSubscriptionPeriodEndIso,
  mapMysterySchoolLifecycleUpdate,
} from "@/lib/mystery-school/subscription-lifecycle";

function makeSubscription(
  status: Stripe.Subscription.Status,
  overrides: Partial<Stripe.Subscription> = {}
): Stripe.Subscription {
  return {
    id: "sub_test",
    object: "subscription",
    billing_cycle_anchor: 0,
    cancel_at: null,
    cancel_at_period_end: false,
    canceled_at: null,
    collection_method: "charge_automatically",
    created: 0,
    currency: "usd",
    current_period_end: 1_777_777_777,
    current_period_start: 1_777_000_000,
    customer: "cus_test",
    default_payment_method: null,
    default_source: null,
    default_tax_rates: [],
    description: null,
    discount: null,
    ended_at: null,
    items: { object: "list", data: [], has_more: false, url: "/v1/subscription_items" },
    latest_invoice: null,
    livemode: false,
    metadata: {},
    next_pending_invoice_item_invoice: null,
    on_behalf_of: null,
    pause_collection: null,
    payment_settings: {
      payment_method_options: null,
      payment_method_types: null,
      save_default_payment_method: null,
    },
    pending_invoice_item_interval: null,
    pending_setup_intent: null,
    pending_update: null,
    plan: null as never,
    quantity: 1,
    schedule: null,
    start_date: 0,
    status,
    test_clock: null,
    transfer_data: null,
    trial_end: null,
    trial_settings: { end_behavior: { missing_payment_method: "create_invoice" } },
    trial_start: null,
    ...overrides,
  } as Stripe.Subscription;
}

test("scheduled cancellation maps to cancelled with end-of-period access", () => {
  const now = "2026-04-08T07:30:00.000Z";
  const subscription = makeSubscription("active", {
    cancel_at_period_end: true,
    current_period_end: 1_778_000_000,
  });

  assert.equal(
    getSubscriptionPeriodEndIso(subscription),
    "2026-05-05T16:53:20.000Z"
  );
  assert.deepEqual(mapMysterySchoolLifecycleUpdate(subscription, now), {
    status: "cancelled",
    paused_at: null,
    cancelled_at: now,
    access_expires_at: "2026-05-05T16:53:20.000Z",
  });
});

test("resumed active subscription clears cancellation fields", () => {
  const now = "2026-04-08T07:30:00.000Z";
  const subscription = makeSubscription("active", {
    cancel_at_period_end: false,
  });

  assert.deepEqual(mapMysterySchoolLifecycleUpdate(subscription, now), {
    status: "active",
    paused_at: null,
    cancelled_at: null,
    access_expires_at: null,
  });
});

test("paused subscription maps to paused state", () => {
  const now = "2026-04-08T07:30:00.000Z";
  const subscription = makeSubscription("paused");

  assert.deepEqual(mapMysterySchoolLifecycleUpdate(subscription, now), {
    status: "paused",
    paused_at: now,
    cancelled_at: null,
    access_expires_at: null,
  });
});

test("deleted or canceled subscription keeps access only until period end", () => {
  const now = "2026-04-08T07:30:00.000Z";
  const subscription = makeSubscription("canceled", {
    current_period_end: 1_777_000_123,
  });

  assert.deepEqual(mapMysterySchoolLifecycleUpdate(subscription, now), {
    status: "cancelled",
    paused_at: null,
    cancelled_at: now,
    access_expires_at: "2026-04-24T03:08:43.000Z",
  });
});
