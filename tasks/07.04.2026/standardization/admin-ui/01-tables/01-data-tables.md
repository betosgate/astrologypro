# Task 01 - Standardize Data Table Patterns

## Objective
Establish the "Users Table" pattern as the universal standard for all administrative data grids in the project.

## Why This Task Exists
Administrative tables must provide a consistent set of tools for data operators. Discrepancies in how search, sorting, or pagination work across modules lead to confusion and reduced efficiency.

## Standard Reference Pattern
- **Reference File**: `src/components/admin/user-management-client.tsx`
- **Key Component**: `SortHeader` (lines 265–291)
- **Key Pattern**: `pushParams` helper for URL-driven state management (lines 395–412)

## Global Rules for Tables
### 1. Unified Search & Filtering
- Use `SearchAutocomplete` for main text search (name, email, etc.).
- Search must be debounced by 1000ms.
- Any filter change (Role, Status, Date) must reset the page to 1.
- Filters must sync with the URL search parameters.

### 2. Standard Sorting
- Column headers must use the `SortHeader` component.
- The `sortBy` and `sortDir` parameters must be extracted from the URL.
- Clicking an already-active sort column must toggle the direction (`asc` <-> `desc`).

### 3. Pagination & Page Size
- Default page sizes: `[10, 25, 50, 100]`.
- Pagination buttons should show current page, first/last pages, and use ellipsis for large datasets.
- Page transitions must be wrapped in `useTransition` to provide visual feedback (loading state).

### 4. Bulk Selections & Actions
- Implement a primary checkbox in the `<thead>` for "Select all on page".
- Individual row checkboxes in the first column of the `<tbody>`.
- A sticky "Selection Bar" must appear at the top when `selectedIds.size > 0`.
- Example bar actions: `Export Selected CSV`, `Change Status`, `Clear`.

### 5. Standard Action Menu
- Each row should end with a "3-dot" vertical icon (typically from `lucide-react`).
- Menu items must follow this order (if applicable):
  1. View Details (Primary)
  2. Edit (Direct navigation or modal)
  3. Context-specific actions (e.g., "Add Note", "Reset Password")
  4. Critical/Destructive actions (Block/Delete) separated by a `DropdownMenuSeparator`.

## Required Implementation (Generic)
For any target module table:
1. Replace static headers with `SortHeader`.
2. Add a `pushParams` helper to manage URL state.
3. Wrap the table in a `Card` that displays a `Loading…` overlay when `isPending` is true.
4. Add the selection logic and sticky bulk-action bar.
5. Standardize the row dropdown menu.

## Verification Test Plan
- [ ] Confirm clicking a header updates the URL and triggers a re-fetch.
- [ ] Confirm selecting rows shows the selection bar and hides it on "Clear".
- [ ] Confirm searching is debounced and results update without a full page reload.
- [ ] Verify the action menu contains "View Details" and matches the shadcn dropdown style.
