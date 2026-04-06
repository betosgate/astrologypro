# Improve Perennial Dashboard Visual Hierarchy And Member Journey - 2026-04-06

- Status: Planned
- Priority: P2
- Owner: Frontend
- Scope: visual hierarchy, dashboard information density, CTA prioritization, empty/loading states, section clarity
- Estimate: 1.5-3 days
- Task File: `tasks/perennial/2026-04-06/15-dashboard-visual-hierarchy-and-member-journey.md`

## Goal

Enhance the current Perennial dashboard so it feels more guided, more premium, and more action-oriented for members using the `/community` home screen.

## Child Tasks

1. `15.1-dashboard-top-summary-and-membership-hierarchy.md`
2. `15.2-dashboard-empty-states-and-next-actions.md`
3. `15.3-dashboard-section-grouping-and-card-spacing.md`
4. `15.4-dashboard-mobile-hierarchy-and-responsive-flow.md`

## Reference

This task is based on the current Perennial dashboard screen shared by product review for the live `/community` implementation.

## Verified Current UI Truth

- The dashboard already contains the core sections needed for a Perennial member:
  - membership card
  - profile completion
  - natal chart status
  - monthly transit status
  - astro overview
  - rituals
  - family and relationships
  - explore cards
  - Mystery School upgrade CTA
- The current screen is feature-rich, but several sections compete visually.
- Some cards are informative but do not strongly guide the member toward the best next action.
- Loading and empty states are present, but the dashboard still feels more like a stacked module list than a deliberately prioritized member journey.

## User-Visible Problem

Members can access all the right areas, but the dashboard does not yet fully communicate:

- what matters most right now
- what should be done next
- what is incomplete versus ready
- which actions are primary versus secondary

## Required Behavior

1. The first screen area must clearly communicate membership state and next best actions.
2. Profile, chart, transit, ritual, and family sections must feel connected rather than visually fragmented.
3. Empty states must encourage action instead of only reporting missing data.
4. CTA hierarchy must be intentional so upgrade, ritual, family, and profile actions do not compete unnecessarily.
5. Section spacing, headings, and card emphasis must make the dashboard easier to scan on desktop and mobile.

## Tasks

1. Review the current dashboard layout in `src/app/community/page.tsx` and identify the highest-priority member actions.
2. Rework the top-of-page hierarchy so membership, completion, and chart/transit readiness are more clearly prioritized.
3. Improve the empty-state copy and CTA framing for:
   - natal chart
   - monthly transit
   - rituals
   - family members
4. Refine card sizing, spacing, and section grouping so the dashboard reads as guided flows instead of unrelated blocks.
5. Reassess the placement and emphasis of the Mystery School upgrade banner so it feels intentional and not intrusive.
6. Improve quick-action discoverability for the most important Perennial journeys:
   - complete profile
   - generate chart
   - manage family
   - create ritual
   - open transits
   - open sacred texts
7. Validate responsive behavior so the information hierarchy still works on smaller screens.

## Acceptance Criteria

- dashboard feels easier to scan within the first screen area
- primary member actions are visually clearer than secondary actions
- empty states guide the user to the next step more effectively
- section grouping feels intentional and less crowded
- upgrade CTA is visible without overpowering the core member workflow
- desktop and mobile layouts both preserve hierarchy and usability

## Verification Test Plan

1. Open the Perennial dashboard as a member with minimal profile completion and verify the page clearly suggests the next steps.
2. Open the dashboard as a more complete member and verify ready-state cards feel informative rather than repetitive.
3. Verify natal chart, transit, ritual, and family empty states each point to a useful action.
4. Verify the Mystery School CTA remains visible but does not overwhelm the core dashboard content.
5. Verify the layout remains readable and well-prioritized on smaller screen widths.

## Implementation Notes

Likely primary file:

- `src/app/community/page.tsx`

Likely supporting components:

- `src/components/community/*`

If card structure is too monolithic in the page file, split the dashboard into clearer section components before tuning layout and content hierarchy.

## Notion Summary

P2 dashboard UX gap: the Perennial dashboard already contains the right modules, but it still needs a focused visual-hierarchy and member-journey pass so members immediately understand status, next actions, and the most important paths through the experience.
