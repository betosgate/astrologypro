# Task 01 - Extend `page_views` Schema for Acquisition Analytics

- Status: Done

## Completion Notes

- Implemented in [supabase/migrations/20260413000170_diviner_activity_analytics.sql](/Users/debasiskarm4/Documents/projects.nosync/divine/AstrologyPro/supabase/migrations/20260413000170_diviner_activity_analytics.sql:1), which adds `source_host`, `traffic_source`, `utm_*`, `referral_code`, attribution flags, and geo fields to `page_views`.
- The migration also adds the report-oriented indexes for `diviner_id` and `traffic_source` query shapes.
- Priority: P0
- Owner: Database

## Objective

Upgrade `page_views` from a minimal funnel table into an acquisition-ready event table that can support geo, source, and partner attribution reporting without creating a second raw event stream.

## Why This Task Exists

The current table supports only:

- path
- referrer
- user agent
- IP hash
- timestamp

That makes it impossible to answer the requested report accurately:

- top diviners by hits
- country/location distribution
- hourly hit distribution
- affiliate/advocate/advisory relevance

## Required Schema Additions

The schema should support at least:

- `country_code`
- `country_region`
- `city`
- `source_host`
- `traffic_source`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `referral_code`
- `attribution_kind`
- `affiliate_related`
- `advocate_related`

## Recommended Column Semantics

### `country_code`

- ISO-style country code when available
- nullable

### `country_region`

- state / province / regional code from trusted request headers
- nullable

### `city`

- normalized city label from trusted request headers
- nullable

### `source_host`

- hostname derived from `referrer`
- store the normalized host, not the entire URL, for grouping stability

### `traffic_source`

Canonical coarse traffic bucket.

Recommended allowed values:

- `direct`
- `organic_search`
- `social`
- `referral`
- `affiliate`
- `advocate`
- `email`

Use text if the team wants flexibility, but maintain an explicit derivation policy in code.

### `attribution_kind`

Partner attribution class.

Recommended current values:

- `organic`
- `affiliate`
- `advocate`
- `unknown`

### `affiliate_related` / `advocate_related`

Boolean flags for simple reporting and filtering.

## DB Design Notes

- Add indexes for the report’s primary query shapes:
  - by `diviner_id + created_at`
  - by `traffic_source + created_at`
  - by `attribution_kind + created_at`
- Do not remove or repurpose `ip_hash`.
- Preserve the table as append-only event data in practice, even if SQL-level immutability is not enforced.

## Files To Read First

- `supabase/migrations/20260401000002_analytics.sql`
- `src/app/api/analytics/track/route.ts`
- `src/app/api/admin/reports/funnel/route.ts`

## Acceptance Criteria

- `page_views` can represent the requested report dimensions without requiring fragile enrichment joins.
- The new columns are named clearly enough that later report authors will not reinterpret them.
- The schema remains privacy-safe because raw IP is still not stored.

## Verification Test Plan

- [ ] Run the migration locally and inspect the altered `page_views` schema.
- [ ] Confirm the new indexes exist.
- [ ] Confirm old `page_views` queries continue to work with the expanded schema.
