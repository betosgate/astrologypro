# Master Task - Community Dashboard Monthly Transit Card Sync

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Dashboard / Monthly Transits
- Routes: `/community`, `/community/transits`, `/community/transits/detailed`
- Related Task Sets:
  - `tasks/28.04.2026/community-member-monthly-transit-full-report-lifecycle`
  - `tasks/30.04.2026/community-independent-chart-products`

---

## Goal

Make the dashboard Monthly Transit card reflect the same household monthly-transit state as `/community/transits`.

If two household members have current-month transit reports generated, the dashboard must not show a failed or stale single-member state. It should surface the generated transit rows clearly, similar to how the dashboard Natal Charts section already supports a carousel.

## Current Problem

`/community/transits` and the dashboard use different data contracts.

`/community/transits`:

- loads all household family members
- uses complete birth data as the transit eligibility rule
- lazily ensures missing current-month `monthly_transits` rows
- renders one card per eligible member

Dashboard `/community` Monthly Transit card:

- calls `/api/community/astro-charts`
- only checks the first generated natal-chart member
- uses `.maybeSingle()` for that one member/month
- stores a single `monthlyTransit` object in `AstroChartsSection`
- cannot show multiple generated transit rows

This causes the dashboard to miss valid generated transit reports for other members. If the one-member lookup errors, the dashboard shows:

```txt
Could not load chart data. Try refreshing the page.
```

even while `/community/transits` shows generated transit access.

## Suspected Failure Points

- `src/app/api/community/astro-charts/route.ts`
  - `monthlyTransit` is scoped to `natalCharts[0].id`.
  - transit eligibility is indirectly tied to generated natal chart state.
  - `.maybeSingle()` can fail the whole dashboard transit card if data is duplicated or otherwise violates the single-row assumption.

- `src/components/community/astro-charts-section.tsx`
  - only stores one `monthlyTransit`.
  - Monthly Transit UI has no carousel/list state.
  - failed status renders a generic chart-data error instead of a member-specific fallback.

## Required Behavior

- Dashboard Monthly Transit must use the same household scope as `/community/transits`.
- Dashboard Monthly Transit eligibility must be based on complete birth data, not generated natal chart state.
- Dashboard API should return a list of current-month transit summaries, not one row tied to the first natal chart.
- Dashboard UI should render multiple transit entries with a carousel or compact list.
- Per-entry CTA should link to:

```txt
/community/transits/detailed?familyMemberId=<family_member_id>&month=YYYY-MM
```

- CTA label should distinguish:
  - `View Transit Report` when `full_report_id` exists
  - `Generate Transit Report` when only summary exists
  - `Retry Transit Report` when full report failed
  - disabled/generating state when summary generation is pending
- A malformed or duplicate row should not break the whole dashboard card when other valid rows exist.

## Out Of Scope

- No astrology calculation changes.
- No prompt/content changes.
- No saved report schema redesign.
- No changes to the Natal Charts carousel except preserving compatibility.
- No historical monthly archive UI.

## Task Breakdown

1. `01-audit-dashboard-transit-contract.md`
   Confirm the exact dashboard API/UI contract and compare it with `/community/transits`.

2. `02-update-astro-charts-api-monthly-list.md`
   Update `/api/community/astro-charts` to return a monthly-transit list scoped to all eligible household members.

3. `03-update-dashboard-monthly-transit-ui.md`
   Render dashboard monthly transits as a member carousel or compact list with member-specific CTAs.

4. `04-hardening-and-data-drift-handling.md`
   Avoid whole-card failure for one bad row; log and skip invalid duplicates/stale rows where possible.

5. `05-regression-and-qa-checklist.md`
   Verify dashboard and `/community/transits` remain aligned.

## Acceptance Criteria

- [ ] If two members have generated current-month transits, dashboard Monthly Transit shows two entries or a `1 / 2` style carousel.
- [ ] Dashboard Monthly Transit no longer depends on `natalCharts[0]`.
- [ ] Dashboard Monthly Transit uses complete birth data as the eligibility gate.
- [ ] Dashboard CTA opens the selected member/month detailed route.
- [ ] Existing Natal Charts carousel still works.
- [ ] `/community/transits` behavior remains unchanged.
- [ ] A single invalid/malformed monthly transit row does not cause the dashboard card to show a global failure if other valid rows exist.
- [ ] Production data has or is verified to have `UNIQUE (family_member_id, month)` on `monthly_transits`.
