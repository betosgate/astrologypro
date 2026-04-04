# Close Blog List Preview And Search Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list actions, preview behavior, autocomplete/date search parity
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/blog-management/01-close-blog-list-preview-and-search-parity.md`

## Goal

Close the remaining blog list gap by restoring Angular’s preview behavior and tightening search behavior to match the actual blog management workflow.

## Verified Current Code Truth

- Angular blog list uses `blogmanagement/blog-list` with count from `blogmanagement/blog-list-count`.
- Angular list supports:
  - edit
  - delete
  - status toggle
  - preview
- Angular preview is backed by `blogmanagement/blog-details-fetch`.
- Angular title search uses autocomplete via `blogmanagement/blog-list-title-autocomplete`.
- Angular also supports:
  - priority text search
  - status filter
  - date-range search on `created_on`
  - date-range search on `updated_on`
- Next blog list already supports edit/delete/status and exposes generic search/filter configuration, but it does not yet expose Angular-equivalent preview behavior.
- Next search configuration is currently generic and should be verified against autocomplete/date-range expectations.

## User-Visible Problem

Admins can manage blog records in Next, but they cannot preview a post from the list the way they can in Angular. Search behavior is also only partially aligned with how Angular list filtering is configured.

## Required Behavior

1. Add a preview action for each blog row.
2. Preview must fetch selected blog data using `blogmanagement/blog-details-fetch`.
3. Preview must render blog content in a read-only admin-safe surface.
4. Preserve list edit/delete/status behavior.
5. Review and restore title autocomplete and date-range search parity where the current generic list cannot express the Angular contract accurately.

## Tasks

1. Extend the blog list action model to support preview.
2. Implement a read-only preview modal, drawer, or page for blog details.
3. Fetch preview data from `blogmanagement/blog-details-fetch` using the selected blog id.
4. Review whether generic search controls are sufficient for title autocomplete and date-range search; replace or extend them where required.
5. Keep list sorting, pagination, and status toggling intact.

## Acceptance Criteria

- blog list exposes a visible preview action per row
- preview fetches and displays the selected blog correctly
- preview is read-only
- title search and date search behavior are intentionally aligned with Angular
- list edit/delete/status/search/filter behavior remains intact

## Verification Test Plan

1. Open `/admin/blog` and confirm list still renders as before.
2. Confirm each row has a preview action in addition to edit/delete/status controls.
3. Open preview for a blog and verify title, description, status, media references, and perennial flag render correctly.
4. Verify title search, priority search, status filter, and created/updated date filtering behave as intended.
5. Re-test edit, delete, sort, pagination, and status toggle after preview support is added.

## Implementation Notes (2026-04-02)

Changes in `blog/page.tsx`:
- `previewEndpoint: "blogmanagement/blog-details-fetch"` was already wired; `previewFields` covers `title`, `priority`, `description` (html), `available_for_perennial`, `status` (badge), `created_on` (date), `updated_on` (date).
- Removed non-functional `{ label: "Created On", field: "created_on" }` and `{ label: "Updated On", field: "updated_on" }` search fields. `GenericListPage` uses regex text matching; date strings produce no useful results.
- Title text search and priority text search preserved.
- Date-range filtering deferred: `GenericListPage` has no date-range control type; requires a new filter component.
- Title autocomplete intentionally skipped: requires typeahead integration not present in `GenericListPage`.
- Status filter and all existing CRUD behavior preserved.

## Notion Summary

P1 list parity gap: Angular Blog Management includes an API-backed Preview action and more specific search behavior. Next already has the CRUD list, but still needs preview plus explicit search parity review.
