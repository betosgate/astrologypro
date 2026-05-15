# Admin Calendar Event CRUD + Recurring Config

Date: 2026-05-15

## Goal

Upgrade the admin calendar event management flow so admins can create clean community event data for `/community/events`, including recurring event configuration and visible repeated occurrences, without adding any cron/Lambda/background worker in this phase.

This task is the admin-side foundation for the community event calendar.

## Why This Comes Next

The community calendar UI is already polished enough for the current phase, but it depends on clean `calendar_events` data.

Current admin CRUD is too basic:

- category is free-text
- end time is optional in UI even though DB expects `end_at`
- no recurring setup
- no recurring occurrence generation
- list does not visually communicate category or recurring series

Legacy Divine Angular/Nest had a richer admin create form with:

- title
- start date / end date
- start time / end time
- category
- color code
- role
- quarter
- description
- recurring checkbox
- recurring day checkboxes
- weekend / weekdays / everyday shortcuts
- subscription available
- visible in frontend
- not available slot
- holiday event
- active

For AstrologyPro Phase 1, adopt the useful admin event pieces without copying the full legacy complexity.

## Product Decision

Implement recurring support as **manual occurrence generation on save**, not cron.

That means:

```txt
Admin creates a weekly Sunday Service from May 17 to July 26.
The save action immediately creates real calendar_events rows for each Sunday.
No cron, no AWS Lambda, no background worker.
```

This lets the client demo see recurring events on `/community/events` while avoiding ongoing cloud cost.

Cron/background automation remains a later launch-phase task for rolling generation, reminders, cleanup, and advanced recurrence management.

## Scope

### In Scope

- Upgrade `/admin/calendar/new`.
- Upgrade `/admin/calendar/[id]/edit`.
- Upgrade `/admin/calendar` list display.
- Harden `/api/admin/calendar`.
- Harden `/api/admin/calendar/[id]`.
- Add DB fields needed to group generated recurring occurrences.
- Add category dropdown.
- Make end date/time required.
- Add recurring checkbox.
- Add recurring day controls.
- Add `Weekend`, `Weekdays`, and `Everyday` shortcuts.
- Add occurrence preview in admin form.
- Generate concrete `calendar_events` rows on save for recurring events.
- Keep community calendar reading real `calendar_events` rows only.

### Out Of Scope

- No cron.
- No AWS Lambda.
- No scheduled worker.
- No reminder queue.
- No email notification automation.
- No event category CRUD table unless separately requested.
- No event join button from `/community/events`.
- No `/community/sessions` implementation.
- No user-facing fake/generated occurrences that are not saved in DB.
- No wholesale legacy port.

## Key User-Facing Behavior

Admin creates one-time event:

```txt
Create one calendar_events row.
Community calendar shows one event.
```

Admin creates recurring event:

```txt
Create multiple calendar_events rows immediately.
Each generated occurrence appears on /community/events.
Each occurrence can receive its own RSVP.
```

## Recommended Task Order

Work in small chunks. Do not attempt this as one large patch.

Each chunk should be independently reviewable and should include targeted verification before moving to the next chunk.

Recommended chunks:

1. Add DB migration for recurrence metadata only.
2. Define shared event category/audience constants only.
3. Add recurrence date calculation helpers and unit-level/manual verification.
4. Harden create API for one-time events first.
5. Add manual recurring occurrence generation to create API.
6. Harden update/delete API behavior for single events and recurring rows.
7. Extract shared admin event form component.
8. Upgrade `/admin/calendar/new`.
9. Upgrade `/admin/calendar/[id]/edit`.
10. Upgrade `/admin/calendar` badges/filters/actions.
11. QA admin + community calendar data behavior.

After each chunk, report:

- files changed
- behavior added
- verification command/manual check
- known risk or deferred edge case

## Important Implementation Rule

Do not show recurring occurrences on `/community/events` unless they are real `calendar_events` rows.

Reason:

- RSVP needs a stable `event_id`.
- Add to Calendar needs a real event date/time.
- Future sessions/recordings need stable event/occurrence identity.

## Future Cron Comment Requirement

Wherever temporary/manual recurring occurrence generation is implemented, add a short code comment for future developers explaining that this logic is the launch-demo/manual substitute for the later cron/worker.

The comment should identify:

- what the temporary code does now
- where cron/worker logic should eventually take over
- why no cron is used in this phase

Example wording:

```ts
// Phase 1: generate recurrence occurrences synchronously on admin save so the
// demo can show real community calendar rows without running a paid cron/Lambda.
// Before launch, move rolling recurrence generation/cleanup/reminders into the
// calendar event cron worker and keep this path idempotent.
```
