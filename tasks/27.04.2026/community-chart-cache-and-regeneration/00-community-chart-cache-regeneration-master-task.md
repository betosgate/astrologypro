# Master Task - Harden Community Chart Cache And Regeneration

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Astrology Charts
- Page Routes: `/community`, `/community/horoscope`, `/community/charts`, `/community/transits`

---

## Goal

Make Perennial community chart generation read saved chart data first and regenerate only when data is missing, failed, invalidated, stale, or explicitly requested.

This applies only to the Perennial/community role:

- self and added-member natal/nativity charts
- monthly transit reports
- relationship charts for friendship, romantic/love, and partnership use cases

## Why This Task Exists

Community chart artifacts already have domain-specific storage:

- `community_family_members.natal_chart`
- `monthly_transits.transit_data`
- `relationship_charts.chart_data`

The new generic `astro_ai_responses` table is useful for saved AI report artifacts, but it should not become the main lifecycle store for Perennial chart generation.

Current issues found during code scan:

- `src/app/api/community/me/generate-chart/route.ts` always regenerates the self natal chart before handling natal, monthly, or relationship generation.
- `src/app/api/community/relationship-charts/route.ts` recalculates a pair every time instead of returning an existing current chart.
- `src/app/api/community/astro-charts/route.ts` appears to query `monthly_transits` with `member_id`, but the table uses `family_member_id`.
- The batch relationship route already has better current-vs-invalidated behavior and should be treated as the model.
- Older project phases may have stored dummy or legacy chart JSON in the same columns. Cached reads must not blindly trust old rows unless they match the current production chart shape/version.

## Required Outcome

The community chart flow should behave like this:

- natal chart exists and is generated: return stored chart
- monthly transit exists for current month: return stored transit
- relationship chart exists and is not invalidated: return stored relationship chart
- chart missing, failed, invalidated, or explicitly forced: regenerate and persist
- legacy/dummy chart shape detected: treat as stale and regenerate through the current production generator

## Task Breakdown

1. `01-fix-dashboard-monthly-transit-lookup.md`
   Fix the dashboard API so it reads current-month transits by `family_member_id`.

2. `02-make-me-generate-chart-cache-aware.md`
   Stop the convenience generation endpoint from blindly regenerating self natal charts.

3. `03-make-single-relationship-post-cache-aware.md`
   Make the single-pair relationship generation endpoint return cached current charts.

4. `04-align-relationship-batch-and-me-generate-chart.md`
   Align `me/generate-chart` relationship behavior with the existing batch route.

5. `05-regression-and-qa-checklist.md`
   Verify natal, monthly transit, relationship cache, invalidation, and retry behavior.

6. `06-legacy-chart-data-guard.md`
   Add validation/version checks so old dummy chart rows are not reused as current production chart data.

## Out Of Scope

- Moving Perennial chart storage into `astro_ai_responses`
- Refactoring admin Astro Toolkit saved reports
- Changing astrology calculation algorithms
- Changing membership entitlement rules
- Adding AI interpretation caching unless a later task explicitly scopes it

## Acceptance Criteria

- [ ] Dashboard monthly transit card can load an existing current-month transit row.
- [ ] Self natal generation returns stored chart when a valid generated chart already exists.
- [ ] Monthly generation reuses stored self natal chart instead of forcing natal regeneration.
- [ ] Single relationship POST returns cached chart when pair is current.
- [ ] Relationship charts regenerate only when missing, invalidated, or forced.
- [ ] Old dummy/legacy chart JSON is not shown as valid current chart data.
- [ ] Existing natal retry, audit, and locked-for-review behavior remains intact.
- [ ] Core Perennial chart lifecycle does not depend on `astro_ai_responses`.
