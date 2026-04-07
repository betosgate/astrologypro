# Task: Admin User List - Automatic Data Refresh
Date: 2026-04-07
Category: Admin Dashboard

## Objective
Ensure the Admin User List (table) automatically refreshes its data whenever a change is made to a user's record via the detail modal or action menu. This prevents the "stale UI" issue where the list shows outdated information (e.g., old note counts or status) after an update.

## Requirements
- **Refresh Mechanism**:
    - File: `src/app/admin/users/page.tsx`
    - Implement a `refreshData` function that triggers a re-fetch of the current page of users.
    - If using Next.js Server Actions or `router.refresh()`, ensure it clears the client-side cache as well.
- **Callback Integration**:
    - Pass a `onSuccess` or `onUpdate` callback prop to the `UserDetailClient` (the modal component).
    - When an action (Add Note, Toggle Suspend, Lock, Edit Profile) successfully completes, the modal should call this `onUpdate` callback.
- **Trigger Actions**:
    - Add Note (List should show new note count).
    - Suspend/Activate User (List should show new status).
    - Lock/Unlock User (List should show lock status).
    - Edit Profile (List should show updated Name/Email/Role).
- **UX**:
    - Show a subtle loading indicator (e.g., a small spinner in the header or a slight overlay) while the list is refreshing.

## Success Criteria
- Deleting or adding a note immediately updates the "Note Count" in the list (if implemented).
- Changing a user's role or status is immediately reflected in the table after the modal closes.
- No manual page refresh (F5) is required to see updates.
