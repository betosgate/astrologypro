# Task 01 - Audit Family Card State Model And Missing Fields

- Status: Planned
- Priority: P1
- Area: Perennial / Community Family / Audit
- Dashboard Route: `/community`
- Family Route: `/community/family`

---

## Objective

Confirm the current family-card state model and document which missing-field labels are already available for rendering.

## What To Verify

1. `calcFamilyProfileCompletion(...)` returns:
   - `percent`
   - `missing`

2. The dashboard family cards already compute:
   - `completionPct`
   - `profileComplete`
   - `hasNatalChart`

3. The current state split is:
   - incomplete profile -> `Complete Profile ->`
   - complete profile + no chart -> `Generate Chart ->`
   - complete profile + chart -> ready state

4. The edit screen on `/community/family` can be opened in a way that can be targeted from a CTA

## Expected Finding

The implementation should not need a backend change because the required missing-field labels are already available from the shared completion helper.

## Deliverable

A short handoff note in the PR or implementation summary confirming:

- the exact existing card-state conditions
- the source of missing-field labels
- whether edit deeplinking can be done with frontend route state only

## Acceptance Criteria

- [ ] The card state model is documented
- [ ] The missing-field source is documented
- [ ] The implementation path is clear enough that Task 02-04 do not need to re-decide behavior

