# Task - Community Sidebar Product, Profile, and Account Icon Differentiation - 2026-05-08

- Status: Planned
- Priority: P2
- Owner: Frontend
- Scope: Community sidebar navigation polish
- Route: `/community`
- Task File: `tasks/08.05.2026/sidebar-navigation-icon-and-account-polish/01-community-sidebar-product-profile-account-icons.md`

## Objective

Improve the Perennial community sidebar by giving the Product menu a visible leading icon and differentiating the Profile and My Account entries.

## Current Problem

The Product dropdown appears without a leading icon, which makes it visually inconsistent with the rest of the sidebar. Profile and My Account use similar person-style iconography, making them hard to distinguish at a glance.

## Required Outcome

1. Product parent menu should show a product/package-style icon.
2. Profile should use an identity/profile-specific icon.
3. My Account should use an account/settings-style icon.
4. Sidebar spacing, active states, and existing dropdown behavior should remain stable.

## Implementation Notes

- Review `src/app/community/layout.tsx`.
- Review `src/components/shared/nav-dropdown.tsx` if icon rendering needs adjustment.
- Keep labels unchanged unless product requirements say otherwise.
- Avoid changing route targets.

## Acceptance Criteria

- [ ] Product row includes a visible icon aligned with other sidebar items.
- [ ] Profile and My Account use visually distinct icons.
- [ ] Product dropdown still expands and routes child items correctly.
- [ ] Mobile navigation is not regressed.
- [ ] Lint passes for touched files.

## Verification Gate

1. Open `/community`.
2. Confirm Product has a leading icon.
3. Confirm Profile and My Account no longer look visually identical.
4. Open Product dropdown and confirm child links still render.
5. Run targeted lint.
