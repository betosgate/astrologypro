# Trainee Post-Training Appointment Booking Task Folder

This folder is the source of truth for implementing the post-training Tabbie appointment workflow for trainees.

If older notes, chat messages, or ad hoc assumptions conflict with this folder, follow this folder.

## Read In This Order

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
11. `99-implementation-checklist.md`

## Current Repo Anchors

Use these existing areas as the first implementation references:

1. `src/app/trainee/page.tsx`
2. `src/app/trainee/layout.tsx`
3. `src/lib/training/completion.ts`
4. `src/lib/training/graduation.ts`
5. `src/app/admin/dashboard-content/page.tsx`
6. `src/app/api/admin/dashboard-content/route.ts`
7. `src/lib/dashboard-content.ts`
8. `src/app/admin/users/[id]/page.tsx`
9. `src/app/admin/bookings/page.tsx`
10. `src/lib/public-booking.ts`
11. `src/lib/calendar/*`

## Key Rules

1. This is not a brand new calendar product; it must attach to the booking/calendar flow already present in the repo.
2. The trainee prompt appears only after training completion logic says the trainee is eligible.
3. Booking alone does not satisfy the requirement; only an actually completed appointment does.
4. Admin must control the dashboard block content and whether the feature is enabled.
5. Admin must be able to monitor status centrally and manually override when required.
6. All config changes and manual overrides must be audited.
7. Cancel and reschedule must preserve historical records.
8. Use the current App Router patterns in this repo, not old Next.js assumptions.

## Final Reminder

Do not implement this from memory.

Read the full task set first, then implement in the sequence described here.
