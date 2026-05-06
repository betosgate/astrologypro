# Task 04 - Regression And QA Checklist

- Status: Planned
- Priority: P1
- Area: QA / Community Dashboard
- Route: `/community`
- Depends On:
  - `02-redesign-household-readiness-card-ui.md`
  - `03-wire-household-readiness-metrics-and-actions.md`

---

## Goal

Verify the redesigned readiness card is accurate, responsive, and does not regress nearby dashboard sections.

## Test Scenarios

Test these household states:

- Self complete, all members complete, all charts generated.
- Self complete, some members missing birth details.
- Self incomplete, some members complete.
- No generated natal charts yet, but members have complete birth data.
- Some generated natal charts, some not generated.
- Household at plan member limit.

## Required Checks

- The card title and labels are clear.
- The card does not imply all household data is complete unless it actually is.
- `Missing Details` count matches the family data.
- `Charts Ready` count matches generated/saved chart records.
- `Complete Missing Details` only appears when needed.
- `Manage Family` opens `/community/family`.
- `View Charts` opens the intended chart route.
- The lower `Your Circle` section still renders normally.

## Responsive Checks

Verify these viewport widths:

- 375px mobile
- 768px tablet
- 1440px desktop

Confirm:

- no text overlap
- no button overflow
- no large empty block inside the card
- metric tiles remain readable
- action buttons wrap cleanly on mobile

## Commands

Run the relevant project checks after implementation:

```txt
npx eslint <changed-files>
npx tsc --noEmit --pretty false
```

If the full TypeScript check fails because of existing unrelated errors, document that clearly and list whether any new errors point to the changed files.

## Acceptance Criteria

- [ ] All listed household states were manually checked or covered by tests.
- [ ] Desktop and mobile layouts are verified.
- [ ] Existing dashboard sections below the card are not duplicated or broken.
- [ ] No misleading `100%` household readiness remains.
- [ ] QA notes include screenshots or a short before/after summary.
