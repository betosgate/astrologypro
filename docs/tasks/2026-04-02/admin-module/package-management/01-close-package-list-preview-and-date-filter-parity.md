# Close Package List Preview And Date Filter Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list preview, date filtering, list query behavior
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/package-management/01-close-package-list-preview-and-date-filter-parity.md`

## Goal

Bring the Next package list to Angular parity for preview and created-date filtering.

## Verified Current Code Truth

- Angular package list supports:
  - package name search
  - status filtering
  - created-date range search on `created_at`
  - preview from the list
- Angular preview shows richer package business detail than the current list columns alone, including:
  - package name
  - purchase type
  - subscription period
  - package type
  - sessions
  - added by name
  - webinar names
  - price
  - description
  - priority
  - formatted status
- Next package list currently supports:
  - package name search
  - status filtering
  - purchase type filtering
  - row-level edit/delete/status actions
- Next package list currently does not expose preview or created-date range filtering.

## User-Visible Problem

Admins in Next cannot inspect the full business details of a package from the list and cannot narrow packages by created date the way Angular allows.

## Required Behavior

1. `/admin/packages` must expose preview from the list.
2. Preview must show the core package business fields Angular admins inspect.
3. `/admin/packages` must expose created-date range filtering on `created_at`.
4. Date filtering must compose safely with package-name and status filtering.

## Tasks

1. Add preview support using the active package preview fetch flow.
2. Render preview fields for package business details, including purchase-type-specific values where present.
3. Add created-date range filtering for `created_at`.
4. Ensure list requests merge date filters with existing search and filter conditions safely.

## Acceptance Criteria

- preview is available from the package list
- preview shows the expected package business fields
- created-date range filtering works correctly
- package name, status, purchase type, and date filters can be combined safely
- row-level edit, delete, and status toggle still work

## Verification Test Plan

1. Open `/admin/packages` and trigger preview for a row.
2. Verify preview shows the expected package details.
3. Apply a created-date range and confirm the result set narrows correctly.
4. Combine name search, purchase type, status, and created-date filters and confirm the intersection is correct.
5. Re-test edit, delete, and status toggle after the list changes and confirm no regression.

## Notion Summary

P1 list parity gap: the Next Package module needs richer preview and created-date filtering so admins can inspect and narrow package records with the same visibility as Angular.
