# Task 01 - Audit Current Membership Card CTA Wiring

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Membership Card
- Page Route: `/community`

---

## Goal

Document the current behavior of the PM `Your Membership` card CTAs before changing them, so implementation does not accidentally break a still-used billing path.

## What To Inspect

Inspect the membership card in:

- `src/components/community/membership-card.tsx`

Confirm the current behavior for these actions:

- `Upgrade Plan`
- `Update Payment`
- `Subscribed`
- `Manage Billing`

## What To Record

Record the exact current target or behavior for each CTA:

- whether it links to another route
- whether it opens a custom modal
- whether it redirects to Stripe customer portal
- whether it depends on a linked `stripe_subscription_id`

## Expected Findings

- `Update Payment` currently opens a custom Stripe Elements modal
- `Subscribed` currently opens a custom unsubscribe modal
- `Manage Billing` currently opens Stripe customer portal
- the PM card therefore mixes custom billing UI and portal-based billing UI

## Acceptance Criteria

- [ ] The current CTA wiring is documented clearly
- [ ] The implementation task can safely remove only the intended visible buttons
- [ ] The remaining portal-based CTA path is identified unambiguously
