# Add My Booked Sessions Section

## Objective

Update `/community/sessions` so Perennial members can see their own booked service readings inside the community portal.

## Current Problem

`/community/sessions` currently duplicates community event data from `calendar_events`. A member who books a reading from `/services` cannot naturally find that booked reading or recording in the community portal.

## Required UI Sections

Add these sections to `/community/sessions`:

- Upcoming Booked Sessions
- Completed Sessions And Recordings
- Community Schedule Preview

The existing `calendar_events` display can move into "Community Schedule Preview" for this phase. Do not delete it yet.

## Upcoming Booked Sessions

Show:

- service name
- diviner/practitioner name
- scheduled date/time
- status badge
- duration
- Join action when link is available
- Manage action to `/booking/{bookingToken}` when token exists
- Add to Calendar action if practical using existing ICS endpoint

Important:

- The real session page still enforces the 15-minute open window. The community page can show the Join button, but text should make clear the room opens near start time, or the session page will show the not-open state.

## Completed Sessions And Recordings

Show:

- service name
- diviner/practitioner name
- completed/scheduled date
- Watch Recording action when `recording_share_id` and `recording_url` exist
- Book Again action when diviner username and service slug exist

If recording is not ready:

- show a neutral "Recording processing" or "Recording unavailable" state only for completed sessions.

## Community Schedule Preview

Keep a small version of existing upcoming community events:

- first few upcoming `calendar_events`
- CTA to `/community/events`

## Acceptance Criteria

- `/community/sessions` becomes useful even when no community events exist.
- Booked service sessions are clearly separate from community calendar events.
- Existing event data is still reachable.
- No existing booking/session/recording routes are changed.

