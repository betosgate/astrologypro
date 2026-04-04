# Close Class Configuration List Search And Preview Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list search, preview UX, list discoverability
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/class-configuration/01-close-class-configuration-list-search-and-preview-parity.md`

## Goal

Bring the Next class configuration list to Angular parity for multi-field text search and row preview.

## Verified Current Code Truth

- Angular list supports text search by:
  - `admin_name`
  - `quater_name`
  - `schedule`
  - `session`
- Angular list includes a Preview action that opens an in-place modal using row data.
- Next list currently renders columns for:
  - quarter
  - schedule
  - session
  - assigned admin
  - created date
- Next list configuration currently does not expose search fields or preview.

## User-Visible Problem

Admins in Next cannot search class configurations using the same dimensions they use in Angular and cannot quickly inspect a record without leaving the list context.

## Required Behavior

1. `/admin/training/classes` must support text search by admin.
2. `/admin/training/classes` must support text search by quarter.
3. `/admin/training/classes` must support text search by schedule.
4. `/admin/training/classes` must support text search by session.
5. `/admin/training/classes` must expose preview from the list.
6. Existing sorting, pagination, and edit navigation must continue to work.

## Tasks

1. Add search fields for `admin_name`, `quater_name`, `schedule`, and `session`.
2. Add preview support from the list using the most reliable row-data or fetch-driven path for this module.
3. Ensure list search resets pagination correctly when a new search is applied.
4. Verify preview content uses the same operational fields Angular admins expect to inspect quickly.

## Acceptance Criteria

- admins can search class configurations by admin, quarter, schedule, and session
- preview is available from the list
- preview content is useful and readable
- search, sort, pagination, and edit navigation all continue to work

## Verification Test Plan

1. Open `/admin/training/classes` and search by admin name.
2. Search by quarter name and confirm the result set narrows correctly.
3. Search by schedule and session values and confirm the result set narrows correctly.
4. Trigger preview for a row and confirm the class details are readable without leaving the list.
5. Re-test edit navigation after the list changes and confirm no regression.

## Notion Summary

P1 list parity gap: the Next Class Configuration list needs Angular-style text search across admin, quarter, schedule, and session plus a preview action for fast inspection.
