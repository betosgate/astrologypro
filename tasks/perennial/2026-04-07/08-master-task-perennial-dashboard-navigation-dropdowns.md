# Master Task - Perennial Dashboard Navigation Dropdowns - 2026-04-07

- Status: Planned
- Priority: P1
- Owner: Frontend
- Scope: Sidebar navigation logic, Dropdown/Accordion components, Product menu integration
- Estimate: 1-2 days
- Task File: `tasks/perennial/2026-04-07/08-master-task-perennial-dashboard-navigation-dropdowns.md`

## Objective

Enhance the Perennial dashboard navigation (left-side sidebar) by adding a multi-level "Product" menu. This allows admins to access both Category and Product Management from a single grouped navigation item.

## Child Tasks

1. `08.1-navigation-dropdown-component-and-logic.md`
2. `08.2-product-dropdown-styling-and-integration.md`

## Required Outcome

1. A "Product" item in the sidebar with a chevron icon (`v`).
2. When the user interacts with "Product", it reveals two sub-items:
    - **Product Category**: Links to the Category Management list (Task 07.3).
    - **Product Management**: Links to the Product Management list (Task 06.3).
3. The menu state (open/closed) should be preserved or clearly indicated.
4. Perfect alignment with the rest of the left-side sidebar items.

## Done Definition

- The "Product" menu exists in the new left-sidebar layout.
- Clicking/Interacting with "Product" reveals the sub-menu.
- Sub-items "Product Category" and "Product Management" are clickable and route correctly.
- Active states are applied to both the parent and child items when on the respective pages.
- UI styling matches the shared reference image (dark theme, clean typography).

## Verification Gate

1. Open the Perennial dashboard.
2. Locate the "Product" item in the sidebar.
3. Verify it has a chevron icon.
4. Open the menu and click "Product Category" — confirm navigation.
5. Open the menu and click "Product Management" — confirm navigation.
6. Verify the sidebar remains perfectly aligned and styled.

## Notion Ready Summary

P1 Sidebar Enhancements: Implementation of multi-level navigation for the Perennial dashboard. Grouping "Product Category" and "Product Management" under a parent "Product" item with dropdown/accordion logic, ensuring a high-end and organized administrative interface.
