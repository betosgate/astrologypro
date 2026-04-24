# Task 03 - Regression And QA Checklist For Natal Chart Member Carousel

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / QA
- Page Route: `/community`

---

## Scenario 1 - No Chart Data

- [ ] Open `/community` for a user with no natal chart data
- [ ] Confirm the empty-state message still makes sense
- [ ] Confirm the empty-state CTA still works

## Scenario 2 - One Available Member Chart

- [ ] Open `/community` for a user with exactly one available natal chart
- [ ] Confirm the card still renders cleanly
- [ ] Confirm the carousel treatment does not feel broken or overbuilt for one item
- [ ] Confirm `View Full Chart` opens the correct chart

## Scenario 3 - Multiple Available Member Charts

- [ ] Open `/community` for a user with multiple available member charts
- [ ] Confirm the user can move between members
- [ ] Confirm the active member name/DOB/CTA stay in sync
- [ ] Confirm each member’s full-chart route is correct

## Scenario 4 - Layout

- [ ] Confirm desktop layout remains clean
- [ ] Confirm mobile layout remains usable
- [ ] Confirm the carousel does not overflow or crop important content

## Acceptance Criteria

- [ ] The natal charts dashboard card supports one and many member states cleanly
- [ ] Navigation between members works correctly
- [ ] Full-chart CTA correctness is preserved
- [ ] No unrelated astrology cards regress
