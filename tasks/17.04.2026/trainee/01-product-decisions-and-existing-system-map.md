# Task 01 - Product Decisions And Existing System Map

- Status: Planned
- Owner: Full-stack
- Depends On: `00-master-task.md`

## Purpose

Lock the product model and map the existing repo surfaces before code changes begin.

## Existing System References To Read First

1. `src/app/trainee/page.tsx`
2. `src/app/trainee/layout.tsx`
3. `src/lib/training/completion.ts`
4. `src/lib/training/graduation.ts`
5. `src/app/admin/dashboard-content/page.tsx`
6. `src/lib/dashboard-content.ts`
7. `src/app/admin/bookings/page.tsx`
8. `src/app/admin/users/[id]/page.tsx`
9. `src/lib/public-booking.ts`
10. `src/lib/calendar/connections.ts`

## Product Defaults To Use

1. `training completed` comes from existing training completion and trainee/graduation state, not from new ad hoc flags.
2. Eligible trainees should see the appointment block above secondary dashboard widgets.
3. The card should support four core visual states:
   - `eligible_to_book`
   - `booked`
   - `cancelled_needs_rebook`
   - `completed`
4. The CTA should open the existing booking flow, ideally with trainee context if current integration supports it.
5. The system should keep one current active appointment pointer plus full historical records.
6. If training is later reset by admin, the trainee should become ineligible again unless product explicitly decides otherwise.

## Recommended Internal Status Enum

Use one canonical status contract across backend and frontend:

1. `not_required`
2. `eligible_to_book`
3. `booking_in_progress`
4. `booked`
5. `cancelled`
6. `rescheduled`
7. `completed`
8. `no_show`
9. `failed`
10. `manually_completed`
11. `manually_cancelled`

Notes:

1. `rescheduled` should normally exist in history while the current record returns to `booked`.
2. `completed` is the normal final state from external sync.
3. `manually_completed` and `manually_cancelled` are valid current states only when admin explicitly forces them.

## Mapping To Existing Repo Areas

Use the current repo structure instead of inventing a new vertical slice:

1. Trainee UI:
   - `src/app/trainee/page.tsx`
   - likely a new component under `src/components/trainee/` or `src/components/dashboard/`
2. Eligibility logic:
   - `src/lib/training/*`
   - likely a new helper such as `src/lib/trainee-tabbie-appointments.ts`
3. Admin config:
   - mirror the patterns used by `src/lib/dashboard-content.ts`
   - add a focused config module rather than forcing this into generic content items
4. Admin APIs:
   - `src/app/api/admin/*`
   - likely new `tabbie-appointment-config`, `tabbie-appointments`, and `tabbie-appointment-overrides` endpoints
5. Trainee APIs:
   - `src/app/api/trainee/*`
   - likely new status/eligibility endpoints if the dashboard should not inline all logic
6. Sync/webhook:
   - `src/app/api/*`
   - likely a new webhook route or provider-specific callback route

## Decisions The Implementing AI Should Not Re-open

1. This feature needs both backend and frontend work.
2. This is not only a dashboard card; it includes lifecycle storage and admin visibility.
3. This is not only an admin config task; trainee status rendering and booking sync are required.
4. Audit logging is mandatory, not optional polish.

## Deliverables From This Step

1. Confirm actual source of training completion in the repo.
2. Confirm current booking provider entry point and callback capabilities.
3. Confirm which admin log table is already used for audited changes.
4. Document any unavoidable gap where the external provider cannot send completion state directly.
