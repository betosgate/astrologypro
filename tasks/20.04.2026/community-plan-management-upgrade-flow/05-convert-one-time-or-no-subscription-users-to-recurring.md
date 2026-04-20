# Task 05 - Convert One-Time Or No-Subscription Users To Recurring Checkout

- Status: Planned
- Priority: P0
- Area: Stripe Checkout / Subscription Conversion
- Applies To: Users without an active recurring Stripe subscription

---

## Goal

Ensure one-time/manual/no-subscription users do not receive free upgrades. They must start a new recurring Stripe subscription for the target Community plan.

## Business Rule

One-time payment purchases cannot be upgraded by modifying a Stripe subscription because no recurring subscription exists.

For these users:

- Create a new recurring Stripe Checkout session.
- Use the target tier's recurring `stripe_price_id`.
- Do not update `pm_tier_id` before payment confirmation.
- Grant target plan access only after Stripe confirms payment/subscription success.

## Implementation Steps

1. Detect that the user has no active recurring Stripe subscription.
2. Fetch the target tier dynamically.
3. Validate target tier has a recurring `stripe_price_id`.
4. Create a Stripe Checkout session in subscription mode.
5. Attach metadata that identifies this as a Community plan subscription conversion.
6. Return checkout URL to frontend.
7. Keep existing DB tier unchanged until webhook/finalizer confirms success.

## Metadata Guidance

Use a new flow identifier, for example:

```txt
flow = community_plan_subscription_conversion
user_id = ...
community_member_id = ...
target_tier_id = ...
```

Do not reuse:

```txt
perennial_community_signup
trainee_signup
mystery_school
```

unless existing code has a confirmed equivalent for this exact flow.

## Acceptance Criteria

- [ ] No-subscription users redirect to recurring Stripe Checkout.
- [ ] One-time/manual users redirect to recurring Stripe Checkout.
- [ ] Target tier recurring `stripe_price_id` is used.
- [ ] `pm_tier_id` is not updated before payment confirmation.
- [ ] Abandoned checkout leaves the current plan unchanged.
- [ ] Existing Perennial signup checkout is not affected.
