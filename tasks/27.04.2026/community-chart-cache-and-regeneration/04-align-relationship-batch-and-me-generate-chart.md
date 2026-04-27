# Task 04 - Align Relationship Batch And Me Generate Chart

- Status: Planned
- Priority: P1
- Area: Perennial / Community / Relationship Charts
- Files:
  - `src/app/api/community/me/generate-chart/route.ts`
  - `src/app/api/community/relationship-charts/batch/route.ts`

---

## Problem

The batch relationship route already has the correct behavior:

- skip current charts
- generate missing charts
- regenerate invalidated charts

The `type: "relationship"` branch in `me/generate-chart` currently loops through household pairs and upserts every pair it can calculate.

## Required Backend Fix

Update the relationship branch in `me/generate-chart` to match batch behavior:

- fetch household family members with natal charts
- fetch existing relationship charts for the member
- build sorted pair keys
- skip pairs where a chart exists, `invalidated_at IS NULL`, and `chart_data` matches the current production relationship-chart shape/version
- regenerate pairs where `invalidated_at IS NOT NULL`
- regenerate pairs where stored `chart_data` looks like old dummy/legacy data
- generate missing pairs
- return accurate counts

Recommended response data:

```json
{
  "generated": 0,
  "cached": 0,
  "invalidatedRegenerated": 0,
  "blocked": 0,
  "familyWithoutCharts": [],
  "totalPairs": 0
}
```

## Acceptance Criteria

- [ ] Relationship generation from `me/generate-chart` does not rewrite current charts.
- [ ] Missing pairs are generated.
- [ ] Invalidated pairs are regenerated.
- [ ] Legacy/dummy relationship rows are regenerated instead of cached.
- [ ] Members without natal charts are reported as blocked or missing.
- [ ] Behavior is consistent with `/api/community/relationship-charts/batch`.
