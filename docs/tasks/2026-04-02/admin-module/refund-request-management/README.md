# Refund Request Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Refund Requests
- Angular Source Route:
  - `admin-dashboard/refund`
- Next Route:
  - `/admin/refunds`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/refund-request-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/refund-request-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Refund Requests`.

The Next refund-request module already covers the core list, preview, comments, and status-change workflows. The remaining work is concentrated in four places: created-date filtering, actual refund execution from the refund-request module, activity-log visibility, and response-shape compatibility for preview and comments.

## Verified Current Comparison Summary

### Already Implemented In Next

- refund request list route at `/admin/refunds`
- list uses:
  - `refund-processing/refund-processing-list`
  - `refund-processing/refund-processing-list-count`
- list supports:
  - request number search
  - request type search
  - customer text search
  - refund status filtering
  - sorting
- list already exposes:
  - preview action
  - status-change action
- preview already attempts to load:
  - refund details from `refund-processing/refund-request-list-details`
  - comment thread from `refund-processing/fetch-refund-request-comment-list-details`
- preview already supports adding a comment
- status-change dialog already supports status selection and required note entry

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list supports created-date range filtering on `createdAt`
- Angular list exposes a dedicated Refund action using `refund-processing/fetch-refund-details`
- Angular list exposes Activity Logs using `refund-activity/refund-activity-log-list`
- Angular detail preview reads refund detail payload from `res.results`
- Angular comments flow reads comment payload from `res.results`

## Recommended Execution Order

1. `01-close-refund-request-list-date-filter-and-activity-log-parity.md`
2. `02-build-refund-request-refund-execution-flow.md`
3. `03-align-refund-request-preview-and-comment-hydration-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/refund-request/refund-request-routing.module.ts`
- `src/app/admin-dashboard/refund-request/refund-request/refund-request.component.ts`
- `src/app/admin-dashboard/refund-request/refund-request-preview/refund-request-preview.component.ts`
- `src/app/admin-dashboard/refund-request/refund-request-comment-section-admin/refund-request-comment-section-admin.component.ts`
- `src/app/admin-dashboard/refund-request/refund-user/refund-user.component.ts`

### Next

- `src/app/(admin)/admin/refunds/page.tsx`

## Notes

- This folder is the canonical task set for this module.
- No separate task is included for request-number, request-type, or refund-status filtering because Next already covers those behaviors.
- Customer-name autocomplete is not included as a required parity task at this stage because the current text search may already be sufficient unless product testing proves otherwise.
