**Status:** Done
**Verified 2026-04-08:** src/components/admin/admin-notes-section.tsx + src/app/api/admin/users/[id]/notes/{route.ts,[noteId]/route.ts}.

# Task: User Note Management

## Objective
Provide administrators with a built-in system to add, view, and manage administrative notes for each user.

## Requirements

### 1. Visibility & History
- [ ] **Note List**: Display all notes for a specific user in a historical list.
- [ ] **Metadata**: For each note, show:
    - **Who**: The name of the administrator who added the note.
    - **When**: The date and time the note was created.
    - **Content**: The full text of the note.

### 2. Management Actions
- [ ] **Add Note**: Provide a text area to add new internal notes about the user.
- [ ] **Delete Permission**: An administrator can **only delete their own notes**. Notes added by other administrators must remain read-only for accountability.

### 3. Implementation Logic
- [ ] **Database Integration**: Use the `admin_user_notes` table to store and retrieve these records.
- [ ] **Security**: Ensure that the `created_by` field correctly identifies the logged-in administrator and that deletion logic enforces the "own notes only" rule.
- [ ] **Audit Trail**: Record note creation and deletion events in the general `admin_activity_log`.
