# Trainee Post-Training Appointment Booking Implementation Checklist

- Status: Planned
- Date: 2026-04-17
- Category: Trainee Appointment Workflow
- Owner: Full-stack
- Priority: P0
- Task File: `tasks/17.04.2026/trainee/99-implementation-checklist.md`

## Purpose

This file converts the full task pack into an execution sequence so an AI coding agent can implement the feature step by step with minimal ambiguity.

Read this file after reading:

1. `00-master-task.md`
2. `01-product-decisions-and-existing-system-map.md`
3. `02-data-model-and-migrations.md`
4. `03-backend-eligibility-and-trainee-apis.md`
5. `04-backend-booking-sync-webhooks-and-lifecycle.md`
6. `05-admin-config-module-and-audit.md`
7. `06-admin-monitoring-reporting-and-manual-override.md`
8. `07-trainee-dashboard-ui-and-state-rendering.md`
9. `08-cancel-reschedule-completion-and-edge-cases.md`
10. `09-testing-seeding-rollout-and-qa.md`

## Non-Negotiable Summary

Lock these rules before coding:

1. This feature begins only after training completion.
2. Booking is not the same as completion.
3. The trainee dashboard block must be admin-configurable.
4. The system must integrate with the existing booking flow rather than replacing it.
5. Cancellation keeps the requirement open.
6. Rescheduling keeps the requirement open until actual completion.
7. Manual admin overrides are allowed only with audit logging.
8. Full history must be preserved.
9. The trainee experience and admin monitoring experience are both required deliverables.

## Recommended Build Order

### Step 1: Inspect current code before editing

1. Read `src/app/trainee/page.tsx`.
2. Read `src/app/trainee/layout.tsx`.
3. Read `src/lib/training/completion.ts`.
4. Read `src/lib/training/graduation.ts`.
5. Read `src/app/admin/dashboard-content/page.tsx`.
6. Read `src/lib/dashboard-content.ts`.
7. Read booking/calendar integration code in `src/lib/public-booking.ts` and `src/lib/calendar/*`.
8. Read the relevant App Router docs in `node_modules/next/dist/docs/01-app/`.

### Step 2: Add data model support

1. Create migration(s) for trainee summary fields.
2. Create appointment table.
3. Create history table.
4. Create admin config table.
5. Add indexes and FKs.
6. Seed or bootstrap the default config row.

### Step 3: Add shared backend service logic

1. Create a shared Tabbie appointment service module.
2. Centralize status constants.
3. Centralize eligibility calculation.
4. Centralize current appointment resolution.
5. Centralize history writes.

### Step 4: Add trainee-facing backend APIs

1. Add trainee status endpoint.
2. Add optional launch/bootstrap endpoint if redirect control is needed.
3. Ensure ineligible trainees cannot get active booking launch payloads.

### Step 5: Add booking sync/webhook lifecycle

1. Add webhook route.
2. Add payload validation.
3. Add provider-to-internal status mapper.
4. Upsert appointment records from external events.
5. Update trainee summary fields from authoritative external state.

### Step 6: Add admin config UI and API

1. Add config fetch/update route.
2. Add dedicated admin page.
3. Add validation and friendly form errors.
4. Audit every config change.

### Step 7: Add admin monitoring and override tools

1. Add appointment monitoring list page.
2. Add trainee detail section.
3. Add history timeline.
4. Add manual override action flow with required reason.
5. Audit every override.

### Step 8: Add trainee dashboard UI

1. Build appointment card component.
2. Integrate into `src/app/trainee/page.tsx`.
3. Render eligible, booked, cancelled, and completed states.
4. Format date/time and timezone clearly.
5. Handle missing-config and sync-error states gracefully.

### Step 9: Handle edge cases

1. Training reset after eligibility.
2. Duplicate active bookings.
3. Reschedule with new external booking ID.
4. Completion webhook missed.
5. No-show.
6. Invalid or unavailable booking link.

### Step 10: Verify end to end

1. Add automated tests where practical.
2. Add or update seed data.
3. Run manual webhook/state simulations.
4. Validate both trainee and admin flows.

## Acceptance Checklist

- [ ] Ineligible trainees do not see the card.
- [ ] Eligible trainees see the card when the feature is enabled.
- [ ] Admin can change title, body, and button label without code deployment.
- [ ] Clicking CTA opens the intended booking flow.
- [ ] Successful booking updates current status to `booked`.
- [ ] Cancellation updates status to `cancelled` and prompts rebooking.
- [ ] Reschedule preserves history and shows newest booking time.
- [ ] Completed appointment sets durable completion flag.
- [ ] Admin can see status and completion details centrally.
- [ ] Admin overrides and config changes are audited.
- [ ] The implementation follows current App Router conventions in this repo.

## Definition Of Done

The task is done only if:

1. backend state, webhook/sync handling, admin config, admin monitoring, and trainee UI are all implemented
2. the feature is usable without manual DB surgery
3. status transitions are durable and queryable
4. auditability is preserved
5. the system can be handed to another AI or developer using only this task folder
