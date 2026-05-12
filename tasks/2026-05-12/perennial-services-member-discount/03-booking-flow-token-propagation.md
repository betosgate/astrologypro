# Task PSMD-03 - Booking Flow Token Propagation

- Status: Completed
- Priority: P1
- Owner: Full Stack
- Area: Shared calendar / diviner booking / payment handoff
- Source: Product request to carry member discount to checkout
- Created: 2026-05-12
- Commit: `863df042` - `Wire Perennial reading CTAs to services with member discount`

## Files

- `src/app/book/template/[slug]/page.tsx`
- `src/components/booking/shared-template-calendar.tsx`
- `src/app/discover/discover-filters.tsx`
- `src/app/[username]/book/[serviceSlug]/page.tsx`
- `src/components/booking/booking-wizard.tsx`

## Problem

The shared calendar, choose-diviner branch, and final diviner booking page did
not carry the Perennial member discount token into the payment request.

## Implementation

1. Let `/book/template/[slug]` read `discount_token`.
2. Preserve the token on back/browse links.
3. Pass the token into `SharedTemplateCalendar`.
4. Append token to the handoff URL:
   - `/{username}/book/{serviceSlug}?date=...&time=...`
5. Preserve token in `/discover` diviner-card booking links.
6. Let the diviner booking page accept `discount_token`.
7. Pass token into `BookingWizard`.
8. Include `discount_token` in the `/api/stripe/booking-payment` request.

## Acceptance Criteria

- Shared-calendar direct handoff keeps `discount_token`.
- Choose-diviner `/discover` handoff keeps `discount_token`.
- Final booking page passes the token into payment setup.
- Backend discount validation and consumption remains unchanged.
