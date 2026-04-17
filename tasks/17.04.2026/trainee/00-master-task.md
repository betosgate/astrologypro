# Trainee Post-Training Appointment Booking Master Task

- Status: Ready For Implementation
- Date: 2026-04-17
- Category: Trainee Dashboard / Booking Lifecycle
- Owner: Full-stack
- Priority: P0
- Task File: `tasks/17.04.2026/trainee/00-master-task.md`

## Purpose

Build the full post-training workflow that guides eligible trainees into booking a required appointment with Tabbie, tracks the appointment lifecycle inside AstrologyPro, and exposes both configuration and monitoring tools to Admin.

## Why This Task Exists

Training completion is currently the end of the trainee flow. The business now requires a mandatory next step:

1. once training is complete, trainees must see a clear dashboard prompt
2. the prompt must send them into the existing booking/calendar flow
3. the system must track booked, cancelled, rescheduled, and completed states
4. Admin must be able to configure the prompt and monitor progress centrally
5. completion must be visible and auditable

## Existing Repo Reality

This repo already contains relevant building blocks:

1. trainee dashboard route in `src/app/trainee/page.tsx`
2. trainee layout and nav in `src/app/trainee/layout.tsx`
3. training completion helpers in `src/lib/training/completion.ts`
4. graduation logic in `src/lib/training/graduation.ts`
5. admin-configurable dashboard content patterns in `src/lib/dashboard-content.ts`
6. admin dashboard content UI in `src/app/admin/dashboard-content/page.tsx`
7. admin user detail page in `src/app/admin/users/[id]/page.tsx`
8. booking and calendar areas in `src/app/admin/bookings/page.tsx`, `src/lib/public-booking.ts`, and `src/lib/calendar/*`

The implementation must reuse these patterns where appropriate rather than inventing an unrelated subsystem.

## Scope

This task set covers:

1. eligibility logic after training completion
2. admin-managed trainee dashboard callout content
3. trainee CTA into existing booking flow
4. internal appointment summary fields and lifecycle storage
5. webhook or sync-based updates from external booking state
6. cancel and reschedule handling with preserved history
7. completion flag handling
8. admin visibility, filtering, and manual override capability
9. audit logging for config changes and overrides
10. QA, seeds, rollout notes, and edge-case handling

This task set does not cover:

1. building a brand new booking engine
2. building a new video meeting platform
3. replacing the current external booking technology
4. redesigning unrelated trainee dashboard modules

## Desired Outcome

After implementation:

1. an eligible trainee sees a distinct Tabbie appointment card on `/trainee`
2. the card content and CTA are admin-configurable
3. the CTA opens the existing booking flow correctly
4. the system stores the current appointment status and history
5. cancelled trainees are prompted to rebook
6. rescheduled trainees see the newest time while old data remains in history
7. completed appointments set a durable completion flag
8. admin can inspect the trainee detail, filter lists, and override status if needed
9. all sensitive changes are audited

## Execution Order

1. `01-product-decisions-and-existing-system-map.md`
2. `02-data-model-and-migrations.md`
3. `03-backend-eligibility-and-trainee-apis.md`
4. `04-backend-booking-sync-webhooks-and-lifecycle.md`
5. `05-admin-config-module-and-audit.md`
6. `06-admin-monitoring-reporting-and-manual-override.md`
7. `07-trainee-dashboard-ui-and-state-rendering.md`
8. `08-cancel-reschedule-completion-and-edge-cases.md`
9. `09-testing-seeding-rollout-and-qa.md`
10. `99-implementation-checklist.md`

## Non-Negotiable Constraints

1. Do not show the booking block before training completion.
2. Do not treat `booked` as equivalent to `completed`.
3. Do not lose prior appointment records on cancel or reschedule.
4. Do not make admin content hardcoded in frontend source.
5. Do not mark completion without an authoritative source or explicit audited admin override.
6. Do not bypass audit logging for config edits or manual status changes.
7. Do not invent old Next.js route or data-loading patterns that do not match this App Router repo.

## Required Business Decisions Already Resolved Here

Use these defaults unless a later product decision explicitly changes them:

1. eligibility is based on the existing training completion logic
2. cancelled trainees remain required to book again
3. rescheduled appointments remain incomplete until the event is actually completed
4. only one active Tabbie appointment should be considered current
5. manual admin completion is allowed, but only with mandatory reason logging
6. when completed, the dashboard prompt should default to a success state rather than disappearing silently

## Definition Of Done

The task is complete only if:

1. trainees can see the correct state on the dashboard
2. admin can configure the block without code changes
3. internal status fields are durable and queryable
4. external booking changes sync back into the app
5. completion is visible on admin surfaces
6. history and audit logs are preserved
7. the task pack is detailed enough that an AI can execute it one file at a time without needing product clarification
