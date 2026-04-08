# Apply Member Discount At Booking - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Token consumed when paying for a booking in `src/app/api/stripe/booking-payment/route.ts` — discount applied to PaymentIntent and token marked as used.
- Priority: P1
- Owner: Fullstack
- Scope: transit CTA, Astro checkout application, token consumption
- Estimate: 1-2 days
- Task File: `docs/tasks/perennial/2026-04-06/07-member-discount-application-at-booking.md`

## Goal

Connect the validated member-discount token into the actual AstrologyPro booking flow.

## Verified Current Code Truth

- The requirement document expects a monthly-transit CTA and a booking-time 5 percent discount.
- The current project does not expose a verified end-to-end application path where:
  - transit page creates or forwards the token
  - Astro checkout applies the platform-cut discount
  - token is marked used on booking confirmation

## Required Behavior

1. Monthly transit page exposes the booking CTA.
2. Valid token reaches checkout.
3. Platform fee is reduced from 20 percent to 15 percent for valid token bookings.
4. Diviner payout remains unchanged.
5. Token is marked used after successful booking.

## Tasks

1. Add booking CTA on the monthly transit experience.
2. Pass token into the booking flow.
3. Apply the platform-cut discount in pricing logic.
4. Mark the token used on successful booking confirmation.

## Acceptance Criteria

- transit CTA is visible
- valid token affects checkout pricing
- diviner payout is unchanged
- token is consumed after successful booking

## Verification Test Plan

1. Trigger the CTA from monthly transits.
2. Validate the token arrives in booking flow.
3. Complete booking and verify pricing plus token-consumption behavior.

## Notion Summary

P1 conversion gap: after token issuance exists, the Perennial transit experience still needs the booking-side discount application and token-consumption behavior.
