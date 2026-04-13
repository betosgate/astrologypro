# Task 04 - Enforce Diviner Stripe Connect Payout Readiness

- Status: Open
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

- [ ] Attempt to purchase a paid service for a diviner with no connected account and confirm the catalog/purchase path blocks safely.
- [ ] Attempt for a diviner with a connected and ready account and confirm purchase continues normally.
- [ ] Confirm free services still behave according to explicit business rules.

