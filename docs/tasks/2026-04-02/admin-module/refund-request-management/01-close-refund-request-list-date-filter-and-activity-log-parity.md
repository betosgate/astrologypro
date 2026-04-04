# 01 Close Refund Request List Date Filter And Activity Log Parity

- Status: Done

## Why

Angular gives admins two operational capabilities that are still missing from the current Next list: filtering refund requests by submission date and opening the refund activity history for a specific request.

## Current Verified Gap

- Angular list includes date-range search on `createdAt`
- Angular list exposes an `Activity Logs` action
- Angular activity log action loads data from `refund-activity/refund-activity-log-list`
- Next `/admin/refunds` currently has no date-range filter UI
- Next `/admin/refunds` currently has no activity-log action

## Required Behavior

- Add a created-date range filter to `/admin/refunds` for `createdAt`
- Add an activity-log action per row
- Render activity items in a readable admin surface without disturbing the current preview and status-change flows

## Acceptance Criteria

- users can filter refund requests by created-date start and end date
- filtered results reflect the requested date window
- users can open activity logs for a refund request directly from the list
- activity logs show the recorded timeline for that refund request
- existing preview, status-change, and comments flows continue to work

## Verification Test Plan

1. Open `/admin/refunds`.
2. Apply a created-date range that should include a known refund request.
3. Confirm in-range rows remain visible and out-of-range rows are excluded.
4. Open the activity-log action for a refund request with known history.
5. Confirm the log entries render with readable status, actor, and time information.
6. Open preview and status-change from the same row and confirm those flows still work.
