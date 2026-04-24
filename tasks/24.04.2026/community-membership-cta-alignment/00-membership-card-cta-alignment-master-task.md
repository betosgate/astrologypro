# Master Task - Align Community Membership Card CTAs With Latest Client Direction

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Membership Card / Billing UX
- Page Route: `/community`

---

## Goal

Update the PM `Your Membership` card actions to match the latest client instruction:

- hide `Update Payment`
- hide `Subscribed`
- rename `Manage Billing` to `Manage Subscription`
- keep the final action portal-based, matching the Mystery School and Diviner patterns

## Why This Task Exists

The current PM membership card mixes two architectural directions:

- custom in-page billing actions (`Update Payment`, `Subscribed`)
- Stripe customer portal fallback (`Manage Billing`)

The client has now chosen a simpler direction for this section:

- remove the custom payment-update and subscribed/unsubscribe CTAs from the card
- keep one Stripe-portal management entry point
- label that entry point as `Manage Subscription`

## Important Implementation Rule

Do not hard-delete the removed CTAs in this task bundle.

For `Update Payment` and `Subscribed`, comment out the rendered button blocks so the prior implementation remains easy to restore if the requirement changes again.

## Task Breakdown

1. `01-audit-current-membership-card-cta-wiring.md`
   Confirm the current button set, routes, and portal/custom-modal split on the PM membership card.

2. `02-hide-update-payment-and-subscribed-ctas.md`
   Comment out `Update Payment` and `Subscribed` in the PM membership card UI without deleting the implementation.

3. `03-rename-manage-billing-to-manage-subscription.md`
   Rename the visible CTA label and confirm it still uses the Stripe customer portal flow.

4. `04-regression-and-qa-checklist.md`
   Verify button visibility, portal redirect behavior, and that no unrelated membership card details regress.

## Out Of Scope

- Reworking PM cancellation architecture
- Deleting the old modal code paths
- Removing backend billing endpoints
- Changing upgrade-plan behavior
- Replacing Stripe portal with a custom PM subscription management page

## Acceptance Criteria

- [ ] `Update Payment` is no longer visible on the PM membership card
- [ ] `Subscribed` is no longer visible on the PM membership card
- [ ] Both removed CTAs remain preserved as commented code, not hard-deleted
- [ ] `Manage Billing` is renamed to `Manage Subscription`
- [ ] The renamed CTA still opens the Stripe customer portal
- [ ] The PM membership card remains visually stable on desktop and mobile
