# QA And Verification

## Required Commands

Run targeted lint for touched calendar files:

```bash
npx eslint src/app/admin/calendar/page.tsx src/app/admin/calendar/new/page.tsx src/app/admin/calendar/[id]/edit/page.tsx src/app/api/admin/calendar/route.ts src/app/api/admin/calendar/[id]/route.ts src/components/admin/calendar-event-form.tsx src/lib/calendar-events/constants.ts src/lib/calendar-events/recurrence.ts src/app/community/events/page.tsx src/lib/db/migrations.ts src/data/migrations/20260515000001_calendar_events_recurrence.ts
```

Run whitespace check:

```bash
git diff --check
```

If practical, run build:

```bash
npm run build
```

Full `tsc --noEmit` currently has unrelated project errors. Do not treat those as Phase 2 blockers unless new calendar files appear in the error list.

## Manual QA

1. Create one-time event.
2. Confirm admin list shows no recurring badge.
3. Confirm `/community/events` shows the event.
4. Create recurring event:
   - timezone selected
   - Monday/Wednesday/Friday selected
   - valid range end
5. Confirm preview count looks correct.
6. Save event.
7. Confirm admin list shows recurring badges and occurrence numbers.
8. Confirm `/community/events` shows generated occurrences.
9. Edit one generated occurrence.
10. Confirm edit page says this edits only this occurrence.
11. Save the occurrence edit.
12. Confirm only that occurrence changed.
13. Try a repeat range that exceeds 120 occurrences.
14. Confirm save is blocked with a clear error.

## Acceptance Criteria

- Admin can understand recurring status from the list.
- Admin can understand recurring context on edit.
- Create preview clearly says automation is pending.
- No cron/Lambda/background worker is added.
- Community events still come from saved `calendar_events` rows.
- Targeted lint passes.
- `git diff --check` passes.
- Build passes or any failure is documented as unrelated.

