# Service Sessions And Community Events Integration

Date: 2026-05-13

## Goal

Make the Perennial Mandalism community experience professional and clear by separating two related concepts:

- `/community/events` answers: "What is happening in the community?"
- `/community/sessions` answers: "What sessions belong to me, what can I join, and what can I replay?"

This is an additive implementation. Do not remove or break the existing event calendar, RSVP API, booking join flow, session room flow, reminder cron, recording route, or client portal booking pages.

## Current State

- `/community/events` dynamically reads `calendar_events` through `/api/community/events`.
- `/community/events` fetches RSVP state through `/api/community/events/[id]/rsvp`.
- `/community/sessions` currently reads `calendar_events` directly and displays upcoming/past event cards.
- `/services` booked reading sessions are stored in `bookings`.
- Booked sessions already have join and recording flows outside the community portal:
  - `/{divinerUsername}/session/{bookingId}?token={bookingToken}`
  - `/booking/{bookingToken}`
  - `/portal/bookings`
  - `/session/{recordingShareId}/recording`
- Booking reminders already exist at `/api/cron/booking-reminders`.

## Product Direction

Keep `/community/events` as the community calendar.

Evolve `/community/sessions` into the member's personal session hub:

- upcoming booked readings from `/services`
- completed sessions and recordings
- session management actions
- small related section for RSVP'd community events
- link back to the full events calendar

## Non-Goals For This Phase

- Do not rebuild the full notification system.
- Do not remove `/portal/bookings`.
- Do not change the Chime session room implementation.
- Do not change booking payment or Stripe confirmation logic.
- Do not migrate private bookings into `calendar_events`.
- Do not turn `/community/events` into the booking/session hub.

## Required Implementation Principles

- Additive first.
- Preserve existing route behavior unless a task explicitly says to replace it with a compatible equivalent.
- Reuse existing access rules and session links.
- Keep private service bookings separate from community calendar events.
- Use server-side access checks for user-owned data.
- Do not expose booking tokens for sessions that do not belong to the current user.
- Avoid duplicate logic where existing helpers/components can be reused safely.

## Day Split

Day 1: data contract, owned-booking fetch, first `/community/sessions` hub skeleton.

Day 2: connect RSVP'd events, polish empty/loading/error states, QA, and final integration review.

