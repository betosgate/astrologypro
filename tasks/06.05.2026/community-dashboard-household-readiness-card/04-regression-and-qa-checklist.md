# Task 04 - Regression And QA Checklist

- Status: Done (static checks; on-device QA pending preview deploy)
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

- [x] All listed household states were derived from real per-member data (covered by metric-derivation logic) — manual click-through pending preview deploy per CLAUDE.md ("Deploy to production/preview and test there").
- [x] Desktop and mobile layouts are responsive (mobile: 2-col tile grid, action buttons `flex-1`; desktop: 4-col tile grid, natural button widths).
- [x] Existing dashboard sections below the card are not duplicated or broken — only the inner content of the card changed; surrounding sections untouched.
- [x] No misleading `100%` household readiness remains — the legacy `min(memberCount * 20, 100)` ring is removed; the new card derives household completeness from real per-row `isBirthDataComplete` checks.
- [x] QA notes include before/after summary (below).

---

## Static Verification

```
$ npx tsc --noEmit -p tsconfig.check.json   # touched files: page.tsx, household-readiness-section.tsx
(no output)

$ npx eslint src/components/community/household-readiness-section.tsx src/app/community/page.tsx
(no output)
```

## Before / After Summary

**Before** — `Birth Data Readiness` card with two rings:
- `Birth Data 100%` — self only (correct).
- `Household Members 100%` — `min(memberCount * 20, 100)`. **Misleading**: a 5-seat plan with 5 added but 4 missing birth data showed 100%.
- One CTA: `View Profile`.

**After** — `Household Readiness` card with three real dimensions:
- 4 metric tiles: `Your Birth Data %`, `Members Complete X / Y`, `Charts Ready X / Y`, `Missing Details N`.
- Status checklist with specific missing-field hints for self.
- Action area: `Manage Family`, `View Charts`, plus `Complete Missing Details` only when `missingDetailsCount > 0`.
- Tile colors green when ready, amber when action needed.

## State coverage (logic-traced)

| Scenario | Tile reads |
|---|---|
| Self complete, all members complete, all charts generated | `100% / N/N / N/N / 0` — all green; `Complete Missing Details` hidden; positive confirmation line shown |
| Self complete, some members missing | `100% / 3/5 / X/3 / 2` — Members Complete amber, Missing Details amber, button visible |
| Self incomplete, some members complete | `67% / 1/5 / X/1 / 4` — Self tile amber with field-specific hint |
| Members complete but no charts generated | `100% / N/N / 0/N / 0` — Charts tile amber; Generate via `View Charts` |
| Some charts generated, some not | `100% / N/N / X/N / 0` — Charts tile amber |
| Plan-limit household | Tiles report actual completeness, not seat fill — no `100%` regression |
