# Regression And Security QA

## Objective

Prove the implementation is additive and does not break existing session, event, booking, recording, or RSVP flows.

## Access QA

- Member A cannot see Member B's bookings.
- Member A cannot access Member B's recording via `/community/sessions`.
- Token links are only shown for bookings owned by current member.
- Guest/token join still works from existing email/manage routes.

## Route QA

- `/community/events` loads calendar and events.
- RSVP GET/POST/DELETE still works.
- `/community/sessions` loads with:
  - no bookings
  - upcoming booking
  - completed booking without recording
  - completed booking with recording
  - RSVP'd upcoming event

## Existing Flow QA

- `/portal/bookings` still loads.
- `/booking/{bookingToken}` still loads.
- `/{divinerUsername}/session/{bookingId}?token={bookingToken}` still loads.
- Early join still shows "Session not open yet".
- Recording route `/session/{recordingShareId}/recording` still loads.
- Booking reminder cron code remains unchanged.

## Technical QA

- Run lint on touched files.
- Run any existing relevant unit tests if present.
- If Playwright is available, capture desktop and mobile screenshots for:
  - `/community/sessions`
  - `/community/events`

## Acceptance Criteria

- No destructive changes.
- No cross-user data leakage.
- No duplicate full event-list experience across both pages.
- Client-facing UX feels clear, professional, and valuable.

