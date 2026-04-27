# Task 05 - Integrate Generation Triggers

- Status: Planned
- Priority: P1
- Area: Perennial / Community / Monthly Transit Orchestration

---

## Goal

Wire current-month summary generation into the right lifecycle events without duplicating generation logic.

## Required Trigger Design

Use a single reusable service as the implementation center, then call it from multiple entry points.

## Trigger 1 - Monthly Cron

The existing cron should continue to run on the 1st of every month.

Update goal:

- use the shared ensure-generation service
- keep skip behavior for valid current-month rows
- keep retry behavior for failed rows

## Trigger 2 - Subscription Activation

When a user's Perennial membership becomes active:

- call current-month catch-up generation
- generate rows only for eligible family members with generated natal charts
- do not block the checkout/subscription success UX longer than necessary

If generation can take too long, enqueue/background it and show a generating state.

## Trigger 3 - Natal Chart Completion

When a self or added family member natal chart is successfully generated:

- check active Perennial membership
- check current month
- generate the monthly summary for that family member if missing

This covers users who add family members mid-month.

## Trigger 4 - Lazy Fallback On Page Visit

When an active Perennial member visits `/community/transits`:

- if eligible family members exist but current-month rows are missing, start ensure-generation
- render a "preparing" state instead of a dead empty state

This is a safety net, not the primary orchestration path.

## Trigger 5 - Admin/Support Retry

Admin should be able to retry failed current-month rows.

This can be a future admin action, but the service should return enough detail to support it.

## Acceptance Criteria

- [ ] Cron uses or matches the shared generation service behavior.
- [ ] Subscription activation can trigger current-month catch-up.
- [ ] Natal chart completion can trigger current-month summary generation.
- [ ] `/community/transits` can safely lazy-trigger missing summary generation.
- [ ] Duplicate generation is avoided through row locking/upsert semantics.
- [ ] User experience does not require waiting until the next month.
