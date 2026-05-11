# Task 01 - Audit Current Readiness Card Contract

- Status: Done
- Priority: P1
- Area: Community / Dashboard / Readiness
- Route: `/community`
- Reference Screenshot: User-provided dashboard screenshot showing the current `Birth Data Readiness` card with two circular meters.
- Reference Mockup: `/home/influxiq100/.codex/generated_images/019dfb98-821e-7732-84af-67564ae0ca78/ig_08f5a4484168ffec0169fb100ce1148191a2a8ab46ddd86864.png`

---

## Goal

Confirm exactly what the current dashboard readiness card is measuring before redesigning it.

The current card looks like it is reporting household-level readiness, but the visible labels can be misunderstood:

- `Birth Data 100%` appears to mean the logged-in member's birth data is complete.
- `Household Members 100%` appears to mean all household birth data is complete, but it may only be based on member count.

This task must document the actual data source and identify what must change so the card becomes accurate, useful, and aligned with the rest of the dashboard.

## Files To Inspect

- `src/app/community/page.tsx`
- `src/components/community/profile-progress-section.tsx`
- Any API or helper that provides:
  - member count
  - profile percentage
  - missing birth fields
  - natal chart readiness
  - saved natal chart state

## Required Audit Notes

Document the current source for each value:

- `Birth Data` percentage
- `Household Members` percentage
- `membersCount`
- `missingFields`
- `View Profile` link behavior

Also confirm whether these values are scoped to:

- logged-in self profile only
- all family/community members
- plan limit or household size only
- generated chart state

## Expected Findings To Verify

- The card title `Birth Data Readiness` is too narrow if household data is shown.
- The `Household Members` ring should not imply birth data completion unless it truly checks all members.
- The card currently duplicates some purpose with the lower `Your Circle` section, but it does not provide enough actionable summary value.

## Acceptance Criteria

- [x] Current data sources are documented clearly.
- [x] Any misleading label or metric is identified.
- [x] The developer can explain the difference between self readiness, household readiness, and chart readiness.
- [x] Follow-up implementation tasks have enough context to avoid guessing.

---

## Audit Findings (legacy `ProfileProgressSection`)

| Visible Label | Source | Scope | Misleading? |
|---|---|---|---|
| `Birth Data 100%` | `profilePct` in `src/app/community/page.tsx` (~L630) — derived from `community_members.{date_of_birth, birth_time, birth_city}` (34/33/33 split) | Logged-in self only | No (label correctly scoped to self) |
| `Household Members 100%` | `Math.min(100, membersCount * 20)` in `profile-progress-section.tsx` — `membersCount` is `min(family.length + 1, maxMembers)` | Plan-limit fill, **not** birth-data completeness | **Yes** — implies all member profiles are complete when it really only measures plan-seat usage |
| `missingFields` | Built from `hasDob/hasBirthTime/hasBirthCity` in `page.tsx` | Self only | No |
| `View Profile` link | Hardcoded to `/community/profile` | Self only | No, but doesn't help when other members are incomplete |

### Other helpers consulted

- `calcFamilyProfileCompletion` (`src/lib/community/family-profile-completion.ts`) — per-row profile completeness used by `Your Circle`. Includes name/relationship; broader than chart-eligibility.
- `isBirthDataComplete` (`src/lib/community/birth-data-readiness.ts`) — chart-flow gate. Requires dob + time + city + country + lat + lng. Already used by `/community/transits`.
- `deriveNatalReportState` (`src/lib/community/chart-report-state.ts`) — produces `"generated" | "missing" | "generating" | …`. Used by `Your Circle` chart badges.

### Three distinct readiness dimensions (not one)

1. **Self readiness** — primary member's birth data. Today's `Birth Data` ring is correct here.
2. **Household readiness** — every household member having complete birth data. Today's `Household Members` ring **does not** measure this; it only measures seat fill.
3. **Chart readiness** — count of household members with a generated/saved natal chart. Not visible in the legacy card at all.

### Implementation hand-off

Tasks 02 and 03 implement a new `HouseholdReadinessSection` that surfaces all three dimensions separately, uses `isBirthDataComplete` for the household-completeness rule (chart-flow parity), uses `deriveNatalReportState` for chart-ready counts (Your Circle parity), and removes the misleading seat-fill ring entirely.
