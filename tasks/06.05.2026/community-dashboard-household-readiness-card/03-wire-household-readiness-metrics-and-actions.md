# Task 03 - Wire Household Readiness Metrics And Actions

- Status: Done
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

- [x] Self readiness and household readiness are calculated separately.
- [x] Household completeness is based on actual member birth details, not member count alone.
- [x] Chart-ready count reflects generated/saved natal charts.
- [x] Missing-details count matches the members that need action.
- [x] CTA labels and destinations match the current data state.
- [x] No backend or frontend code relies on hardcoded `100%` household readiness.

---

## Wiring Summary (`src/app/community/page.tsx`)

| Metric | Source |
|---|---|
| `selfBirthDataPercent` | Existing `profilePct` (34/33/33 split over `community_members.{date_of_birth, birth_time, birth_city}`) |
| `selfBirthDataComplete` | `hasDob && hasBirthTime && hasBirthCity` |
| `selfMissingFields` | Existing `profileMissingFields` |
| `completeMemberCount` | `(selfBirthDataComplete ? 1 : 0)` + family rows passing `isBirthDataComplete(...)` |
| `totalMemberCount` | `familyMembers.length + 1` |
| `missingDetailsCount` | `totalMemberCount - completeMemberCount` |
| `chartsReadyCount` | Family rows where `deriveNatalReportState(fm) === "generated"`, plus self chart when self is not in the family table |
| `chartsEligibleCount` | `householdCompleteCount` (you can't generate a chart without complete birth data) |

Family-row query was extended to include `birth_lat`, `birth_lng`, `birth_time_unknown` so `isBirthDataComplete` (the chart-flow gate) can run without an extra fetch. No new API or DB call was introduced — all metrics are derived from data already loaded for the dashboard.

CTA destinations:
- `Manage Family` → `/community/family`
- `View Charts` → `/community/charts`
- `Complete Missing Details` → `/community/family` (rendered only when `missingDetailsCount > 0`)
