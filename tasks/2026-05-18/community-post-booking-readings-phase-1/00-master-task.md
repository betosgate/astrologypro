# Master - Community Post-Booking Readings Visibility Phase 1

- Status: Proposed
- Priority: P1
- Owner: Full Stack
- Area: Community / bookings / session details
- Source: Product request to mirror trainee post-booking visibility for Community readings
- Created: 2026-05-18

## Purpose

Give Community members a read-only post-booking experience for their reading
bookings. Members should be able to return to Community, see their booked
readings, join upcoming sessions, and open the existing booking details drawer.

This phase intentionally avoids reschedule/cancel mutations. The goal is to
ship safe visibility first, then layer actions after the data and access model
are verified.

## Task Breakdown

1. `01-community-bookings-api.md`
   - Create `GET /api/community/bookings`.
   - Require authenticated Community member.
   - Match bookings through `clients.email`.
   - Normalize booking rows for Community UI.
2. `02-community-sessions-my-readings-ui.md`
   - Build `/community/sessions` as the “My Readings” surface.
   - Show upcoming and past readings.
   - Include join and details entry points.
3. `03-reuse-booking-detail-sheet.md`
   - Reuse `BookingDetailSheet` with client-safe props.
   - Use existing session details endpoint.
4. `04-confirmation-link-consistency-and-qa.md`
   - Verify confirmation screen, email, Community list, and session page links
     agree.
   - QA access and empty states.

## Non-Goals

- No cancel API in Phase 1.
- No reschedule API in Phase 1.
- No new session-details endpoint unless the existing endpoint fails access QA.
- No `/service` page changes in this phase.
- No redesign of `BookingDetailSheet`.

## Completion Gate

- Logged-in Community member can open `/community/sessions`.
- The page lists only that member's readings.
- Upcoming readings show service, diviner, date/time, status, Join, and Details.
- Past readings show service, diviner, date/time, status, and Details.
- Join URL uses the tokenized session link when a booking token exists.
- Details opens the existing right-side drawer in client-safe mode.
- Another Community member cannot see these bookings.

