# Task 03 - Wire Household Readiness Metrics And Actions

- Status: Planned
- Priority: P1
- Area: Data / Community Dashboard
- Route: `/community`
- Depends On:
  - `01-audit-current-readiness-card-contract.md`
  - `02-redesign-household-readiness-card-ui.md`

---

## Goal

Connect the redesigned readiness card to real household data so the UI does not show misleading percentages.

## Required Metrics

Compute or reuse these values:

- `selfBirthDataPercent`
  - Based on logged-in/self member required birth fields.

- `completeMemberCount`
  - Number of household members with all required birth fields for chart generation.

- `totalMemberCount`
  - Number of visible household/community members.

- `missingDetailsCount`
  - Number of members missing required birth details.

- `natalChartsReadyCount`
  - Number of household members with generated/saved natal charts.

- `natalChartsTotalEligibleCount`
  - Number of household members eligible for natal chart generation.

## Birth Data Completeness Rule

Use the same completeness rule already used by chart-generation flows wherever possible.

Required fields should include the fields needed to generate charts reliably:

- date of birth
- birth time
- birth place/city
- location coordinates or resolved place fields if the existing chart flow requires them

Do not invent a separate dashboard-only readiness rule if a shared helper already exists.

## CTA Rules

Show actions based on real state:

- `Complete Missing Details`
  - Show only when at least one member is missing required birth data.
  - Link to the most appropriate family/profile edit flow.

- `Manage Family`
  - Link to `/community/family`.

- `View Charts`
  - Link to `/community/charts` or `/community/transits` depending on final card copy.

## Implementation Notes

- Prefer adding a small typed data object for the card instead of passing loosely related props.
- Keep the lower `Your Circle` section as the detailed member list.
- If existing data is already loaded on `/community`, derive these metrics without adding unnecessary API calls.
- If existing data is not enough, extend the existing dashboard API/data loader carefully.

## Acceptance Criteria

- [ ] Self readiness and household readiness are calculated separately.
- [ ] Household completeness is based on actual member birth details, not member count alone.
- [ ] Chart-ready count reflects generated/saved natal charts.
- [ ] Missing-details count matches the members that need action.
- [ ] CTA labels and destinations match the current data state.
- [ ] No backend or frontend code relies on hardcoded `100%` household readiness.
