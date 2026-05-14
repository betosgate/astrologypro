# Polish Events And Sessions Interconnection

## Objective

Make `/community/events` and `/community/sessions` feel intentionally connected, not duplicated.

## `/community/events` Polish

Keep this page focused on community schedule:

- calendar
- event list
- RSVP
- event categories
- link or CTA toward `/community/sessions` only where useful

Recommended CTA copy:

```txt
View your booked sessions and recordings
```

Target:

```txt
/community/sessions
```

## `/community/sessions` Polish

Keep this page focused on member-owned sessions:

- upcoming service sessions
- recordings
- RSVP'd community events
- small community schedule preview

Recommended CTA copy:

```txt
Browse the full community calendar
```

Target:

```txt
/community/events
```

## Avoid

- Do not show the same full `calendar_events` list on both pages.
- Do not rename community events to private sessions.
- Do not mix private service bookings into the public community calendar.

## Acceptance Criteria

- A user can understand the difference between Events and Sessions without explanation.
- Both routes cross-link where helpful.
- No existing route disappears.
- No existing data source is deleted.

