# Task 08 - Cancel, Reschedule, Completion, And Edge Cases

- Status: Planned
- Owner: Full-stack
- Depends On: `04-backend-booking-sync-webhooks-and-lifecycle.md`, `07-trainee-dashboard-ui-and-state-rendering.md`

## Purpose

Close the behavioral gaps around state changes that usually break lifecycle features after the happy path works.

## Cancellation Rules

1. cancellation must update current internal status to `cancelled`
2. prior booking details must remain queryable
3. trainee remains required to complete the appointment
4. dashboard should re-enter a prompt-to-book state
5. admin should be able to see cancellation history

## Reschedule Rules

1. reschedule does not satisfy completion
2. the old appointment datetime must remain preserved
3. the newest active schedule should be shown on the trainee dashboard
4. the admin timeline should clearly show old and new datetimes

## Completion Rules

1. completed means event actually finished
2. booked is not completed
3. no-show is not completed
4. manual completion requires mandatory reason text

## Sync Failure Rules

If provider sync fails:

1. preserve last known good state
2. show admin-visible sync issue
3. do not guess completion

## Training Reset Rule

If admin later resets training status:

Recommended default behavior:

1. set `tabbie_appointment_required = false`
2. hide the trainee booking prompt
3. preserve historical appointment records
4. do not delete completed history

If business later wants a stricter rule, change this intentionally rather than implicitly.

## Multiple Booking Rule

Recommended default:

1. only one active appointment counts as current
2. if external system creates duplicates, keep all rows but choose the newest active one for current summary
3. flag duplicates for admin review

## Missing Config Rule

If training is complete but admin config is invalid:

1. do not show a broken CTA
2. either suppress the block or show a controlled fallback message
3. log the issue in a way admins can investigate

## Deliverables

1. edge-case handling in lifecycle services
2. dashboard state behavior for cancelled/completed/error states
3. admin-visible sync problem indicators
4. explicit product comments in code where business defaults were chosen
