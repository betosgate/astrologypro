# Task 01 - Audit Current Readiness Card Contract

- Status: Planned
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

- [ ] Current data sources are documented clearly.
- [ ] Any misleading label or metric is identified.
- [ ] The developer can explain the difference between self readiness, household readiness, and chart readiness.
- [ ] Follow-up implementation tasks have enough context to avoid guessing.
