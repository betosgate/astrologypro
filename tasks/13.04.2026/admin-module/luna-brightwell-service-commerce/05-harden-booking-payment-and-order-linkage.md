# Task 05 - Harden Booking Payment and Order Linkage

- Status: Open
- Priority: P0
- Owner: Payments / Full-stack

## Objective

Make booking creation, order creation, Stripe charge creation, and diviner payout linkage coherent and auditable as one commerce flow.

## Why This Task Exists

A clean customer journey is not enough. The backend must also guarantee:

- the charge belongs to the correct service
- the booking belongs to the correct diviner
- the order record matches the booking
- the Stripe payment routes funds to the correct connected account

## Current Repo State

The booking payment route already does significant work:

- resolves service
- resolves diviner
- validates service/diviner alignment
- creates payment intent with `transfer_data.destination`
- creates or updates booking/order-related records

That is strong, but this task exists to make the business invariants explicit and complete.

## Required Invariants

1. Service lookup is authoritative.
2. Diviner lookup is authoritative.
3. Service/diviner mismatch must hard-fail.
4. Paid booking must not create a platform-owned charge when the business expects a destination payout.
5. Order and booking records must remain linked to the same commercial event.

## Stripe Rule

For paid service bookings:

- use destination-charge style payment intent or equivalent connected-account flow
- include enough metadata for reconciliation:
  - service ID
  - diviner ID
  - booking token or booking ID when available
  - client email

## Files To Read First

- `src/app/api/stripe/booking-payment/route.ts`
- `src/lib/stripe/connect.ts`
- `src/lib/orders.ts`
- `src/app/api/stripe/webhooks/route.ts`

## Acceptance Criteria

- A successful paid booking has internally consistent booking/order/payment metadata.
- The diviner payout destination is the intended connected account.
- Failure modes are explicit rather than partially persisted.

## Verification Test Plan

- [ ] Create a paid booking and confirm the payment intent includes destination payout data.
- [ ] Confirm the saved booking references the correct service and diviner.
- [ ] Confirm the related order record matches the booking context.
- [ ] Confirm service/diviner mismatch requests are rejected.

