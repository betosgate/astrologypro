# Task 06 - Finalize Payment And Update Membership Safely

- Status: Planned
- Priority: P0
- Area: Stripe Webhook / Finalizer / Database

---

## Goal

Update Stripe subscription state and Community membership state only after successful payment confirmation.

## Finalization Paths

Support both updated payment paths:

1. Active recurring subscriber prorated upgrade
2. One-time/manual/no-subscription user converted to recurring subscription

## Active Recurring Subscriber Finalization

After successful prorated payment:

1. Update the Stripe subscription to the target tier's recurring `stripe_price_id`.
2. Reset the billing cycle according to the business rule.
3. Update `community_members.pm_tier_id`.
4. Update any plan/member limit fields that depend on the target tier.
5. Return or expose success state to the frontend.

## Recurring Checkout Conversion Finalization

After Stripe confirms checkout/subscription success:

1. Verify metadata identifies the Community subscription conversion flow.
2. Verify target tier exists and is active.
3. Store `stripe_customer_id` if needed.
4. Store `stripe_subscription_id`.
5. Update `community_members.pm_tier_id`.
6. Ensure membership remains active.
7. Grant target plan access.

## Failure Rules

- If payment fails, do not update `pm_tier_id`.
- If checkout is abandoned, do not update `pm_tier_id`.
- If Stripe subscription update fails after payment, log and surface a recoverable error for manual reconciliation.
- Do not silently swallow webhook/finalizer errors.

## Acceptance Criteria

- [ ] DB tier changes happen only after confirmed payment.
- [ ] Stripe subscription is updated to target recurring price for active subscriber upgrades.
- [ ] New recurring subscription details are saved for converted users.
- [ ] Failed payment leaves the current plan unchanged.
- [ ] Webhook/finalizer logs include enough context for reconciliation.
- [ ] Existing Stripe webhook flows are not regressed.
