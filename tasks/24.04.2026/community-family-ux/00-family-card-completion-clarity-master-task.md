# Master Task - Family Card Completion Clarity And Next Action UX

- Status: Planned
- Priority: P1
- Area: Perennial / Community Family / Dashboard UX
- Dashboard Route: `/community`
- Family Route: `/community/family`

---

## Goal

Make the family-member cards on the community dashboard communicate the next correct action clearly:

- incomplete profile -> show what is missing and send the user into member completion
- complete profile but no chart -> show chart generation as the next step
- complete profile with chart -> show ready state only

## Why This Task Exists

The current completion logic is already correct in one important way:

- profile completion is separate from chart generation

But the UX is still vague for incomplete members because the card only shows a percent and `Complete Profile ->` without telling the user which field is missing.

This makes states like `84%` feel ambiguous even when only one required field is missing.

## Scope

This bundle is primarily frontend.

No backend contract change is required if implementation reuses the existing `completion.missing` array produced by `calcFamilyProfileCompletion(...)`.

## Task Breakdown

1. `01-audit-family-card-state-model-and-missing-fields.md`
   Lock the current state model and identify which missing labels are already available.

2. `02-show-missing-field-summary-on-incomplete-family-cards.md`
   Add a short missing-field summary to incomplete cards on `/community`.

3. `03-refine-family-card-copy-by-state.md`
   Improve status copy so incomplete, ready-to-generate, and chart-ready states read clearly.

4. `04-deeplink-incomplete-member-cta-to-edit-context.md`
   Make the incomplete CTA take the user to the exact member edit context on `/community/family`.

5. `05-regression-and-qa-checklist.md`
   Verify incomplete, complete-without-chart, and chart-ready behavior.

## Acceptance Criteria

- [ ] Incomplete family-member cards show a short missing-field hint
- [ ] Complete family-member cards without charts emphasize `Generate Chart` as the next action
- [ ] Complete family-member cards with charts do not show misleading corrective CTAs
- [ ] The incomplete CTA takes the user into the correct member edit context

