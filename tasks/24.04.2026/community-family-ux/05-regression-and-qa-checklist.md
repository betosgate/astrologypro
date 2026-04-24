# Task 05 - Regression And QA Checklist For Family Card Completion UX

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / QA
- Dashboard Route: `/community`
- Family Route: `/community/family`

---

## Scenario 1 - One Missing Field

- [ ] Create or use a family member missing exactly one required profile field
- [ ] Open `/community`
- [ ] Confirm the card shows `Profile incomplete`
- [ ] Confirm the card shows the exact missing field
- [ ] Click `Complete Profile ->`
- [ ] Confirm `/community/family` opens the correct member edit context

## Scenario 2 - Multiple Missing Fields

- [ ] Use a family member missing two or more required fields
- [ ] Confirm the dashboard card shows a compact missing summary
- [ ] Confirm the summary does not overflow the card layout

## Scenario 3 - Complete Profile, No Chart

- [ ] Use a family member with 100% profile completion and no natal chart
- [ ] Confirm the card shows `Profile complete`
- [ ] Confirm the helper copy indicates chart generation is the next step
- [ ] Confirm the CTA is `Generate Chart ->`

## Scenario 4 - Chart Ready

- [ ] Use a family member with 100% profile completion and a saved natal chart
- [ ] Confirm the card shows chart-ready state
- [ ] Confirm no misleading corrective CTA is shown

## Scenario 5 - Existing Family Page Flows

- [ ] Confirm add member still works
- [ ] Confirm edit still works
- [ ] Confirm remove still works
- [ ] Confirm chart generation entry points still work

## Acceptance Criteria

- [ ] Dashboard family cards communicate the next correct action clearly
- [ ] Missing-field visibility is improved for incomplete members
- [ ] Deeplink-to-edit behavior works without regressing family page flows
