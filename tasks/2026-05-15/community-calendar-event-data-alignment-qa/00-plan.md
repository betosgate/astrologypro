# Community Calendar Event Data Alignment QA

Date: 2026-05-15

## Goal

Verify and polish the community calendar so it cleanly consumes the admin-created `calendar_events` data from Phase 1 and Phase 2.

This phase should confirm that community users see predictable categories, accurate event times, stable RSVP behavior, and Add to Calendar output based on real saved event rows.

## Why This Comes Next

Admin event creation is now production-shaped enough for the demo:

- clean category dropdown
- clean audience dropdown
- required start/end
- timezone support
- recurring setup
- manual occurrence generation on save
- recurring metadata and admin badges

Now the community-facing calendar needs a final data alignment pass.

## Product Decision

Community calendar must read real `calendar_events` rows only.

Do not generate fake recurring occurrences in the community UI.

Do not introduce cron, Lambda, session join, or `/community/sessions` wiring in this phase.

## Scope

### In Scope

- Verify `/community/events` reads admin-created rows correctly.
- Confirm clean category labels and colors.
- Confirm old/legacy categories fall back safely.
- Confirm recurring generated occurrences display as normal real events.
- Confirm RSVP targets the correct event ID per occurrence.
- Confirm My Registered Events shows RSVP'd occurrences correctly.
- Confirm Add to Calendar uses real occurrence start/end values.
- Make small alignment fixes if QA finds mismatches.

### Out Of Scope

- No cron.
- No AWS Lambda.
- No session join from calendar.
- No `/community/sessions` implementation.
- No event category CRUD.
- No admin CRUD changes unless required by a community data bug.
- No RSVP redesign.
- No major UI redesign.

## Main Outcome

After this phase:

- Admin-created events appear correctly in `/community/events`.
- Recurring occurrences behave like independent real events.
- RSVP works per occurrence.
- Category chips are understandable to non-technical users.
- Add to Calendar remains accurate.

## Recommended Task Order

Work in small chunks. Do not attempt this as one large patch.

Each chunk should be independently reviewable and should include targeted verification before moving to the next chunk.

Recommended chunks:

1. Review current community events page/API data flow.
2. Document category mapping and legacy fallback behavior.
3. Verify one-time admin event display.
4. Verify recurring generated occurrence display.
5. Verify RSVP per event ID.
6. Verify My Registered Events.
7. Verify Add to Calendar output.
8. Make small alignment fixes only where needed.
9. Run targeted lint/build checks.

After each chunk, report:

- files checked/changed
- behavior verified
- any issue found
- whether a code change was needed

## Important Rules

Do not fake recurring events on community pages.

Reason:

- RSVP needs a stable `event_id`.
- Add to Calendar needs actual saved `start_at` and `end_at`.
- Future recordings/session links need stable occurrence identity.

Do not add session join buttons in this phase.

Reason:

- Current product direction says join flow is not from the calendar yet.
- Session/recording wiring is a later task.

