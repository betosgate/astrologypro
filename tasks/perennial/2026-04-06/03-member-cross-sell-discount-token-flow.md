# Add Member Cross-sell Discount Token Flow - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Token issuance + validation: `src/app/api/community/discount-token/route.ts` and `.../validate/route.ts`. Token applied at booking: `src/app/api/stripe/booking-payment/route.ts`.
- Priority: P1
- Owner: Fullstack
- Scope: discount token issuance, validation, booking application, usage tracking
- Estimate: 2-3 days
- Task File: `docs/tasks/perennial/2026-04-06/03-member-cross-sell-discount-token-flow.md`

## Goal

Implement the requirement-driven 5 percent community member discount flow for AstrologyPro bookings.

## Verified Current Code Truth

- The requirement document specifies a member cross-sell flow from monthly transit into AstrologyPro booking.
- The current project does not expose a verified implementation for:
  - `member_discount_tokens`
  - `POST /api/community/discount-token`
  - `GET /api/astro/validate-token`
  - token issuance from the monthly transit page
  - platform-cut discount application at booking



## User-Visible Problem

Community members do not yet have the promised “members get 5% off” reading flow from the transit experience into AstrologyPro checkout.

## Required Behavior

1. Members must be able to generate a single-use discount token from the monthly transit page.
2. Token validity must check active membership, expiry, and usage state.
3. AstrologyPro checkout must validate the token.
4. The 5 percent discount must reduce the platform cut only, not the diviner share.
5. Tokens must mark used on confirmed booking.

## Tasks

1. Add token persistence model and issuance endpoint.
2. Add member CTA from the monthly transit page.
3. Add validation endpoint for Astro booking flow.
4. Apply the 5 percent platform-cut discount in checkout pricing logic.
5. Mark the token used on booking confirmation.

## Acceptance Criteria

- monthly transit page exposes the discount CTA
- token creation works for active members only
- token validation rejects expired or used tokens
- platform fee drops from 20 percent to 15 percent for valid token bookings
- diviner payout remains unchanged
- token is marked used after successful booking

## Verification Test Plan

1. Open the monthly transit page as an active member and generate a token.
2. Verify the token reaches the AstrologyPro booking flow.
3. Validate the token during checkout and confirm pricing changes correctly.
4. Complete a booking and confirm the token is marked used.
5. Retry the token and confirm reuse is rejected.

## Notion Summary

P1 revenue-flow gap: community members still need the documented 5 percent cross-sell token flow so transit readers can convert into AstrologyPro bookings without reducing diviner payout.
