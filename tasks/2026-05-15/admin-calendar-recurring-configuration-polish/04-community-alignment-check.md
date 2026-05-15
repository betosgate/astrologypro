# Community Alignment Check

## Goal

Confirm the polished admin recurring flow still produces clean data for `/community/events`.

## Important Rule

Community calendar must continue reading real `calendar_events` rows only.

Do not generate fake recurring occurrences on the community page.

## Expected Behavior

Admin creates one-time event:

```txt
One row appears in calendar_events.
One event appears in /community/events.
```

Admin creates recurring event:

```txt
Multiple rows appear in calendar_events.
Each occurrence appears on /community/events.
Each occurrence has its own stable event ID.
```

## Category Alignment

Current clean categories:

- `ritual`
- `sunday_service`
- `live_class`
- `meditation`
- `other`

Community labels should remain predictable:

- Ritual
- Sunday Service
- Live Class
- Meditation
- Other

Do not add event category CRUD in this task.

## RSVP Alignment

Do not redesign RSVP here.

Only verify that RSVP still targets a real event ID and does not depend on a fake recurrence projection.

## Add to Calendar

Verify Add to Calendar uses the occurrence's actual `start_at` / `end_at`.

Timezone display may be user-local, but event data must come from the saved row.

