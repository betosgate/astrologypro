# Connect RSVP'd Events To Sessions

## Objective

Add a small related-events section to `/community/sessions` showing community events the member RSVP'd to.

## Source

- `event_rsvps`
- `calendar_events`

## Section Name

Recommended:

```txt
Community Events You're Attending
```

## Behavior

Show upcoming events where:

- `event_rsvps.user_id = auth.uid()`
- `rsvp_status IN ('going', 'maybe')`
- `calendar_events.start_at >= now`
- `calendar_events.is_active = true`

Display:

- event title
- date/time
- category
- RSVP status
- link to `/community/events`

## Important

This section should not replace `/community/events`. It is a convenience bridge so members understand how sessions and events relate.

## Acceptance Criteria

- RSVP'd events are visible from `/community/sessions`.
- Events still remain managed by `/community/events`.
- If there are no RSVP'd events, the section stays small or hidden with a clean CTA.
- No notification behavior is added in this task.

