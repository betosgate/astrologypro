**Status:** Done

# Task: User Status Change Notes & Notification

## Objective
Require a note when changing a user's status and ensure the user is notified of the change and the reason.

## Requirements
- [ ] **Note Requirement**: When an admin clicks to change a user's status (e.g., Active to Inactive), open a dialog requiring a reason/note for the change.
- [ ] **Audit Trail**: Save this note in the `admin_user_notes` table associated with the status change event.
- [ ] **User Notification**: Send an automated email/notification to the user explaining that their status has changed, including the reason provided in the admin note.
- [ ] **UI Update**: Ensure the status change is reflected immediately in the user list once the note is submitted.
