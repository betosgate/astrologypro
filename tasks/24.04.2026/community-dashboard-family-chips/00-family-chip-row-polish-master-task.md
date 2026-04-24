# Master Task - Community Dashboard Family Chip Row Polish

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Top Summary UX
- Page Route: `/community`

---

## Goal

Polish the family-member chip row in the top summary card on the community dashboard so it feels intentional, readable, and scalable.

## Problems To Fix

- The primary member (`Self`) can appear twice
- Unknown relationship values render as weak generic badges like `Member`
- Chip ordering is not intentional enough
- The row feels dense and competes with the top metadata row
- The `Family Members` text label is unnecessary if the icon already communicates the row purpose

## Agreed UX Direction

- Remove duplicate `Self`
- Order chips as:
  - `Self`
  - `Spouse` / `Partner`
  - children
  - others
- Remove the visible `Family Members` text label
- Keep the people icon as the row anchor
- Add tooltip to the icon for clarity
- If relationship is missing, show a distinct missing-state treatment rather than a generic `Member` badge
- Give the chip row more breathing room under the top metadata row

## Task Breakdown

1. `01-audit-family-chip-data-source-and-deduplication.md`
2. `02-fix-duplicate-self-chip.md`
3. `03-add-deterministic-chip-ordering.md`
4. `04-improve-missing-relationship-chip-treatment.md`
5. `05-remove-family-members-label-and-use-icon-tooltip.md`
6. `06-adjust-chip-row-spacing-and-density.md`
7. `07-regression-and-qa-checklist.md`

## Acceptance Criteria

- [ ] The primary member is not duplicated
- [ ] Chip ordering is deterministic and matches the agreed order
- [ ] Missing relationship state is visually distinct and understandable
- [ ] The chip row is cleaner and less cramped
- [ ] The row still works across desktop and mobile

