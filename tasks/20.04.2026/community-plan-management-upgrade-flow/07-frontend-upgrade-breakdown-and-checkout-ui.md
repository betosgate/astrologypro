# Task 07 - Frontend Upgrade Breakdown And Checkout UI

- Status: Planned
- Priority: P0
- Area: Frontend / Community Plan UI
- Page Route: `/community/plan`

---

## Goal

Show users the correct upgrade path and price breakdown before they confirm payment.

## Required UI Behavior

For active recurring subscribers:

- Show current plan.
- Show target plan.
- Show prorated amount due now.
- Show next renewal date.
- Show next renewal full amount.
- Confirm that target plan starts after successful payment.

For one-time/manual/no-subscription users:

- Explain that upgrading starts a recurring subscription.
- Show target plan recurring price.
- Redirect to Stripe Checkout.
- Do not imply a free upgrade or instant DB-only switch.

## Implementation Steps

1. Update the plan selection button handler to call the backend decision/preview flow.
2. If response indicates active subscription upgrade, show the prorated breakdown confirmation.
3. If response indicates recurring checkout required, create or receive the checkout URL and redirect.
4. If response indicates blocked payment state, show a clear recoverable error.
5. Keep loading and disabled states stable.
6. Refresh current plan state after successful upgrade finalization.

## Copy Requirements

Keep copy direct and transactional. Avoid promising access before payment success.

Example active subscription message:

```txt
You will pay the prorated difference today. Your new plan starts after payment succeeds. Your next renewal will charge the full target plan amount.
```

Example conversion message:

```txt
This upgrade starts a recurring subscription. Your new plan starts after checkout is complete.
```

## Acceptance Criteria

- [ ] Active subscribers see a price breakdown before payment.
- [ ] One-time/manual/no-subscription users are redirected to checkout.
- [ ] UI does not show `$NaN`.
- [ ] UI does not update current plan before backend confirms payment success.
- [ ] Payment failure or cancellation leaves the current plan visible.
- [ ] Mobile and desktop layouts remain stable.
