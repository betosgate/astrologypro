# Task 04 - Add Mid-Month Catch-Up Generation

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Monthly Transits
- Routes: `/community/transits`, subscription activation flow, natal generation flow

---

## Goal

Generate current-month summary rows for active Perennial users who become eligible after the 1st-of-month cron has already run.

## Problem

The current monthly summary model assumes the scheduled cron creates all rows on the 1st of every month.

That misses important real-world cases:

- a user subscribes mid-month
- a user's Perennial membership becomes active after cron
- a family member is added after cron
- a family member's natal chart is generated after cron
- a failed row needs retry before next month

## Required Behavior

When a Perennial member becomes eligible during the month:

- find all eligible family members with generated natal charts
- check whether a valid current-month `monthly_transits` row exists
- generate only missing, failed, stale, or invalid rows
- do not regenerate valid rows
- write lifecycle status consistently

## Recommended Service

Create one reusable server-side generation service:

```ts
ensureCurrentMonthTransitsForMember(memberId, options?)
```

Suggested responsibilities:

- verify active Perennial membership
- load eligible family members
- require generated natal charts
- compute current month key
- validate existing `monthly_transits` rows
- reserve missing rows as `pending`
- generate summary data
- mark rows `generated` or `failed`
- return a structured result with generated/skipped/failed counts

## Trigger Points

Call this service from:

- 1st-of-month cron
- successful Perennial subscription activation
- successful family member natal chart generation
- optional lazy fallback when visiting `/community/transits`
- optional admin retry action

## User Scenario

Example:

- April 1, 2026: cron runs
- April 15, 2026: user subscribes to Perennial
- April 15, 2026: system checks current-month summaries
- if rows are missing and natal charts exist, system generates April summaries immediately
- user does not wait until May 1, 2026

## Acceptance Criteria

- [ ] Mid-month active subscribers receive current-month summary rows.
- [ ] Newly generated family natal charts receive current-month summary rows.
- [ ] Valid existing rows are skipped.
- [ ] Missing/failed/stale rows are generated or retried.
- [ ] Generation lifecycle uses `pending`, `generated`, and `failed`.
- [ ] The cron can reuse the same service instead of maintaining separate logic.
- [ ] Failures are visible enough for admin/support follow-up.
