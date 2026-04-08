# Task: Admin User Detail - Direct Note Navigation

- Status: Completed (2026-04-08, verified)
- Completion Notes: user-detail-sheet.tsx:98 + 143 + 279 — initialTab/activeTab state, sync on open. Add Note action passes "notes" as initialTab.
Date: 2026-04-07
Category: Admin Dashboard

## Objective
Improve the flow for adding notes from the user list. Clicking "Add Note" should not just open the user detail modal, but should also automatically focus and navigate to the "Notes" tab specifically.

## Requirements
- **Action Trigger**:
    - File: `src/app/admin/users/page.tsx`
    - Update the `onClick` handler for the "Add Note" menu item.
    - Instead of just setting `isDetailModalOpen(true)`, it should pass a reference or state that indicates the target tab.
- **Modal Component Update**:
    - Component: `UserDetailClient` (inside `src/components/admin/user-detail-client.tsx`).
    - Support an initial `activeTab` or `targetTab` prop/state.
    - When triggered from "Add Note", the `activeTab` should default to `"notes"`.
- **Auto-Focus**:
    - Once the "Notes" tab is active, the note textarea should automatically receive focus for immediate typing.

## User Flow
1. Admin clicks **...** on a user row.
2. Admin clicks **Add Note**.
3. The **User Detail Modal** opens.
4. The **Notes** tab is already selected and visible.
5. The cursor is ready in the text area.

## Success Criteria
- Eliminates the need for the admin to manually click the "Notes" tab after opening the modal.
- Provides a seamless transition from the list to the specific action.
