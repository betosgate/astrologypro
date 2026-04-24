# Task 07 - Regression And QA Checklist For Family Chip Row Polish

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / QA
- Page Route: `/community`

---

## Scenario 1 - Primary Member Deduplication

- [ ] Open `/community` with a primary member who previously rendered twice
- [ ] Confirm the `Self` chip appears only once

## Scenario 2 - Ordering

- [ ] Confirm `Self` appears first
- [ ] Confirm `Spouse` / `Partner` appears next when present
- [ ] Confirm children appear after spouse/partner
- [ ] Confirm other relationships follow afterward

## Scenario 3 - Missing Relationship

- [ ] Use a member with no relationship value
- [ ] Confirm the chip does not show `Member`
- [ ] Confirm the missing-state treatment is visible
- [ ] Confirm the tooltip explains the issue

## Scenario 4 - Label Removal

- [ ] Confirm the visible `Family Members` text label is removed
- [ ] Confirm the people icon remains
- [ ] Confirm the icon tooltip is present and readable

## Scenario 5 - Layout Density

- [ ] Confirm the chip row has more vertical breathing room
- [ ] Confirm the row no longer feels crowded against the metadata row
- [ ] Confirm chips wrap correctly on smaller screens

## Acceptance Criteria

- [ ] The top summary card is cleaner and easier to scan
- [ ] Chip row polish does not regress action buttons or metadata display
- [ ] Mobile and desktop both remain usable
