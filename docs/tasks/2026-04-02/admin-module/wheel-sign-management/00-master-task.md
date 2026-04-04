# Master Task - Wheel Sign Management Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Wheel Sign
- Status: Planned
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/wheel-sign-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/wheel-sign-management`
- Primary Next Routes:
  - `/admin/astrology/wheel-signs`
  - `/admin/astrology/wheel-signs/add`
  - `/admin/astrology/wheel-signs/edit/[id]`

## Objective

Close the remaining Angular-to-Next parity gaps for the Wheel Sign admin module, focusing on the list search and filter behaviors and the save semantics that still block trustworthy create and edit behavior.

## Current Product Truth

- The Next wheel-sign module already has the correct main screens in place.
- The remaining verified gaps are:
  - sign-search parity on the list
  - start-date range filtering
  - row view or preview parity
  - missing `assets` upload in the form
  - date-time combination and rehydration semantics
  - update payload compatibility for the wheel-sign edit flow

## Child Tasks

1. `01-close-wheel-sign-list-search-date-filter-and-view-parity.md`
2. `02-close-wheel-sign-form-assets-and-time-entry-parity.md`
3. `03-align-wheel-sign-date-time-hydration-and-submit-semantics.md`

## Done Definition

- `/admin/astrology/wheel-signs` supports the working search and start-date filter behaviors.
- admins can open the row view or preview flow that Angular currently exposes.
- add and edit forms support theme image, icon image, and assets consistently.
- start and end date-time values save and reopen correctly.
- update requests succeed with the payload shape the wheel-sign module expects.

## Verification Gate

1. Validate sign search returns expected wheel-sign rows.
2. Validate start-date range filtering returns the expected result window.
3. Validate row view or preview opens successfully from the list.
4. Validate add and edit support theme image, icon image, and assets.
5. Validate start and end date-time save correctly and reopen correctly.
6. Validate editing an existing record succeeds and persists the changes.

## Notion Ready Summary

Title: Wheel Sign Management parity

Summary:
The Next Wheel Sign module already has the main route shell and most list columns, but the important remaining work is around real admin behavior: sign search, start-date filtering, row view parity, restoring the missing `assets` upload, and matching Angular’s date-time and update-submit semantics so create and edit both behave reliably.
