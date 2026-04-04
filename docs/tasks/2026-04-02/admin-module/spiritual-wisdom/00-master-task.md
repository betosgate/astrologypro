# Master Task - Spiritual Wisdom Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Spiritual Wisdom
- Status: Done
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/spiritual-wisdom`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/spiritual-wisdom`
- Primary Next Routes:
  - `/admin/content/spiritual-wisdom`
  - `/admin/content/spiritual-wisdom/add`
  - `/admin/content/spiritual-wisdom/edit/[id]`

## Objective

Close the remaining Angular-to-Next parity gap for the Spiritual Wisdom module while recognizing that the current Next module is already more complete than the Angular source in its core CRUD behavior.

## Current Product Truth

- The Next Spiritual Wisdom module already provides working list, add, and edit routes.
- The Angular add form is currently a stub and does not provide a real authoring flow.
- The Angular list’s preview/edit button wiring is not active.
- The only verified parity gap worth carrying forward is date-range filtering on the list.

## Child Tasks

1. `01-close-spiritual-wisdom-date-filter-parity.md`

## Done Definition

- `/admin/content/spiritual-wisdom` supports created-date and updated-date range filtering.
- existing title search, status filtering, row-level actions, add flow, and edit flow continue to work.

## Verification Gate

1. Validate created-date filtering returns the expected result window.
2. Validate updated-date filtering returns the expected result window.
3. Validate title search and status filtering still work after the list upgrade.
4. Validate row-level edit, delete, and status toggle still work.

## Notion Ready Summary

Title: Spiritual Wisdom parity

Summary:
The Next Spiritual Wisdom module is already more complete than the current Angular source. The only reliable parity gap still worth carrying forward is list date-range filtering, because Angular exposes created and updated date searches while its add form and edit/preview wiring are otherwise incomplete.
