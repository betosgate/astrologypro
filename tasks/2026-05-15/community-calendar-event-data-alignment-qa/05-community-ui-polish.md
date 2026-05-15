# Community UI Polish

## Goal

Make only small community UI fixes needed for data clarity.

Do not redesign the page.

## Allowed Fixes

- Label cleanup.
- Category fallback cleanup.
- Badge/chip color alignment.
- Empty state wording.
- My Registered Events category/status display.
- Selected-day card text if it exposes raw data.

## Not Allowed

- No new landing page.
- No session join button.
- No major layout rebuild.
- No admin form changes unless a community data bug requires it.
- No fake recurring event rendering.

## UI Language

Use user-friendly labels:

- `Ritual`
- `Sunday Service`
- `Live Class`
- `Meditation`
- `Other`
- `Going`
- `Maybe`
- `Can't Go`
- `Members Only`
- `Public`

Avoid exposing:

- `sunday_service`
- `live_class`
- `members_and_guests`
- `recurrence_series_id`
- `recurrence_parent_id`

## Acceptance Criteria

- Non-technical users can understand each event category and RSVP state.
- No raw database slugs appear in normal event cards.
- Visual style remains aligned with the current AstrologyPro community theme.

