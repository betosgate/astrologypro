# Task 03 - Add Domain Report Linkage

- Status: Planned
- Priority: P0
- Area: Database / Domain Lifecycle

---

## Goal

Add safe domain-level references from community lifecycle tables to full saved report artifacts in `astro_ai_responses`.

## Required Work

- Add Supabase migration(s).
- Add TypeScript migration registration if this repo requires it.
- Keep migrations additive and idempotent.
- Do not remove existing columns.
- Keep current lightweight chart/cache columns intact.

## Required Domain Links

Natal:

- family member row links to latest saved natal report

Monthly:

- monthly transit row links to latest full monthly report for that month/context

Relationship:

- pair/type lifecycle links to latest saved relationship report

## Compatibility Rule

Existing rows with only `natal_chart`, `monthly_transits.transit_data`, or `relationship_charts.chart_data` must keep working as legacy/lightweight data during rollout.

Do not make old users lose chart access while report linkage is being introduced.

## Acceptance Criteria

- [ ] Migration is additive and idempotent.
- [ ] Domain records can link to `astro_ai_responses`.
- [ ] Existing lightweight chart fields remain intact.
- [ ] Existing RLS and ownership boundaries are not weakened.
- [ ] Code can distinguish legacy chart-only rows from full saved report rows.
