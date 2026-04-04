# Master Task - Assignment Notification Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Assignment Notification
- Status: Done
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/assignment-notification`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/assignment-notification`
- Primary Next Route:
  - `/admin/training/notifications`

## Objective

Close the remaining Angular-to-Next parity gaps for the Assignment Notification admin module, focusing on preview and filtering behavior for assignment submission notifications.

## Current Product Truth

- The Next notification page already covers the base list route and main columns.
- The remaining verified gaps are:
  - preview with assignment answer details
  - created-date range filtering
  - lesson-name autocomplete style search parity

## Child Tasks

1. `01-close-assignment-notification-preview-parity.md`
2. `02-close-assignment-notification-filter-parity.md`

## Done Definition

- `/admin/training/notifications` supports preview for a notification row.
- preview exposes assignment answer entries and the same core metadata Angular admins inspect.
- created-date filtering works on `createdon_datetime`.
- lesson search behavior is upgraded to the intended operational UX if plain text search is not sufficient.
- existing name, email, lesson, sorting, and pagination behavior continues to work.

## Verification Gate

1. Validate preview works from the list.
2. Validate preview shows assignment answer entries correctly.
3. Validate created-date filtering returns the expected result window.
4. Validate lesson search remains practical for large notification sets.
5. Validate existing name/email/lesson text search still works after filtering upgrades.

## Notion Ready Summary

Title: Assignment Notification parity

Summary:
The Next Assignment Notification page already covers the base notification list, but it still misses Angular’s row preview and created-date filtering. The most important remaining work is giving admins a fast way to inspect submitted assignment answers directly from the list and preserving the practical lesson-search workflow.
