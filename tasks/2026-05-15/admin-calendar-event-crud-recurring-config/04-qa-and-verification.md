# QA And Verification

## Required Commands

Run targeted lint:

```txt
npx eslint src/app/admin/calendar/page.tsx src/app/admin/calendar/new/page.tsx src/app/admin/calendar/[id]/edit/page.tsx src/app/api/admin/calendar/route.ts src/app/api/admin/calendar/[id]/route.ts
```

If shared files are added, include them too.

Do not rely on full repo typecheck as the only verification because this repo may contain unrelated existing errors.

## Chunk Verification Rule

This task must be implemented in small reviewable chunks.

After every chunk, the implementer should record:

- exact files changed
- what changed
- command run
- manual page checked
- whether behavior is complete or intentionally deferred

Do not proceed from API changes to UI changes until the API chunk has been verified.

Do not proceed from create form to edit form until create form behavior has been verified.

Do not proceed from recurring preview to recurring row generation until preview dates are confirmed correct.

## Manual QA

### Admin One-Time Event

1. Open `/admin/calendar/new`.
2. Create a one-time event with:
   - category `Ritual`
   - audience `Members`
   - valid start/end
3. Confirm save succeeds.
4. Confirm `/admin/calendar` shows the row.
5. Confirm `/community/events` shows it for an eligible member.
6. Confirm RSVP still works.

### Admin Recurring Event

1. Open `/admin/calendar/new`.
2. Create `Sunday Service`.
3. Enable recurring.
4. Select Sunday.
5. Set repeat until date 4-8 weeks later.
6. Confirm preview shows expected dates.
7. Save.
8. Confirm `/admin/calendar` shows multiple occurrence rows.
9. Confirm all occurrences share recurrence metadata.
10. Confirm `/community/events` shows occurrences in the correct months.

### Recurring Shortcuts

Verify:

- Weekend selects Saturday/Sunday.
- Weekdays selects Monday-Friday.
- Everyday selects all seven days.
- Quick selectors clear conflicting quick selectors.
- Turning recurring off hides recurring controls.

### Validation

Verify the form blocks:

- missing title
- missing category
- missing start
- missing end
- end before start
- recurring enabled with no days selected
- recurring enabled with range end before start
- recurring generating more than the allowed max

### Edit

Verify:

- edit one-time event
- edit generated occurrence
- category remains controlled
- end remains required
- invalid values are blocked

### Admin List

Verify:

- category badges render
- recurring badge renders
- filters still work
- preview modal still works
- edit links still work

## Non-Regression

Do not break:

- `/community/events`
- RSVP buttons
- Add to Calendar
- `/community/sessions`
- `/service` booking join flow
- admin layout/sidebar

## Final Developer Notes

When completing this task, report:

- files changed
- migration file added
- whether recurring occurrences are generated on save
- whether series-wide edit/delete was implemented or deferred
- where the future-cron comments were added
- lint/test commands run
- any known risks
