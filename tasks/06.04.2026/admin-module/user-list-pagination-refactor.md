**Status:** Done

# Task: User List Pagination & Component Refactor

## Objective
Refactor the Admin User List into a reusable common component and implement adjustable pagination (up to 100 items per page).

## Requirements

### 1. Adjustable Pagination
- [ ] **Page Size Selector**: Add a dropdown to the user list to select the number of items per page (e.g., 10, 25, 50, 100).
- [ ] **URL Integration**: Synchronize the `pageSize` with the URL search parameters to maintain the selected view during navigation/refresh.
- [ ] **Dynamic Fetching**: Update the data fetching logic to respect the user's selected page size.

### 2. Common Component Refactoring
- [ ] **Component Extraction**: Extract the user list table and its related filtering/pagination logic into a reusable common component (e.g., `src/components/admin/common-user-list.tsx`).
- [ ] **Prop-driven Design**: Ensure the common component is configurable via props (e.g., selectable columns, custom actions, initial filters).
- [ ] **Consistency**: Use this common component for both the main User List and the new Deleted User List to ensure a unified admin experience.
