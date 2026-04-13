# Task 04 - Enforce Diviner Stripe Connect Payout Readiness

- Status: Done
- Priority: P0
- Owner: Payments / Backend

## Objective

Prevent a diviner from exposing public paid services unless their Stripe Connect account is actually ready to receive funds.

## Why This Task Exists

The repo already stores:

- `diviners.stripe_account_id`

and already fetches:

- connect onboarding links
- connect status

But having an account ID is not enough. The platform must ensure the diviner is truly payout-ready.

## Current Repo State

- onboarding and settings surfaces already expose connect flows
- booking payment route already checks `stripe_account_id` before creating a paid payment intent
- Stripe Connect helper creates destination charges with `transfer_data.destination`

## Exact Gap

The product invariant is not yet fully enforced at the catalog/public-selling level:

- a diviner may appear publicly purchasable even if payouts are operationally broken
- the failure may only surface at payment time

That is too late.

## Required Enforcement Rule

For any paid public service:

- the diviner must have a connected account ID
- the account should be confirmed ready enough to accept charges/transfers

At minimum:

- `stripe_account_id` present

Preferred:

- cached or live confirmation that:
  - charges are enabled
  - payouts are enabled
  - details are sufficiently submitted

## Policy Decision

### Safe default

If payout readiness is incomplete:

- paid services should not be publicly sold
- UI should show a controlled unavailable state instead of failing at payment submit

### Exception

Free services may remain bookable if business rules permit.

## Files To Read First

- `src/app/api/stripe/connect/status/route.ts`
- `src/app/api/stripe/connect/onboard/route.ts`
- `src/app/api/stripe/booking-payment/route.ts`
- `src/app/dashboard/settings/page.tsx`

## Acceptance Criteria

- A paid public service cannot be sold when Stripe Connect readiness is incomplete.
- The rule is enforced consistently, not only at the last payment step.
- The diviner has a clear remediation path via onboarding/settings.

## Verification Test Plan

- [x] Attempt to purchase a paid service for a diviner with no connected account and confirm the catalog/purchase path blocks safely.
- [x] Attempt for a diviner with a connected and ready account and confirm purchase continues normally.
- [x] Confirm free services still behave according to explicit business rules.

## Completion Notes

Implemented in the current repo:

- `src/lib/payout-readiness.ts`
  - added shared payout-readiness policy helpers for public selling
- `src/app/[username]/page.tsx`
  - public profile now distinguishes visible services from sellable services
  - paid services are blocked from booking CTAs when Stripe Connect readiness is incomplete
  - booking preview now only uses sellable services
- `src/app/[username]/services/page.tsx`
  - service index now shows a controlled unavailable state for blocked paid services
- `src/app/[username]/services/[slug]/page.tsx`
  - service detail page now disables paid booking CTAs when payout readiness is incomplete
- `src/app/[username]/book/page.tsx`
  - generic booking route now resolves only sellable services and shows a controlled unavailable state when paid booking is blocked
- `src/app/[username]/book/[serviceSlug]/page.tsx`
  - service-specific booking route blocks the wizard for unsellable paid services
- `src/app/api/stripe/booking-payment/route.ts`
  - backend now enforces payout readiness before paid intent creation using `stripe_account_id`, `charges_enabled`, and `payouts_enabled`

Result:

- paid services are no longer silently sellable when Stripe Connect is not operationally ready
- the block happens before checkout submission, not only at the last Stripe step
- free services remain allowed because payout-readiness checks only apply when the booking still has a positive payable amount
