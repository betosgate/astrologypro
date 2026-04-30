# Task 03 - Compute Monthly Summary From Birth Data

- Status: Planned
- Priority: P0
- Area: Monthly Transits / Calculation
- Route/Module: `src/lib/community/ensure-monthly-transits.ts`

---

## Goal

Allow community monthly transit summaries to be generated from stored birth data without requiring a previously saved natal chart product.

## Current Problem

The current summary path calls:

```txt
calculateMonthlyTransits(fm.natal_chart, year, month)
```

That requires a saved local `natal_chart`. The admin Horoscope Toolkit does not require this product dependency; it computes the requested report directly from birth data.

## Required Behavior

- Use stored family-member birth fields to derive whatever natal positions are needed internally.
- Do not require `community_family_members.natal_chart` to exist.
- Do not write a natal chart product as a side effect of generating monthly transit summaries unless explicitly required by a separate natal-generation action.
- Continue saving monthly summary output into `monthly_transits.transit_data`.

## Implementation Direction

- Reuse existing local astrology functions where possible.
- If `calculateMonthlyTransits(...)` still requires `NatalChartData`, create an internal adapter that builds `NatalChartData` from birth fields in memory.
- Keep the monthly summary output shape unchanged so existing UI and validators continue to work.

## Acceptance Criteria

- [ ] Monthly summary can be generated for a member with complete birth data and `natal_chart = null`.
- [ ] No natal product/report is created as a side effect.
- [ ] `monthly_transits.transit_data` remains compatible with `isValidMonthlyTransit(...)`.
- [ ] Failure reasons use birth-data terms, not `missing_natal_chart`.
