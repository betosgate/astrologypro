# Task: Refresh Admin User List After User Changes

- Status: Pending
- Priority: High

## Goal
Make the admin user list refresh automatically after actions like edit, add note, or similar user updates.

## Current Problem
- User data changes are being saved.
- But the list does not refresh automatically.
- Admin must manually reload the page to see the updated data.

## Expected Result
- After a successful mutation, the user list updates right away.
- No manual browser refresh is needed.
- The refreshed data should reflect edits, notes, role changes, and similar updates.

## Scope
- User list refresh logic
- Mutation success callbacks
- Query invalidation or refresh callback wiring

## Steps

### 1. Inspect User List Data Flow
- Find the component that owns the user list state.
- Check whether the list uses server rendering, client fetch, React Query, SWR, or plain `useState` + `useEffect`.
- Find all child components or modals that can mutate user data.

### 2. Connect Mutation Success To Refresh
- For each user mutation flow, find the success handler.
- Add a refresh action after successful completion.
- Use the correct mechanism for the project:
  - query invalidation if using a fetch library
  - callback prop if using local state
  - route refresh if the page relies on server data

### 3. Cover Common Actions
- Edit user
- Add note
- Role change
- Any other user action already available in the admin UI that affects list data

### 4. Avoid Unnecessary Full Reloads
- Do not use `window.location.reload()` unless there is no better option.
- Prefer table-level data refresh.
- Keep current filters, pagination state, and search state intact if possible.

### 5. Verify
- Add a note and confirm the row updates.
- Edit user details and confirm the row updates.
- Change a role or status and confirm the row updates.
- Confirm the list stays in the same filtered or paginated state after refresh.

## Notes For Implementation
- If multiple actions share the same list, centralize the refresh logic.
- Keep success handling predictable across all user actions.
- Make sure stale cached data is not left behind.

## Acceptance Checklist
- [ ] User list refreshes after edit
- [ ] User list refreshes after note add
- [ ] User list refreshes after other user mutations
- [ ] No manual page refresh is required
- [ ] Existing table state remains stable after refresh
