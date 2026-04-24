# Task 03 - Add Deterministic Chip Ordering

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Top Summary UX
- Page Route: `/community`

---

## Objective

Make the chip row order predictable and aligned with the product intent.

## Required Ordering

1. `Self`
2. `Spouse` / `Partner`
3. children
4. others

## Implementation Notes

- Define a small priority map for relationship categories
- Normalize common labels such as:
  - `spouse`
  - `partner`
  - `son`
  - `daughter`
  - `child`
- Keep unknown relationships after the known household roles

## Acceptance Criteria

- [ ] `Self` is first
- [ ] `Spouse` / `Partner` comes next
- [ ] Children come after spouse/partner
- [ ] Remaining chips follow after those groups
- [ ] Ordering is deterministic across refreshes

