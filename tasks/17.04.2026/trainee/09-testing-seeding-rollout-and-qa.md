# Task 09 - Testing, Seeding, Rollout, And QA

- Status: Planned
- Owner: Full-stack
- Depends On: all prior tasks

## Purpose

Make the feature verifiable end to end instead of stopping at implementation.

## Test Layers

### Unit / service tests

Cover:

1. eligibility calculation
2. status mapping from external provider values
3. current-appointment resolution
4. completion flag behavior
5. config validation

### Route / API tests

Cover:

1. trainee status endpoint
2. admin config update endpoint
3. webhook validation and mapping
4. admin override endpoint

### UI tests

Cover:

1. trainee sees no block before training completion
2. trainee sees eligible card after completion
3. booked state shows correct date/time
4. cancelled state re-prompts booking
5. completed state shows success
6. admin config edits appear on trainee dashboard

## Seed / QA Data

Recommended additions:

1. one trainee eligible but not booked
2. one trainee booked
3. one trainee cancelled
4. one trainee completed
5. one trainee with sync issue or no-show

If existing seeding infrastructure exists, extend it rather than creating a manual-only setup.

## Manual QA Checklist

1. complete training for a test trainee and confirm block visibility
2. click CTA and verify booking flow opens correctly
3. simulate booked webhook and verify dashboard/admin update
4. simulate cancelled webhook and verify rebook prompt returns
5. simulate reschedule and confirm history preserves prior slot
6. simulate completed webhook and verify completion flag
7. manually override status in admin and verify audit rows
8. disable the feature in admin and confirm dashboard block disappears
9. break booking config intentionally and confirm graceful failure

## Rollout Notes

1. Feature should be gated by admin enablement.
2. Keep webhook/sync disabled in production until mapping is verified.
3. Add temporary logging during rollout for payload troubleshooting.
4. Confirm exact provider status names before production enablement.

## Deliverables

1. automated tests where current repo patterns allow
2. seed updates or QA instructions
3. rollout notes for env/config dependencies
4. manual QA sign-off checklist
