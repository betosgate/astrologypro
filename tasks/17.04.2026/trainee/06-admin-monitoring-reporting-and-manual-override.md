# Task 06 - Admin Monitoring, Reporting, And Manual Override

- Status: Planned
- Owner: Full-stack
- Depends On: `04-backend-booking-sync-webhooks-and-lifecycle.md`, `05-admin-config-module-and-audit.md`

## Purpose

Expose appointment status visibility to Admin at both the trainee-detail level and list/report level.

## Trainee Detail Requirements

Enhance the admin user detail flow to show:

1. training status
2. appointment required flag
3. current appointment status
4. current appointment date/time
5. completion flag
6. completion timestamp
7. sync status
8. history timeline
9. manual override controls

Likely target:

1. `src/app/admin/users/[id]/page.tsx`
2. corresponding client component used by that page

## Admin List / Reporting Requirements

Admin should be able to filter trainees by:

1. eligible not booked
2. booked
3. cancelled
4. rescheduled
5. completed
6. no_show
7. manual override
8. date range

Recommended implementation options:

1. add a dedicated page such as `src/app/admin/trainee-tabbie-appointments/page.tsx`
2. optionally extend existing admin reports after the dedicated view exists

Recommended first:

1. build a dedicated admin monitoring page with table filters
2. optionally add aggregate report cards later

## Manual Override Actions

Admin may:

1. mark completed
2. reset completed flag
3. mark cancelled
4. retry sync

Every override must require:

1. reason text
2. admin auth check
3. history row
4. `admin_activity_log` entry

## Recommended APIs

1. `GET /api/admin/tabbie-appointments`
2. `GET /api/admin/tabbie-appointments/[traineeId]`
3. `POST /api/admin/tabbie-appointments/[traineeId]/override`
4. `POST /api/admin/tabbie-appointments/[traineeId]/sync`

## UI Notes

1. Reuse existing admin table and card styles from the app.
2. Show status badges similar to other admin booking screens.
3. Make completion visually clear but keep the raw status/history accessible.

## Deliverables

1. admin detail enhancements
2. admin monitoring list page
3. override API and modal/form
4. history timeline rendering
5. filters and pagination
