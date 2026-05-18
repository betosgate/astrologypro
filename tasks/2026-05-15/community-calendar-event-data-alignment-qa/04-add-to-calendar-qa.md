# Add To Calendar QA

## Goal

Confirm Add to Calendar uses accurate saved event times.

## What To Test

Use:

- one one-time event
- one recurring generated occurrence

## Test Steps

1. Open `/community/events`.
2. Select the event.
3. Click Add to Calendar.
4. Inspect downloaded/opened calendar data.
5. Confirm title, start, end, and description are accurate.

## Expected Behavior

Add to Calendar must use:

```txt
calendar_events.title
calendar_events.description
calendar_events.start_at
calendar_events.end_at
```

It must not use:

- selected calendar day only
- browser current time
- recurring rule range
- series start date for every occurrence

## Timezone Note

The saved DB values are UTC timestamps. Calendar clients should interpret them correctly.

Community UI can show user-local time, but ICS/Add to Calendar should be based on the saved occurrence timestamps.

## Acceptance Criteria

- One-time event calendar output is accurate.
- Recurring generated occurrence calendar output is accurate.
- Occurrence #2 does not export occurrence #1's time.
- Missing optional description does not break export.

