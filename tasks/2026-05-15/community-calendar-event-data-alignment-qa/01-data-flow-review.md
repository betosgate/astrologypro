# Data Flow Review

## Target Areas

Review these files first:

```txt
src/app/community/events/page.tsx
src/app/api/community/events/route.ts
src/app/api/community/events/[id]/rsvp/route.ts
src/app/api/community/events/[id]/ics/route.ts
```

If exact RSVP/ICS paths differ, locate them with:

```bash
rg "event_rsvps|calendar_events|ics|rsvp" src/app src/lib -n
```

## Expected Flow

```txt
Admin saves event
  -> calendar_events row exists
  -> /community/events fetches saved row
  -> user RSVPs against saved event id
  -> My Registered Events reads RSVP rows
  -> Add to Calendar uses saved row start/end
```

## What To Confirm

- Community event query filters active/visible events correctly.
- Community page does not synthesize unsaved recurring occurrences.
- Each event card uses the row's `id`.
- RSVP mutation sends the row's `id`.
- Add to Calendar uses the row's `start_at` / `end_at`.
- Time display is local/user-friendly.

## Red Flags

Fix only if found:

- Fake recurrence projection on the community page.
- Category chips using raw DB labels like `sunday_service`.
- RSVP using title/date matching instead of `event.id`.
- Add to Calendar using selected calendar day instead of event row timestamps.
- My Registered Events grouping multiple occurrences incorrectly.

