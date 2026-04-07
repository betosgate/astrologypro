# Global UI Refinements - AI Execution Master Task

## Objective
Standardize and fix global UI deficiencies discovered across multiple user roles. Specifically, ensure all authenticated user dashboards have a functional Logout button logically placed in the desktop header, and ensure consistency in the editability of user profile pages across portals.

## Canonical Folder
- Repo path: `tasks/07.04.2026/global-ui-refinements`

## Why This Pack Exists
While researching UI discrepancies in the Mystery School/Community module, it was discovered that several role dashboards (Community, Trainee, Advocate, Affiliate) completely lack a desktop "Sign Out" button, while others (Admin, Portal, Dashboard) have it. Additionally, the Community Profile page uses static text rather than standard editable form components. This isolated task pack aims to centralize these fixes under one global UI refinement initiative, preventing duplicate tasks in individual feature folders.

## Global Working Rules
- Do not redesign the layout from scratch; mimic the existing working structures (e.g., using `PortalLogoutButton` or existing patterns).
- Use proper RouteTracker and server session safeguards, but focus heavily on layout `.tsx` and page `.tsx` updates.
- Keep `community_members` and related `users` / auth structures intact.

## Execution Order
1. `01-add-global-logout-dropdown.md`
2. `02-refactor-community-profile.md`
3. `03-add-global-nav-highlighting.md`

## Dependency Rules
- Always update `99-requirements-traceability-checklist.md` when new tasks are added to this folder.

## Standard Per-Task Reading Order
1. Read `Objective` and `Exact Gap`.
2. Read `Files To Read First`.
3. Implement the `Required Implementation`.
4. Validate against `Acceptance Criteria`.
