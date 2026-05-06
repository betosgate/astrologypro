# Task 01 - Fix Duplicate Self Profile And Coordinate Readiness

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Family / Monthly Transits
- Routes: `/community/family`, `/community/family/[id]`, `/community/transits`
- Related Files:
  - `src/app/community/transits/page.tsx`
  - `src/lib/community/birth-data-readiness.ts`
  - `src/lib/community/family-profile-completion.ts`
  - `src/app/api/community/family/route.ts`
  - `src/app/api/community/family/[id]/route.ts`
  - `src/lib/perennial/household-provisioning.ts`

---

## Goal

Fix the case where a member appears as profile-complete but still appears under:

```txt
1 member needs birth details
```

Observed example:

- `River Ashton` appears in the transit-access list.
- `River Ashton` also appears in the incomplete birth-details section.
- One duplicate row has complete text fields but missing `birth_lat` / `birth_lng`.
- Another duplicate row has usable coordinates.

## Current Problem

Profile completion and transit readiness use different rules:

- Profile completion checks human-visible fields like birth date, time, city, country, and relationship.
- Monthly transit readiness requires coordinate fields too:

```txt
date_of_birth
birth_time
birth_city
birth_country
birth_lat
birth_lng
```

The UI becomes confusing when duplicate self rows exist or when city text exists without coordinates.

## Required Behavior

- A community account should not end up with duplicate canonical self rows.
- Existing duplicate self rows should be detected and safely repaired.
- Monthly transit readiness must continue using `computeBirthDataReadiness(...)`.
- Missing coordinates should be explained precisely:

```txt
Select the birth city from suggestions to save coordinates.
```

instead of the generic:

```txt
Add birth date, time and place to enable monthly transits.
```

## Implementation Notes

- Audit all write paths that create/update `community_family_members` self rows.
- Prefer upserting the existing self row instead of inserting a new row.
- If a schema guard is needed, add an explicit canonical self flag and enforce one canonical self profile per `member_id`.
- When repairing duplicates, keep the row with the strongest data:
  - valid `birth_lat` / `birth_lng`
  - linked `user_id`
  - saved natal/report references
  - latest meaningful profile data
- Do not delete saved `astro_ai_responses` artifacts.
- Do not use profile completion percentage as a chart/transit readiness gate.

## Acceptance Criteria

- [ ] Duplicate self rows can be identified with a repeatable query.
- [ ] Existing duplicate self rows can be merged or repaired without losing saved report/chart references.
- [ ] A profile with city/country text but missing coordinates shows coordinate-specific guidance.
- [ ] River Ashton no longer appears both as transit-eligible and incomplete.
- [ ] Future self-profile writes update the canonical self row instead of creating a duplicate.
- [ ] Profile completion and chart/transit readiness remain clearly separated.
- [ ] No astrology calculation or report-generation logic is changed.

## QA Checklist

- [ ] Load `/community/transits` for a household with duplicate self rows.
- [ ] Confirm duplicate self rows do not produce contradictory cards after repair.
- [ ] Edit a birth place manually without selecting a suggestion.
- [ ] Confirm the UI asks the user to select a suggested city to save coordinates.
- [ ] Select a city suggestion and save.
- [ ] Confirm the member becomes transit-ready.

## Out Of Scope

- No astrology formula changes.
- No AI prompt changes.
- No redesign of family cards.
- No saved-report lifecycle rewrite.
