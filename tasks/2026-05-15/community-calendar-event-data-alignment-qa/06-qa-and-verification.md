# QA And Verification

## Required Commands

Run targeted lint for touched community/calendar files:

```bash
npx eslint src/app/community/events/page.tsx src/app/api/community/events/route.ts src/app/admin/calendar/page.tsx src/components/admin/calendar-event-form.tsx src/lib/calendar-events/constants.ts src/lib/calendar-events/display.ts src/lib/calendar-events/recurrence.ts
```

Run whitespace check:

```bash
git diff --check
```

Build can be run manually if the local machine can handle it:

```bash
npm run build
```

Note: If build crashes the IDE due to resource use, do not keep rerunning it from the agent. Use targeted lint and manual browser QA instead.

## Manual Browser QA

1. Admin creates one-time event.
2. Admin creates recurring event.
3. Community calendar shows both.
4. Category chips look correct.
5. Recurring occurrences appear as separate real events.
6. RSVP one-time event.
7. RSVP one recurring occurrence.
8. Confirm another occurrence from the same series has separate RSVP state.
9. Confirm My Registered Events updates.
10. Confirm Add to Calendar output uses correct event date/time.

## Acceptance Criteria

- `/community/events` reads real `calendar_events` rows.
- No fake recurring occurrences are generated client-side.
- Clean categories render correctly.
- Legacy categories fall back safely.
- RSVP works per occurrence.
- My Registered Events is accurate.
- Add to Calendar is accurate.
- No cron/session join/category CRUD work is added.

