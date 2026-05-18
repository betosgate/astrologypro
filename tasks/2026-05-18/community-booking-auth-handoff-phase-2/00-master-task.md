# Master - Community Booking Auth Handoff Phase 2

- Status: Proposed
- Priority: P1
- Owner: Full Stack
- Area: Community / services booking / auth ownership
- Source: Phase 1 follow-up after Community My Readings visibility
- Created: 2026-05-18

## Purpose

Make Community-origin reading bookings reliably attach to the logged-in
Community member. Phase 1 can display bookings only when the booking email
matches the member's auth email. Phase 2 should make that match guaranteed for
bookings started from Community.

The model should mirror the trainee appointment flow:

```text
authenticated portal user
→ booking flow resolves auth email
→ email field is prefilled and locked
→ backend enforces the same email
→ post-booking list can find the booking
```

## Task Breakdown

1. `01-community-booking-source-and-token-propagation.md`
   - Add a Community source marker through services and booking routes.
   - Preserve `discount_token` and source through all handoffs.
2. `02-booking-wizard-locked-community-email.md`
   - Add locked email support to the reading booking wizard.
   - Prefill and disable email for Community-origin bookings.
3. `03-backend-auth-email-enforcement.md`
   - Enforce Community auth email in booking-payment.
   - Do not trust client-submitted email for Community-origin bookings.
4. `04-community-booking-qa.md`
   - Verify booking, payment, My Readings visibility, Join, and Details drawer.

## Non-Goals

- No public `/service` guest ownership model in this phase.
- No cancel/reschedule actions in this phase.
- No migration or repair for old bookings made with different emails.
- No redesign of the booking wizard.
- No new details drawer.

## Completion Gate

- Community user starts a booking from a Community CTA.
- Booking flow carries Community source and discount token.
- Booking email is the authenticated Community user email.
- Email field is locked in the UI.
- Backend creates the booking with the authenticated Community email.
- Payment still applies the 5% Community discount.
- New booking appears in `/community/sessions`.
- Details drawer opens for the new booking.

