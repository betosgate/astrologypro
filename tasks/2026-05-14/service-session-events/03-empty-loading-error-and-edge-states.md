# Empty, Loading, Error, And Edge States

## Objective

Make the first implementation feel professional and robust for real users.

## Required States For `/community/sessions`

No upcoming sessions:

- Clear message
- CTA to `/services`
- Optional CTA to `/community/events`

No recordings:

- Clear message that completed readings and recordings will appear here.

Recording not ready:

- Show completed session row/card.
- Disable Watch action.
- Label as processing/unavailable.

Join not available:

- Show scheduled session.
- If join link cannot be built, show Manage link if available.
- Do not expose broken hrefs.

No RSVP'd events:

- Keep section compact.
- CTA to `/community/events`.

Query failure:

- Do not crash the entire portal if one optional section fails.
- Prefer scoped fallback where possible.

## Required States For `/community/events`

- Existing no-event state remains.
- RSVP failures should not break calendar rendering.
- Calendar should still render if RSVP fetch fails.

## Acceptance Criteria

- Text is clear and concise.
- No blank cards.
- No buttons with invalid links.
- No layout shift from missing dynamic content.
- Mobile layout remains usable.

