# Task 03 - Refine Family Card Copy By State

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Family Cards
- Dashboard Route: `/community`
- Primary File: `src/app/community/page.tsx`

---

## Objective

Make the family-member card copy match the real next step for each state.

## Desired State Model

### Incomplete profile

Show:

- `Profile incomplete`
- missing-field summary
- CTA: `Complete Profile ->`

### Complete profile, chart missing

Show:

- `Profile complete`
- helper text: `Ready to generate chart`
- CTA: `Generate Chart ->`

### Complete profile, chart ready

Show:

- `Profile complete`
- no corrective CTA

## Why This Matters

The current logic already distinguishes profile completion from chart generation, which is correct.

This task only improves the wording so the user immediately understands the next action.

## Constraints

- Do not change the underlying completion formula
- Do not make chart generation count toward profile completion
- Do not change chart-ready badge behavior in this task

## Acceptance Criteria

- [ ] Incomplete cards clearly read as incomplete
- [ ] Complete-without-chart cards clearly present chart generation as the next step
- [ ] Ready cards no longer look like they still need corrective action

