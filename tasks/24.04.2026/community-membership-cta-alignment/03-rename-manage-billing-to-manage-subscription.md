# Task 03 - Rename Manage Billing To Manage Subscription

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Membership Card / Billing UX
- Page Route: `/community`

---

## Goal

Rename the final PM membership-card billing CTA from `Manage Billing` to `Manage Subscription` while keeping its behavior aligned with the Stripe customer portal pattern already used elsewhere in the app.

## Desired Behavior

The visible CTA should read:

- `Manage Subscription`

And it should still:

- call the PM billing-portal endpoint
- open Stripe customer portal
- behave consistently with Mystery School and Diviner billing-management entry points

## Reference Patterns

Compare behavior with:

- Mystery School portal-based subscription management
- Diviner dashboard portal-based billing management

The PM card does not need to copy their exact styling, but it should remain portal-based rather than introducing new custom in-card logic.

## Implementation Notes

Target file:

- `src/components/community/membership-card.tsx`

Keep the existing portal handler unless the audit reveals a concrete mismatch that must be corrected.

This task is about:

- label alignment
- portal-path consistency

It is not about:

- redesigning the API
- rebuilding billing management
- changing Stripe portal destination logic unless required

## Acceptance Criteria

- [ ] The visible CTA label is `Manage Subscription`
- [ ] Clicking it still opens the PM Stripe customer portal flow
- [ ] The CTA remains the single visible billing-management action on the card after Task 02
