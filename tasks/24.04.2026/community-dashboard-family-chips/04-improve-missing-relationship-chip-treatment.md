# Task 04 - Improve Missing Relationship Chip Treatment

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Top Summary UX
- Page Route: `/community`

---

## Objective

Replace weak generic relationship badges like `Member` with a more intentional missing-state treatment.

## UX Direction

When a family member does not have a relationship value:

- do not use the generic `Member` badge
- show a distinct visual treatment that signals missing profile info
- use an info tooltip to explain the state

## Recommended Behavior

- Keep the chip visible
- Replace the relationship badge with a subtle warning/missing-state badge such as:
  - `Missing role`
  - or another short label consistent with the design system
- Add a tooltip explaining:
  - `Relationship is missing for this member`

## Constraints

- Keep the treatment compact
- Do not make the chip look like an error banner
- Do not overload the dashboard with warning colors

## Acceptance Criteria

- [ ] Missing relationship no longer shows as `Member`
- [ ] Missing relationship is visually distinct from normal relationship badges
- [ ] Tooltip explains the missing state clearly

