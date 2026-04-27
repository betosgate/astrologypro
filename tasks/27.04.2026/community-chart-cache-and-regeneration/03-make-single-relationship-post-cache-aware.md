# Task 03 - Make Single Relationship POST Cache-Aware

- Status: Planned
- Priority: P1
- Area: Perennial / Community / Relationship Charts
- File: `src/app/api/community/relationship-charts/route.ts`
- Page Route: `/community/charts`

---

## Problem

`POST /api/community/relationship-charts` calculates synastry every time for the same pair.

The batch endpoint already skips existing current charts and only regenerates missing or invalidated pairs. The single-pair route should follow the same domain rule.

## Required Backend Fix

Before calculating synastry:

1. Authenticate and resolve the active community member.
2. Validate both family member ids belong to that member.
3. Sort `personAId` and `personBId`.
4. Look up an existing `relationship_charts` row for that sorted pair and `member.id`.
5. If a row exists, `invalidated_at IS NULL`, and `chart_data` matches the current production relationship-chart shape/version, return the stored `chart_data`.
6. If no row exists, `invalidated_at IS NOT NULL`, stored data looks legacy/dummy, or `forceRegenerate` is true, calculate and upsert.

Support optional request field:

```json
{
  "personAId": "uuid",
  "personBId": "uuid",
  "forceRegenerate": false
}
```

## Response Contract

Cached response:

```json
{
  "chartId": "uuid",
  "synastry": {},
  "source": "cached"
}
```

Generated response:

```json
{
  "chartId": "uuid",
  "synastry": {},
  "source": "generated"
}
```

Regenerated response:

```json
{
  "chartId": "uuid",
  "synastry": {},
  "source": "regenerated"
}
```

## Acceptance Criteria

- [ ] Existing non-invalidated pair returns cached chart data.
- [ ] Cached read does not update `generated_at`.
- [ ] Missing pair generates and persists a new chart.
- [ ] Invalidated pair regenerates and clears `invalidated_at`.
- [ ] Legacy/dummy relationship chart JSON is treated as stale and regenerated.
- [ ] `forceRegenerate: true` recalculates a current pair.
- [ ] Cross-household family member ids are rejected safely.
