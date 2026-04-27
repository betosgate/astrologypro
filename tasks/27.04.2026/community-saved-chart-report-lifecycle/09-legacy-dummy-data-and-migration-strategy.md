# Task 09 - Legacy Dummy Data And Migration Strategy

- Status: Planned
- Priority: P1
- Area: Data Migration / Compatibility

---

## Goal

Protect users from old dummy/internal chart data while preserving access to valid existing saved charts during rollout.

## Existing Data Sources

- `community_family_members.natal_chart`
- `monthly_transits.transit_data`
- `relationship_charts.chart_data`
- `astro_ai_responses`

## Required Rules

- Old/dummy JSON must not unlock View as if it were a complete report.
- Valid legacy lightweight chart data may remain usable as a compatibility fallback.
- Full saved report linkage should become the preferred source for View.
- Regenerate should create a new full report artifact and update domain linkage.

## Validation

Use centralized validators for:

- lightweight natal chart shape
- lightweight monthly transit shape
- lightweight relationship chart shape
- full saved toolkit report shape

## Acceptance Criteria

- [ ] Dummy/invalid natal data does not show View.
- [ ] Dummy/invalid monthly data does not show View.
- [ ] Dummy/invalid relationship data does not show View.
- [ ] Valid old chart rows do not disappear from users during rollout.
- [ ] Regenerate upgrades legacy rows to full saved report artifacts.
- [ ] Migration/backfill plan is documented before running destructive changes.
