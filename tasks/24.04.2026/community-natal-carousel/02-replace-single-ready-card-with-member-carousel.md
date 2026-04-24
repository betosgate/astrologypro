# Task 02 - Replace Single Ready Card With Member Carousel

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Astrology / Frontend
- Page Route: `/community`

---

## Goal

Replace the current single ready-state natal chart card with a member-carousel UI.

## Current UI To Replace

The current ready-state pattern is a single summary block that shows:

- chart-ready badge
- member name
- DOB
- `View Full Chart`

This should be replaced by a member-carousel experience when chart data exists for one or more members.

## Implementation Notes

Target component:

- `src/components/community/astro-charts-section.tsx`

Expected behavior:

- render member cards inside a carousel-like interface
- support multiple members cleanly
- preserve a clear `View Full Chart` action for the currently active member
- remain readable on smaller screens

Do not:

- introduce a visually heavy or complex carousel library unless clearly needed
- break existing loading, failed, or empty states
- rewrite unrelated Monthly Transit behavior in the same task

## Acceptance Criteria

- [ ] The natal-chart ready-state is no longer a single static member card
- [ ] Multiple members can be browsed in the dashboard card
- [ ] The active member’s chart CTA still works
- [ ] Existing loading/error/empty states remain intact
