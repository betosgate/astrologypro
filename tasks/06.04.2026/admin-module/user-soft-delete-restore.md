# Task: User Soft Delete & Restore

## Objective
Implement a robust soft-delete mechanism that moves users to a separate table and provides a way to restore them to the active system.

## Requirements

### 1. Database & Logic
- [ ] Create a `deleted_users` table to store records moved out of active tables (`diviners`, `clients`, etc.).
- [ ] Implement the "Soft Delete" logic to move a record to `deleted_users` while maintaining historical metadata.
- [ ] Implement a "Restore" function to move users back to their original profile tables.

### 2. UI/UX
- [ ] **Confirmation**: Show a confirmation modal before moving a user to the deleted list.
- [ ] **Deleted Users Page**: Create a new page at `/admin/users/deleted` to list all soft-deleted records.
- [ ] **Restore Option**: Provide a "Restore" or "Return to System" button for each user in the deleted list.
- [ ] Ensure proper routing and access control for the deleted users view.
