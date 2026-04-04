# Master Task - Refund Request Management Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Refund Requests
- Status: Done
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/refund-request-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/refund-request-management`
- Primary Next Route:
  - `/admin/refunds`

## Objective

Close the remaining Angular-to-Next parity gaps for the Refund Requests admin module while preserving the stronger parts of the current Next experience.

## Current Product Truth

- The Next refund-request module already supports the main list, preview, comments, and status-change flows.
- The remaining verified gaps are:
  - created-date filtering on `createdAt`
  - refund execution from the refund-request module
  - activity-log access
  - preview and comment hydration compatibility with the real API response shape

## Child Tasks

1. `01-close-refund-request-list-date-filter-and-activity-log-parity.md`
2. `02-build-refund-request-refund-execution-flow.md`
3. `03-align-refund-request-preview-and-comment-hydration-semantics.md`

## Done Definition

- `/admin/refunds` supports created-date range filtering.
- users can launch refund execution from the refund-request list and complete the flow safely.
- users can view refund activity history from the refund-request list.
- preview and comment thread render correctly for real API responses returned by the existing endpoints.
- existing status-change and comment-add flows continue to work.

## Verification Gate

1. Validate created-date filtering returns the expected refund-request window.
2. Validate refund execution can be launched from a refund-request row and finishes with the expected success or failure feedback.
3. Validate activity logs open for a refund request and show recent entries in descending or intended order.
4. Validate preview opens with real detail data instead of a no-data state caused by response-shape mismatch.
5. Validate comments render and new comments append correctly after submission.
6. Validate status-change flow still works after the surrounding changes.

## Notion Ready Summary

Title: Refund Request Management parity

Summary:
The Next Refund Requests module already covers the main admin review flow, but it still misses a few operational behaviors carried by Angular: created-date filtering, direct refund execution, activity-log access, and safer detail/comment hydration against the API shapes actually used by the working Angular module.
