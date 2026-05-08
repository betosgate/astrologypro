# Task - Sidebar Chevron State Icon Polish - 2026-05-08

- Status: Planned
- Priority: P2
- Owner: Frontend
- Scope: Admin sidebar, Diviner/dashboard sidebar, collapsible navigation indicators
- Routes: `/admin/*`, `/dashboard/*`
- Task File: `tasks/08.05.2026/sidebar-navigation-icon-and-account-polish/00-sidebar-chevron-state-icon-polish.md`

## Objective

Normalize collapsible sidebar indicator icons so expanded menu groups use an upward chevron and collapsed menu groups use a right-facing chevron.

## Current Problem

Some sidebar menus use a down chevron for expanded state or rotate a down chevron to represent collapsed state. This creates an inconsistent visual language across admin and dashboard navigation.

## Required Outcome

1. Expanded menu groups should show `ChevronUp`.
2. Collapsed menu groups should show `ChevronRight`.
3. Parent menu rows and nested dropdown rows should use the same visual state pattern.
4. Existing active, hover, and text styling should remain unchanged.

## Implementation Notes

- Review `src/components/admin/admin-sidebar.tsx`.
- Review `src/components/dashboard/sidebar.tsx`.
- Replace rotated/down chevron state indicators with explicit icons where appropriate.
- Remove unused icon imports after the icon swap.

## Acceptance Criteria

- [ ] Admin sidebar group headers show `ChevronUp` when open.
- [ ] Admin sidebar nested dropdown items show `ChevronUp` when open.
- [ ] Dashboard sidebar dropdown items show `ChevronUp` when open.
- [ ] Collapsed menu groups continue to show `ChevronRight`.
- [ ] No unrelated sidebar layout or route changes are introduced.
- [ ] Lint passes for touched sidebar files.

## Verification Gate

1. Open an admin route with collapsible sidebar groups.
2. Expand and collapse multiple groups.
3. Open a dashboard route with collapsible sections.
4. Confirm expanded state uses up chevron and collapsed state uses right chevron.
5. Run targeted lint on touched files.
