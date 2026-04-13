# 02 Automatic Natal Generation and Retry Governance

## Goal

Design automatic natal chart generation for entitled profiles while preventing unlimited recalculation abuse.

## Current Repo Grounding

Natal chart generation already exists in:

- `src/app/api/community/generate-natal/route.ts`

It currently:

- validates ownership through RLS
- reads birth details from `community_family_members`
- computes a chart using `generateNatalChart`
- stores the result back on the family member record

## Current Gap

The current system behaves like an on-demand generator, not a governed entitlement workflow.

Missing concepts:

- automatic first-time generation
- retry counters
- failure states
- input correction window
- lockout and escalation policy

## Recommended Generation States

For each eligible profile, track something like:

- `not_started`
- `queued`
- `generated`
- `failed`
- `locked_for_review`

## Recommended Retry Model

The user requirement says:

- charts should normally generate once
- members can regenerate up to `3` times if they entered information incorrectly

Recommended interpretation:

- first successful chart generation is free and automatic
- after that, allow up to `3` user-initiated correction regenerations
- once the limit is exhausted, block self-service regeneration
- direct the user into the support ticket flow

## Required Audit Fields

Per eligible profile, track:

- first generated timestamp
- last generated timestamp
- successful generation count
- user correction retry count
- last generation failure reason
- lock reason

## Trigger Strategy

Automatic natal generation should trigger when:

- a new eligible profile is created with sufficient birth data
- missing required birth data becomes complete

Automatic generation should not rerun on every edit.

Instead, a material-change rule should decide whether:

- the chart becomes invalidated
- the chart is eligible for regeneration
- the correction retry counter should be used

## Deliverables

- natal generation lifecycle
- retry-limit rules
- material birth-data change rules
- failure handling and lockout policy

---

## Implementation — 2026-04-13

### Migration
`supabase/migrations/20260413000182_natal_generation_governance.sql`

**Columns added to `community_family_members`:**
- `natal_status` TEXT — lifecycle: `not_started | queued | generated | failed | locked_for_review`
- `natal_retry_count` INTEGER — number of correction retries consumed
- `natal_max_retries` INTEGER DEFAULT 3 — per-profile limit (admin can raise without migration)
- `natal_first_generated_at` TIMESTAMPTZ
- `natal_last_generated_at` TIMESTAMPTZ
- `natal_failure_reason` TEXT
- `natal_lock_reason` TEXT

Backfill: existing rows with `natal_chart IS NOT NULL` → `natal_status = 'generated'` with timestamps from `chart_updated_at`.

### API update
`src/app/api/community/generate-natal/route.ts` — fully rewritten:
- Gates on `natal_status = 'locked_for_review'` → 403 with retry info
- Distinguishes first-time generation (free, no retry consumed) vs user correction (consumes a retry)
- Checks remaining retries before attempting; locks profile when limit is hit
- Marks `natal_status = 'queued'` while generating, `'generated'` on success, `'failed'` on error
- Writes `natal_regeneration_audit` record for every user correction (task 05)
- Sends `sendNatalChartReady` or `sendNatalChartUpdated` email on success (task 09)
- Returns `{ natal_status, retries_used, retries_remaining, is_first_generation }` in response
