# Community Events Calendar UI Polish

Date: 2026-05-14

## Goal

Polish `/community/events` into the primary Perennial Mandalism event planning surface.

This phase is UI-first and should use the current `calendar_events` and `event_rsvps` behavior already present in the app. It should not introduce cron, recurrence expansion, session joining, or `/community/sessions` changes.

## Product Direction

The calendar answers:

```txt
What is happening in the community, and what do I plan to attend?
```

It should remain separate from `/community/sessions`, which later answers:

```txt
What sessions belong to me, what can I join, and what can I replay?
```

## Current State

- `/community/events` already renders a monthly calendar.
- `/community/events` already fetches events from `/api/community/events`.
- RSVP state is currently fetched through `/api/community/events/[id]/rsvp`.
- `EventRsvpButton` already exists and can be reused.
- The page already uses the community layout, sidebar, and dark AstrologyPro theme.

## Scope For This Phase

- Redesign only `/community/events`.
- Keep calendar event data source unchanged.
- Keep RSVP behavior unchanged unless a small local refactor is needed.
- Add visual filtering and selected-day agenda UX.
- Add a lightweight Add to Calendar action if practical without backend work.

## Non-Goals

- No cron work.
- No event occurrence table.
- No reminder queue.
- No recurring event authoring.
- No join button from calendar.
- No `/community/sessions` implementation.
- No admin calendar changes unless required for compile safety.

## Desired UX

- Header remains `Events Calendar`.
- Add compact filter/search toolbar.
- Calendar grid remains the central object.
- Calendar cells show richer event indicators.
- Right panel shows selected-day events or upcoming events.
- Event cards support RSVP and planning actions.
- No `View Full Calendar` button on this route.

