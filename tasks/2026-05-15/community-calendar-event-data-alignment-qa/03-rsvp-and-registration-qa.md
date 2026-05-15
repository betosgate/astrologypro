# RSVP And Registration QA

## Goal

Confirm RSVP works against real saved event rows, especially recurring generated occurrences.

## Test Events

Use at least:

1. One one-time event.
2. One recurring generated occurrence.
3. A second occurrence from the same recurring series.

## Test Steps

For each event:

1. Open `/community/events`.
2. Select the event day.
3. Click `Going`.
4. Confirm selected-day card updates.
5. Confirm event appears in My Registered Events.
6. Change to `Maybe`.
7. Confirm My Registered Events and event card update.
8. Change to `Can't Go`.
9. Confirm state updates correctly.

## Recurring-Specific Check

RSVP to occurrence #1.

Then inspect occurrence #2 from the same series.

Expected:

```txt
Occurrence #2 should not automatically inherit occurrence #1 RSVP.
```

Reason:

Each generated occurrence is a real `calendar_events` row with its own `id`.

## Data Check

If needed, inspect `event_rsvps`:

```txt
event_id should match the selected calendar_events.id
```

## Acceptance Criteria

- RSVP targets event ID, not title/date.
- Each recurring occurrence has independent RSVP state.
- My Registered Events only shows the events the user RSVP'd to.
- No duplicate registration rows are created for the same user/event.

