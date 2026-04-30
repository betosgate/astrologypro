# Master Task - Community Independent Chart Products

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Chart Products
- Routes: `/community/transits`, `/community/transits/detailed`, `/community/charts`, `/community/charts/detailed`
- Related Task Sets:
  - `tasks/27.04.2026/community-monthly-transit-architecture`
  - `tasks/28.04.2026/community-member-monthly-transit-full-report-lifecycle`
  - `tasks/28.04.2026/community-relationship-saved-report-lifecycle`

---

## Goal

Make community chart/report products independent, matching the admin Horoscope Toolkit model:

```txt
complete birth data -> generate selected chart/report
```

Community monthly transits and relationship reports must not require the user to generate and save a natal chart product first. Natal chart generation remains its own product and its own CTA, but it must not gate other chart products when the selected product can compute directly from stored birth data.

## Product Rule

The shared prerequisite is complete birth data, not saved natal chart state.

Single-person products require:

```txt
date_of_birth
birth_time
birth_city
birth_country
birth_lat
birth_lng
```

Two-person products require those same fields for both people.

## Current Problem

Community monthly summary generation still uses old dependency logic:

```txt
natal_status='generated' + natal_chart exists -> monthly transit eligible
```

`ensureCurrentMonthTransitsForMember(...)` then calls:

```txt
calculateMonthlyTransits(fm.natal_chart, year, month)
```

This differs from the admin Horoscope Toolkit. The admin toolkit accepts birth data and computes the requested report directly, without requiring a previously saved natal chart product.

## Required Behavior

- `/community/transits` should show members with complete birth data, even if their natal chart has not been generated.
- Members with incomplete birth data should be visible with a `Complete Birth Details` CTA, not silently hidden.
- Monthly transit generation should compute any needed natal positions internally from birth data, without requiring `community_family_members.natal_chart`.
- Full monthly report generation should continue using the existing toolkit/saved-report lifecycle.
- Relationship detailed reports should require complete birth data for both people, not pre-generated natal chart products, wherever the toolkit can compute from birth data directly.
- Already-correct saved report lifecycle behavior must not be refactored unnecessarily.

## Out Of Scope

- No astrology prompt rewrites.
- No admin toolkit behavior change.
- No saved report schema redesign.
- No historical report archive UI.
- No dummy/demo chart data should be treated as valid production output.

## Task Breakdown

1. `01-audit-current-community-product-dependencies.md`
   Confirm every community chart/report surface that still gates product access on saved natal chart state.

2. `02-decouple-monthly-summary-eligibility.md`
   Update monthly summary eligibility from saved natal chart state to complete birth data.

3. `03-compute-monthly-summary-from-birth-data.md`
   Add or adapt a community monthly summary compute path that derives needed natal positions from birth data internally.

4. `04-update-transits-ui-states.md`
   Show complete/incomplete members correctly and keep natal/transit CTAs independent.

5. `05-review-relationship-product-gates.md`
   Ensure relationship detailed reports are gated by both people having complete birth data, not by pre-generated natal chart products, unless a specific lightweight legacy summary endpoint truly requires saved natal chart data.

6. `06-regression-and-qa-checklist.md`
   Verify independent product behavior, saved report lifecycle, ownership, and no admin API leakage.

## Acceptance Criteria

- [ ] If 4 family members have complete birth data, `/community/transits` shows all 4 even if only 2 have natal charts.
- [ ] A member with complete birth data and no natal chart can generate/open a monthly transit report.
- [ ] A member with incomplete birth data appears with `Complete Birth Details`.
- [ ] Existing valid monthly transit rows still render normally.
- [ ] Existing saved monthly reports still open through `View Transit Report` without live regeneration.
- [ ] Natal chart CTA state does not affect transit visibility.
- [ ] Relationship detailed reports use complete birth data for both people as the product gate.
- [ ] Admin Horoscope Toolkit behavior remains unchanged.
- [ ] Community pages do not call admin-only APIs for community product generation/view flows.
