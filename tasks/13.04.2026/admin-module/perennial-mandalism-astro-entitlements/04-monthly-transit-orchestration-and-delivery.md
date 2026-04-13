# 04 Monthly Transit Orchestration and Delivery

## Goal

Formalize monthly transit generation so it remains once-per-month, automated, observable, and aligned to membership eligibility.

## Current Repo Grounding

Monthly transit automation already exists in:

- `src/app/api/cron/monthly-transits/route.ts`
- `src/lib/astro/transits.ts`
- `monthly_transits`

The current implementation already:

- requires cron auth
- filters to active memberships
- skips rows already generated for that month
- inserts one row per family member and month
- attempts email notification

## Current Gap

The cron exists, but the product contract is not yet fully governed.

Missing concepts:

- formal user entitlement definition
- visibility into generation success or failure
- retry policy for failed monthly generation
- admin reporting for missed generations

## Required Product Rule

Monthly transit generation must happen:

- once per eligible profile per calendar month

This should remain an idempotent invariant.

## Recommended Lifecycle States

Per profile per month:

- `pending`
- `generated`
- `notified`
- `failed`
- `suppressed`

## Failure Handling

Generation failure must not silently disappear.

Recommended behavior:

- mark the month record as failed or log a failed attempt
- surface it to admin operations
- allow controlled retry by automation or staff action

## Delivery Rule

Transit generation and user notification are separate concerns.

That means:

- chart generation can succeed even if email fails
- notification state should be tracked independently

## Deliverables

- monthly transit entitlement rules
- generation and notification state model
- failure and retry strategy
- admin observability requirements

---

## Implementation — 2026-04-13

### Migration
`supabase/migrations/20260413000184_monthly_transit_lifecycle.sql`

**Columns added to `monthly_transits`:**
- `generation_status` TEXT — `pending | generated | notified | failed | suppressed`
- `failure_reason` TEXT
- `retry_count` INTEGER DEFAULT 0
- `last_attempted_at` TIMESTAMPTZ
- `notified_at` TIMESTAMPTZ — separate from `notification_sent` for richer tracking

Backfill: existing rows with `notification_sent = true` → `generation_status = 'notified'`, others → `'generated'`.

### Cron update
`src/app/api/cron/monthly-transits/route.ts` — fully rewritten:
- Reserves a `pending` row before computation (prevents duplicate inserts on retry)
- If a `failed` row exists for the month, reuses its ID and retries in-place
- Marks `failed` with `failure_reason` on calculation error
- Marks `generated` on success, `notified` after email delivery
- Generation success and notification success tracked independently
- Email failure leaves status as `generated` with `failure_reason = 'notification_email_failed'` — admin can see and resend
- Returns `{ generated, notified, skipped, failed, month }` for cron monitoring
- Only processes family members with `natal_status = 'generated'` (entitlement gate)
