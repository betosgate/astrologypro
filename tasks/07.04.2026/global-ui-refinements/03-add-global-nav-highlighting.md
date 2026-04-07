# Add Global Navigation Highlighting

## Objective
Implement a standardized visual indicator for the active route in the top navigation bar across multiple dashboards.

## Files To Read First
- `src/app/community/layout.tsx`
- `src/app/trainee/layout.tsx`
- `src/app/advocate/layout.tsx`
- `src/app/affiliate/layout.tsx`
- `src/components/dashboard/sidebar.tsx` (for reference of existing `isActive` logic)

## Exact Gap
The navigation links in the Community, Trainee, Advocate, and Affiliate layouts are static `Link` components. They do not change style (e.g., color or background) based on the current URL, leaving the user without a visual cue of their current location.

## Required Implementation
1. **Create Shared Component**: Use or create a `"use client"` NavLink component (ideally in `src/components/shared/nav-link.tsx`).
2. **Path Detection Logic**: Use `usePathname()` from `next/navigation`. A link should be considered active if `pathname === href` or (for deeper routes) if `pathname.startsWith(href)`. 
3. **Style Application**: 
   - Apply `bg-muted text-foreground` classes when the link is active.
   - Maintain the standard `text-muted-foreground hover:bg-muted hover:text-foreground` transitions for non-active states.
4. **Update Layouts**: Replace the direct `Link` maps in the affected layout files with the new logic.

## Acceptance Criteria
- Clicking a navigation link (e.g., "Library") correctly highlights that link with a background.
- Only one top-level link is highlighted at a time.
- The highlighting persists correctly after page refreshes.
- Highlighting works consistently across Community, Trainee, Advocate, and Affiliate portals.
