# Diviner Traffic Analytics and Hit Attribution — Architect Task Pack

- Date: 2026-04-13
- Status: Open
- Priority: P0
- Owner: Architecture / Full-stack

---

## Problem Statement

The platform currently has partial funnel analytics based on `page_views`, but it does **not** yet provide a clean admin report that answers:

- which diviners are getting the most hits
- where those hits are coming from
- what time those hits are arriving
- whether those hits are affiliate-related, advocate-related, advisory-related, or purely organic
- what country and location mix those hits represent

The current analytics model is too thin to support this accurately. `page_views` currently stores:

- `diviner_id`
- `path`
- `referrer`
- `user_agent`
- `ip_hash`
- `created_at`

That is sufficient for a basic page-view count and coarse referrer grouping, but **insufficient** for the requested acquisition report.

---

## Architectural Objective

Introduce a reliable acquisition analytics layer for diviner traffic that:

1. captures the right dimensions at write time
2. preserves privacy by continuing to avoid raw IP persistence
3. attributes traffic to partner channels using explicit rules rather than brittle inference
4. powers a new admin report for top diviners by hits
5. is seedable so the feature can be demoed and validated in non-production environments

---

## Source of Truth Rules

### 1. Event Source of Truth

`page_views` remains the canonical raw event table for public diviner-page traffic.

Do **not** create a second raw hit table unless there is a hard technical reason. The requested report is fundamentally a richer projection of page-view data, not a separate business object.

### 2. Privacy Rule

Continue storing only `ip_hash`, not raw IP.

If geo or region data is needed:
- derive from trusted request headers at ingestion time
- store normalized geographic descriptors
- do not retain raw IP as an analytics field

### 3. Attribution Rule

Attribution must be stamped **when the hit is recorded**, not reconstructed later from loosely related tables where possible.

This is critical because:
- referral codes can become invalid later
- campaign metadata can change
- inferred joins are fragile

### 4. Reporting Rule

The admin report should consume:
- raw `page_views` dimensions
- direct diviner metadata
- explicit attribution flags

The report should **not** depend on booking joins just to decide whether a hit was affiliate- or advocate-related.

---

## Current Repo Surfaces

### Tracking

- `src/components/landing/page-tracker.tsx`
- `src/app/api/analytics/track/route.ts`
- `supabase/migrations/20260401000002_analytics.sql`

### Existing Reports

- `src/app/admin/reports/funnel/page.tsx`
- `src/app/api/admin/reports/funnel/route.ts`
- `src/app/admin/reports/affiliates/page.tsx`
- `src/app/api/admin/reports/affiliates/route.ts`
- `src/components/admin/admin-sidebar.tsx`

### Affiliate / Advocate / Campaign Context

- `src/app/advocate/page.tsx`
- `src/lib/affiliate-commissions.ts`
- `supabase/migrations/20260331000001_initial_schema.sql`
- `supabase/migrations/20260407000063_affiliate_commission.sql`
- `supabase/migrations/20260413000005_affiliate_campaigns.sql`

### Existing Seed Baseline

- `supabase/migrations/20260413000004_seed_session_data.sql`

---

## Required Data Dimensions

The report must support at minimum:

### Traffic volume

- total hits
- unique visitors by `ip_hash`
- top diviners by hits

### Geographic breakdown

- country
- region/state where available
- city where available

### Time breakdown

- hour-of-day distribution
- latest-hit timestamp per diviner

### Source breakdown

- direct
- organic search
- social
- referral
- affiliate
- advocate
- email if present

### Partner relevance

- affiliate-related or not
- advocate-related or not
- advisory-related or not

For this pack, “advisory-related” should be treated as a **first-class attribution classification decision**, not an informal label.

---

## Advisory Classification Decision

The word “advisory” is ambiguous in the current repo. It could mean:

1. social-advocacy traffic
2. advisor / advisory partner campaigns
3. some future content/advisor program not yet formalized

### Architectural decision for this phase

Model this explicitly instead of overloading one term.

Recommended approach:

- `affiliate_related: boolean`
- `advocate_related: boolean`
- `attribution_kind: enum/text`

If the business later defines a third advisory actor type, add it explicitly rather than encoding “advisory” into freeform `utm_medium` values alone.

For the first delivery, `attribution_kind` should support:

- `organic`
- `affiliate`
- `advocate`
- `unknown`

If the team confirms a separate advisory program later, extend this to:

- `advisory`

without redesigning the report.

---

## Execution Order

```
01 → 02 → 03 → 04 → 05 → 06
```

### Why this order matters

- The schema must land before ingestion starts writing richer attribution data.
- The tracker must be updated before the admin report can produce meaningful new slices.
- The seed should follow the schema so demo environments have realistic data immediately.
- The admin report should be added after the data contract is stable.

---

## Sub-Tasks

| # | File | Objective | Depends on | Status |
|---|---|---|---|---|
| 01 | `01-extend-page-views-schema-for-acquisition-analytics.md` | Expand `page_views` to capture geo, source, UTM, and partner attribution dimensions | — | Open |
| 02 | `02-upgrade-public-page-tracking-payload-and-ingestion.md` | Update the tracker and route handler to stamp attribution at write time | 01 | Open |
| 03 | `03-seed-realistic-diviner-traffic-report-data.md` | Seed realistic multi-diviner hit data covering countries, sources, and partner traffic | 01 | Open |
| 04 | `04-build-admin-diviner-traffic-report-api.md` | Build the aggregation route for top diviners, countries, sources, and hourly traffic | 01, 02, 03 | Open |
| 05 | `05-build-admin-diviner-traffic-report-ui.md` | Build the admin report page and sidebar entry using current admin report conventions | 04 | Open |
| 06 | `06-analytics-governance-and-data-quality-rules.md` | Define source-of-truth rules, edge cases, and verification so the report stays trustworthy | 01, 02, 04 | Open |

---

## Non-Negotiable Constraints

1. Do not store raw visitor IP in the analytics table.
2. Do not infer partner attribution purely from post-hoc booking joins if it can be stamped at ingest time.
3. Do not build the new report as a bespoke one-off outside the existing admin reports structure.
4. Do not create reporting logic that silently changes meaning when referral codes or campaigns are edited later.
5. Do not let “advocate” and “affiliate” collapse into one ambiguous bucket.

---

## Expected Outcome

After this task pack is implemented:

- admins can rank diviners by hits
- admins can see country/location/source distribution
- admins can distinguish affiliate, advocate, and non-partner traffic
- the report can be demoed immediately from seeded data
- the analytics model is extensible enough to support future acquisition reporting without rework

