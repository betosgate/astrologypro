# Task 03 - Standardize Add Note Functionality

## Objective
Establish the "Users Note Section" pattern as the universal standard for all administrative note-taking across the project.

## Why This Task Exists
Administrative notes provide critical context for user behavior, support issues, and audit trails. A consistent, high-quality note-taking interface ensures that notes are readable, editable (when allowed), and properly attributed to the admin who created them.

## Standard Reference Pattern
- **Reference File**: `src/components/admin/user-detail-sheet.tsx`
- **Key Component**: `Notes` tab (lines 364–466)
- **Functions**: `handleAddNote`, `handleDeleteNote`, `handleSaveEdit`

## Global Rules for Notes
### 1. Unified Interface
- Display a `Textarea` at the top of the "Notes" tab for adding new notes.
- Use a "Add Note" button that shows a loader when saving.
- If there are no notes, show "No notes yet" in a centered, muted style.

### 2. Note Ownership & Permissions
- Notes must display the creator's email and a relative timestamp (e.g., `Jan 10, 2026 10:30 AM`).
- Only the creator of a note is allowed to **Edit** it.
- **Delete** permissions should be available to any admin for moderation purposes.

### 3. Inline Editing
- Clicking "Edit" (pencil icon) should transform the note text into a `Textarea` for editing.
- Provide "Save" and "Cancel" buttons for the edit state.
- Update the UI only after a successful API call.

### 4. Attribution & Auditing
- Notes should include a `created_by` field (admin's email).
- Critical system actions (like a "Block") should automatically generate an admin note (e.g., `Block reason: [Reason]`).

### 5. Standard Component Markup
- Use a rounded, bordered `div` with padding for each note.
- Icons from `lucide-react` (User, Clock, Pencil, Trash) for metadata and actions.
- Action icons (pencil/trash) should have a hover effect and be hidden or low-opacity until the row is hovered.

## Required Implementation (Generic)
For any target module with note functionality:
1. Embed the notes logic within the detail panel's "Notes" tab.
2. Ensure the "Add Note" action is prominent.
3. Implement the edit-in-place workflow using a local `editingNoteId` state.
4. Correctly display attribution (admin email and timestamp).
5. Ensure actions like "Block" or "Delete" prompt for a reason that is then saved as a note.

## Verification Test Plan
- [ ] Add a new note and verify it appears at the top of the list immediately.
- [ ] Verify you can only edit notes you created (using a mock or separate admin account).
- [ ] Confirm "Delete" removes the note with a toast confirmation.
- [ ] Verify system-generated notes (e.g., block reason) are clearly readable and attributed.
- [ ] Check responsive behavior of the textarea.
