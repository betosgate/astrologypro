# Task 03 - Audit Payment State and Tier Data

- Status: Planned
- Priority: P0
- Area: Backend / Payments
- Endpoint Candidates: `POST /api/community/plan/change-tier`, upgrade preview endpoint, checkout endpoint

---

## Goal

Classify each upgrade attempt into the correct payment path before any tier update occurs.

## Required User States

The backend must distinguish:

1. Active recurring Stripe subscriber
2. One-time/manual/no-subscription user
3. Invalid or blocked payment state

## Data To Verify

Inspect the active database and code for:

- `community_members.pm_tier_id`
- `community_members.stripe_customer_id`
- `community_members.stripe_subscription_id`
- `community_members.membership_status`
- target tier `stripe_price_id`
- current tier price
- target tier price
- subscription status from Stripe when needed

## Implementation Steps

1. Fetch the authenticated member.
2. Fetch current tier using `pm_tier_id`.
3. Fetch target tier from request input.
4. Validate target tier exists and is active.
5. Validate target tier has a recurring Stripe `stripe_price_id`.
6. If `stripe_subscription_id` exists, verify the subscription with Stripe before treating it as active.
7. If no active recurring subscription exists, classify the user as requiring recurring subscription checkout.
8. If Stripe state is cancelled, unpaid, incomplete, or mismatched, return a blocked or checkout-required response without updating DB.

## Output Contract

Backend decision responses should clearly communicate one of:

```txt
active_subscription_upgrade
requires_recurring_checkout
blocked_payment_state
```

Use exact field names that fit the existing API style.

## Acceptance Criteria

- [ ] Active recurring subscribers are detected correctly.
- [ ] One-time/manual/no-subscription users are not treated as subscription upgrades.
- [ ] Target tier `stripe_price_id` is required before checkout or subscription update.
- [ ] No DB tier update happens during classification.
- [ ] Stripe/API errors are logged and returned safely.
