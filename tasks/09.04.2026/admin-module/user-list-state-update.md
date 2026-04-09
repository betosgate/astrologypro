# Task: Fix User List State Refresh

- Status: Pending
- Completion Notes: 

## Objective
Fix an issue in the Admin Dashboard where the User List does not automatically update/refresh after a change is made to a user. Currently, when an Admin adds a note, edits user details, or performs other activities, a manual page reload is required to see the updated data in the list.

## Requirements

### 1. Component Callbacks
- [ ] Ensure that the forms/modals handling user actions (e.g., Add Note Modal, Edit User Modal) correctly invoke a callback function upon a successful API response.

### 2. Implement Data Refetching
- [ ] **If using a fetching library (like React Query or SWR)**: Ensure the relevant query key (e.g., `['users']`) is cleanly invalidated or re-fetched when a mutation (edit/note addition) succeeds.
- [ ] **If using standard React State (`useState`/`useEffect`)**: Pass a `fetchUsers()` or `refreshData()` function down as a prop to the child components and execute it on success.

### 3. Verification
- [ ] Test adding a note to a user. Verify the User List (or the specific row's note count/data) updates instantly without a hard page refresh.
- [ ] Test editing a user's role or details. Verify the row reflects the updated data instantly.
