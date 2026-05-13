# Day 2 Plan

Date: 2026-05-14

## Goal

Finish the first professional version of the Perennial sessions/events relationship.

Day 1 should already make `/community/sessions` a member-owned service session hub. Day 2 adds cross-links, RSVP'd event context, polish, and regression QA.

## Preserve

- `/community/events` calendar behavior
- RSVP API behavior
- existing `calendar_events` table usage
- existing `event_rsvps` table usage
- existing booking/session/recording flows
- existing notification system state, even though notifications are not part of this phase

## Outcome

The client should see two clear modules:

- Events: community calendar and RSVP
- Sessions: my booked readings, join links, recordings, and related RSVP'd events

