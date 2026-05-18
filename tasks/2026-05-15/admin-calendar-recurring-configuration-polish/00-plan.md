# Admin Calendar Recurring Configuration Polish

Date: 2026-05-15

## Goal

Polish the Phase 1 admin recurring event implementation so it is clear, demo-ready, and future-ready for cron automation, while keeping cron/Lambda disabled.

Phase 1 already added:

- clean admin event CRUD fields
- category/audience dropdowns
- required start/end
- visible timezone
- recurrence metadata migration
- manual recurring occurrence creation on admin save
- community calendar reading real `calendar_events` rows

Phase 2 should make that behavior easier for admins, reviewers, and future developers to understand.

## Product Decision

Keep the current no-cron approach.

In this phase, recurring event occurrences are still created synchronously when the admin saves the form. This is intentional for demo purposes because it creates real `calendar_events` rows that can support:

- community calendar display
- RSVP against stable event IDs
- Add to Calendar accuracy
- future session/recording links

Do not replace this with fake client-side occurrences.

Do not add cron, Lambda, queue, background worker, or scheduled automation in this task.

## Main Outcome

After this task, an admin should understand:

- whether an event is one-time or recurring
- whether a recurring event is the parent/template occurrence or a generated occurrence
- which occurrence number they are editing
- that automation/cron is pending before launch
- that current occurrences were generated manually on save

## Scope

### In Scope

- Add clearer recurring indicators in `/admin/calendar`.
- Add an `Automation Pending` badge where appropriate.
- Show recurrence metadata on edit page for recurring occurrences.
- Improve create-page occurrence preview copy and layout.
- Make delete/edit behavior less confusing for recurring occurrences.
- Add safe UX copy for “edit this occurrence only”.
- Keep API comments aligned with future cron responsibility.
- Verify `/community/events` still reads real saved rows.

### Out Of Scope

- No cron.
- No AWS Lambda.
- No background worker.
- No event category CRUD.
- No session join wiring.
- No `/community/sessions` wiring.
- No RSVP redesign.
- No whole-series edit implementation unless explicitly requested later.
- No fake community occurrences generated only in React.

## Recommended Task Order

Work in small chunks. Do not attempt this as one large patch.

Each chunk should be independently reviewable and should include targeted verification before moving to the next chunk.

Recommended chunks:

1. Review current Phase 1 files and confirm migration is applied locally.
2. Add reusable helpers/labels for recurring event display metadata.
3. Improve `/admin/calendar` recurring badges and table/list clarity.
4. Improve `/admin/calendar/[id]/edit` recurring occurrence context.
5. Improve `/admin/calendar/new` recurrence preview and automation copy.
6. Harden delete UX for recurring occurrences.
7. Confirm community calendar still uses real saved events only.
8. Run targeted lint/build checks.

After each chunk, report:

- files changed
- behavior added
- verification command/manual check
- known risk or deferred edge case

## Important Rule

Do not remove Phase 1 manual occurrence generation.

Current behavior is:

```txt
Admin saves recurring rule.
System creates real calendar_events rows immediately.
Cron automation remains pending.
```

That is the desired demo-ready state until launch automation is approved.

## Future Cron Comment Requirement

Any UI/API copy or code comments around recurrence should make the future boundary clear:

```txt
Automation pending: occurrences are generated on admin save in this phase. Before launch, cron/worker should handle rolling generation, cleanup, reminders, and long-range maintenance.
```

