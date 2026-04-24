# Task 06 - Adjust Chip Row Spacing And Density

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Layout Polish
- Page Route: `/community`

---

## Objective

Give the chip row more breathing room so it no longer competes with the top metadata row.

## Desired Layout

- top metadata row:
  - plan
  - status
  - member since
  - journey
- separate chip row below it
- divider below the chip row
- action buttons after the divider

## Implementation Notes

- Increase vertical spacing between the metadata row and the chips row
- Increase spacing between the chips row and the divider
- Keep chips on a wrapped row instead of over-compressing them
- Preserve a clean mobile wrap behavior

## Acceptance Criteria

- [ ] The chip row feels visually separated from the top metadata row
- [ ] The row is less cramped on desktop
- [ ] The chip row wraps cleanly on smaller screens

