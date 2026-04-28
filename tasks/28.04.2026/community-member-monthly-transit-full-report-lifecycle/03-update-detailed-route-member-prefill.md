# Task 03 - Update Detailed Route Member Prefill

- Status: Planned
- Priority: P0
- Area: Server Page / Monthly Full Report
- Route: `/community/transits/detailed`

---

## Goal

Allow the detailed monthly report route to open for a selected household member, not only self.

## Required URL

```txt
/community/transits/detailed?familyMemberId=<uuid>&month=YYYY-MM
```

If `month` is missing, default to current month.

## Required Validation

- User must be authenticated.
- User must have active `perennial_mandalism` membership.
- `familyMemberId` must belong to the authenticated member's household.
- Family member must have complete birth data required by `HoroscopeToolkitPage`.
- Family member must have valid natal readiness before monthly full report can generate.

## Prefill Behavior

Build `HoroscopeToolkitPage` prefill from selected family member:

- full name
- date of birth
- birth time
- birth city
- birth country
- lat/lng
- target month start date

Pass:

```tsx
allowedSlugs={["tropical_transits_monthly_v3"]}
readOnlyBirthData={true}
```

## Missing Data Behavior

If selected member is missing required data:

- Do not render toolkit.
- Show clear missing-data card.
- Link back to that member's edit page or `/community/family`.

## Acceptance Criteria

- [ ] Selected member birth data auto-populates.
- [ ] Fields are read-only/disabled.
- [ ] Self user still works when their self-row is selected.
- [ ] Foreign household ids are rejected/redirected.
- [ ] Missing data does not trigger live generation.
