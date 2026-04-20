# Task 04 - Backend Booking Sync, Webhooks, And Lifecycle

- Status: Planned
- Owner: Backend
- Depends On: `03-backend-eligibility-and-trainee-apis.md`

## Purpose

Capture booking lifecycle changes from the existing booking/calendar system and map them into internal appointment records plus trainee summary flags.

## Lifecycle Rules

### Booking created

When the external provider confirms a booking:

1. create or update the current appointment row
2. set trainee summary status to `booked`
3. point `current_tabbie_appointment_id` to the active record
4. write a history event with `action_type = created`

### Booking cancelled

When a booking is cancelled:

1. update current appointment status to `cancelled`
2. set `cancelled_at`
3. keep the record for history
4. update trainee summary status to `cancelled`
5. keep `tabbie_appointment_completed = false`

### Booking rescheduled

Recommended behavior:

1. preserve the prior appointment row
2. create a new active row or update the current row plus history entry
3. store linkage via `rescheduled_from_appointment_id`
4. write `action_type = rescheduled`
5. final trainee summary status should land on `booked`

### Booking completed

When the event is confirmed complete:

1. set appointment status to `completed`
2. set `completed_at`
3. set trainee summary:
   - `tabbie_appointment_status = completed`
   - `tabbie_appointment_completed = true`
   - `tabbie_appointment_completed_at = now`
4. write `action_type = completed`

### No-show

When external provider sends no-show:

1. set current appointment status to `no_show`
2. do not set completion flag
3. keep requirement active unless product later changes this rule

## Sync Entry Points

Preferred:

1. webhook route from booking provider

Fallback:

1. scheduled sync job querying provider state

Implement both if webhook coverage is incomplete.

## Suggested Routes

1. `POST /api/bookings/tabbie/webhook`
2. `POST /api/admin/tabbie-appointments/sync` for manual admin sync
3. optional background job entry if the repo already supports cron handlers

## Webhook Handler Responsibilities

1. verify authenticity
2. validate payload shape
3. map payload to trainee by internal ID, email, or metadata
4. map external status to internal status
5. upsert appointment row
6. update trainee summary fields
7. write history row
8. log failures without corrupting current state

## Status Mapping Table

Define an explicit mapping module, for example:

1. `provider_booked -> booked`
2. `provider_cancelled -> cancelled`
3. `provider_rescheduled -> booked` plus history `rescheduled`
4. `provider_completed -> completed`
5. `provider_no_show -> no_show`

Never scatter this mapping inline across several routes.

## Current-State Resolution Rule

Only one active appointment should be considered current for dashboard rendering.

Recommended active statuses:

1. `booking_in_progress`
2. `booked`
3. `manually_completed`
4. `manually_cancelled`

Inactive/historical statuses:

1. `cancelled`
2. `rescheduled`
3. `completed`
4. `no_show`
5. `failed`

If multiple active records somehow exist, choose the newest authoritative appointment and log an admin warning.

## Deliverables

1. webhook route or provider callback route
2. sync service module
3. provider-to-internal status mapper
4. history writer helpers
5. admin/manual sync trigger if needed
