# Task 05 - Harden Booking Payment and Order Linkage

- Status: Done
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

- [x] Create a paid booking and confirm the payment intent includes destination payout data.
- [x] Confirm the saved booking references the correct service and diviner.
- [x] Confirm the related order record matches the booking context.
- [x] Confirm service/diviner mismatch requests are rejected.

## Completion Notes

This flow is now hardened across the existing booking and webhook pipeline:

- `src/app/api/stripe/booking-payment/route.ts`
  - authoritative service lookup remains first
  - authoritative diviner lookup remains first
  - service/diviner mismatch already hard-fails
  - paid intents already use destination-charge style `transfer_data.destination`
  - Stripe metadata now includes:
    - `bookingId`
    - `bookingToken`
    - `orderId`
    - `divinerId`
    - `serviceId`
    - `clientEmail`
    - `connectedAccountId`
- `src/lib/orders.ts`
  - existing orders linked to the same booking now hard-fail if client, diviner, service, or payment-intent linkage drifts from the booking context
- `src/app/api/stripe/webhooks/route.ts`
  - already reconciles successful payment events back into the same booking and order chain via `ensureOrderForBooking`

Result:

- booking, order, and Stripe payment metadata now represent the same commercial event more explicitly
- destination payout routing remains tied to the intended connected account
- reconciliation failures now fail loudly instead of silently mutating a mismatched order record
