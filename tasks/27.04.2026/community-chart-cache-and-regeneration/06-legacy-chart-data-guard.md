# Task 06 - Legacy Chart Data Guard

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Chart Data Integrity
- Files:
  - `src/app/api/community/me/generate-chart/route.ts`
  - `src/app/api/community/generate-natal/route.ts`
  - `src/app/api/community/relationship-charts/route.ts`
  - `src/app/api/community/relationship-charts/batch/route.ts`
  - `src/app/api/cron/monthly-transits/route.ts`

---

## Problem

Older project phases may have stored dummy or legacy chart JSON in the same production columns used today:

- `community_family_members.natal_chart`
- `monthly_transits.transit_data`
- `relationship_charts.chart_data`

If cache-aware reads simply trust any non-null chart JSON, users may see stale dummy output instead of current production chart calculations.

## Required Backend Fix

Add a lightweight validation guard before reusing cached chart data.

For natal chart cache, require the current production shape at minimum:

- `planets` is an array
- each key planet row has `name`, `sign`, `degree`, `longitude`, `retrograde`
- `generatedAt` exists
- `birthTime` key exists
- `ageGroup` is `child` or `adult`

For monthly transit cache, require:

- `month` matches the requested `YYYY-MM`
- `planets` is an array
- `highlights` is an array
- `generatedAt` exists

For relationship chart cache, require:

- `personAName`
- `personBName`
- `aspects` array
- numeric `score`
- `summary`
- `generatedAt`

If a stored row does not pass validation:

- treat it as stale
- regenerate through the current production generator
- persist the regenerated data
- do not return the old payload to the user

## Recommended Future Schema

Add explicit generator metadata in a later migration if needed:

- `chart_generator`
- `chart_schema_version`
- `chart_source`
- `input_hash`

Suggested values:

- `chart_generator = "community_astrology_engine"`
- `chart_schema_version = "community_natal_v1"` or similar
- `chart_source = "production"`

This future migration is optional for this task. Shape validation is enough for the first hardening pass.

## Acceptance Criteria

- [ ] Old/dummy natal chart JSON is not reused as a valid cache hit.
- [ ] Old/dummy monthly transit JSON is not reused as a valid cache hit.
- [ ] Old/dummy relationship chart JSON is not reused as a valid cache hit.
- [ ] Invalid cached data is regenerated or returned as a clear stale/failed state.
- [ ] Valid current production-shaped rows continue to be reused.
- [ ] The guard is centralized in a helper where practical, not duplicated ad hoc in every route.
