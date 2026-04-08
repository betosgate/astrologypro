# Admin UI Standardization Master Task

- Status: Completed (2026-04-08, verified)
- Completion Notes: Verified complete: SortHeader pattern from `user-management-client.tsx` adopted across testimonials-, mandalism-, blog-, activity-log-, invitations-, payments-, packages-table-client.tsx. Detail sheets standardised (user-detail-sheet, invitation-detail-sheet, activity-log-detail-sheet, activity-report-detail-sheet). Notes via admin-notes-section.tsx.

## Objective
Standardize all administrative data tables, detail panels, and note-taking features across the project to match the performance and UX quality of the "Users" management module.

## Canonical Folder
- Repo path: `tasks/07.04.2026/standardization/admin-ui`

## Why This Task Pack Exists
The project has several modules (Invitations, Activity Reports, etc.) that use different patterns for tables, details, and notes. This causes UX inconsistency and duplicate development effort. By defining the "Users" module as the gold standard, we can systematically upgrade other modules to match this high bar.

## Global Standardization Rules
1. **Source of Truth**: All list views must use the URL as the primary source of truth for search, filters, sorting, and pagination.
2. **Server-Side Rendering (SSR)**: Initial data loading should be SSR where possible, with client-side transitions (using `useTransition`) for filtering and paging.
3. **Optimistic Updates**: Use local state and `router.refresh()` for actions like status changes or blocking to maintain a snappy UI.
4. **Detail Sheets**: Right-side sheets (`Sheet` from shadcn) are the standard for secondary detail views, avoiding large-scale navigation for simple inspections.
5. **Notes Audit**: Any critical admin action (like blocking or deleting) should be backed by a note entry for auditing purposes.

## UI Patterns To Sync
- **Search**: Must include a debounced autocomplete (like `SearchAutocomplete` in `user-management-client.tsx`).
- **Sorting**: Use a generic `SortHeader` component that toggles between `asc`/`desc` and syncs with `sortBy`/`sortDir` URL params.
- **Bulk Selection**: A sticky bar must appear when one or more rows are selected, showing the count and relevant bulk operations.
- **Action Menu**: Each row should have a 3-dot `DropdownMenu` with "View Details" as the primary action.

## Execution Order
1. `01-tables/01-data-tables.md`
2. `02-sheets/02-detail-panels.md`
3. `03-notes/03-note-functionality.md`

## Standard Per-Task Workflow
For each child task:
1. Identify the target module (e.g., `InvitationsClient`).
2. Read the "Users" implementation reference provided in the task.
3. Audit the target file for gaps in the pattern.
4. Implement the required features (Standard Table, Standard Detail Sheet, etc.).
5. Verify parity with the "Users" module.

## Done Definition
- All modules in the `src/components/admin` directory that display tabular data have been upgraded to the "Users" standard.
- Shared components (like `SortHeader` and `Note` section) have been extracted or reused consistently.
- All detail panels follow the same tabbed sheet layout.
