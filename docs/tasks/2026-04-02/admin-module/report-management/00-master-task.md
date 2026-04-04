# Master Task - Report Management Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Report
- Status: Done
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/report-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/report-management`
- Primary Next Route:
  - `/admin/reports`

## Objective

Close the remaining Angular-to-Next parity gaps for the Report admin module by enabling the generic list capabilities that the Next page is not yet using.

## Current Product Truth

- The Next reports page already uses the correct backend list flow.
- The remaining verified gaps are:
  - report-date range filtering on `clicked_on`
  - preview access from the list
  - preview visibility for row-backed IP metadata

## Child Tasks

1. `01-close-report-list-date-filter-parity.md`
2. `02-close-report-preview-ip-metadata-parity.md`

## Done Definition

- `/admin/reports` supports date-range filtering on `clicked_on`.
- users can open preview from the report list.
- preview shows the key click context already available in the row, including IP metadata fields when present.
- existing search and sorting continue to work.

## Verification Gate

1. Validate report-date filtering returns the expected result window.
2. Validate preview opens from a report row.
3. Validate preview shows quarter, schedule, clicked time, and available IP metadata.
4. Validate search and sorting still behave correctly after the config changes.

## Notion Ready Summary

Title: Report Management parity

Summary:
The Next Report module already has the correct list foundation, and the generic list system already supports the missing behaviors. The remaining work is mainly page-level configuration: add clicked-time date filtering and expose the row preview with the IP metadata Angular already shows.
