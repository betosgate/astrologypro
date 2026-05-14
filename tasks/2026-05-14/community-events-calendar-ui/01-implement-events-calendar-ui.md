# Implement Events Calendar UI

## Objective

Update `/community/events` to match the approved visual direction while preserving existing data behavior.

## Primary File

```txt
src/app/community/events/page.tsx
```

## UI Requirements

- Add toolbar above the calendar:
  - search input
  - filter chips: `All`, `Ritual`, `Ceremony`, `Live Class`, `Meditation`, `My RSVPs`
- Keep month navigation:
  - previous month icon button
  - centered month/year label
  - next month icon button
- Improve calendar grid:
  - stable cell sizing
  - clearer today state
  - clearer selected date state
  - event pills or grouped dots inside days
  - overflow indicator for busy days
- Replace the simple `Next 5 Events` sidebar with an agenda panel:
  - selected day title when a day is selected
  - otherwise upcoming events
  - polished event cards
- Event cards should show:
  - title
  - category badge
  - date/time
  - audience/status context where available
  - RSVP controls using `EventRsvpButton`
  - Add to Calendar action if feasible in this phase
- Add a small `My Registered Events` or `My RSVPs` section only if it does not duplicate the main panel.

## Behavior Requirements

- Day click filters agenda panel to that date.
- Filter chips filter visible calendar event markers and agenda items.
- `My RSVPs` should use available RSVP state already loaded by the page.
- Search should filter by title/category/description client-side.
- RSVP behavior must continue to work.
- Calendar should not show a `Join Session` action.
- Calendar should not route users to `/community/sessions` unless a secondary cross-link is clearly helpful.

## Theme Requirements

Use the existing AstrologyPro dark theme:

- background: existing app background
- panel/card surfaces: existing `card`/`muted` tokens
- primary gold through existing `primary`
- subtle category accents only
- 8px-ish radius consistent with existing components
- no hero treatment
- no decorative orbs

## Acceptance Criteria

- `/community/events` is visually aligned with the approved mockup direction.
- Existing RSVP buttons still work.
- Empty state remains clear.
- Month navigation still works.
- Mobile layout remains usable.
- No session join behavior is introduced.

