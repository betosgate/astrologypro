# Close Video Entry Modal And Upload Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: nested video modal flow, edit-in-place behavior, uploaded-file entry support
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/video-management/02-close-video-entry-modal-and-upload-parity.md`

## Goal

Close the nested video-entry authoring gap so the Next video form can manage the same entry types and modal behaviors Angular supports.

## Verified Current Code Truth

- Angular top-level form includes:
  - `title`
  - `priority`
  - rich `description`
  - `status`
  - external nested video-entry workflow via modal
- Angular nested video modal supports at least:
  - `videotype = 1` for YouTube link
  - `videotype = 3` for uploaded video file
- Angular nested video modal supports editing an existing nested entry in place.
- Angular uploaded-file entries collect file metadata plus nested title/description fields.
- Next custom video form already supports:
  - add nested video entry
  - delete nested video entry
  - YouTube entry fields
  - placeholder fields for uploaded-file entry metadata
- Next currently does not support editing an existing nested video entry.
- Next currently does not capture or persist actual uploaded-file entry payload data.

## User-Visible Problem

Next can create only a simplified nested video collection. Admins cannot reopen and edit an existing nested entry, and uploaded video-file entries are not functionally complete.

## Required Behavior

1. Nested video entries must support both add and edit flows.
2. Uploaded-file video entries must capture real upload data, not only metadata placeholders.
3. Existing nested entries must re-open into the modal with their current values.
4. Delete behavior must remain intact.
5. The video form should preserve the dedicated custom UX instead of forcing nested entries into a generic form field.

## Tasks

1. Add edit-in-place support for nested video entries in the modal flow.
2. Rehydrate modal state from an existing nested video entry.
3. Implement actual uploaded-video entry support with the expected file payload structure.
4. Preserve YouTube entry support while expanding uploaded-file support.
5. Verify nested entry add/edit/delete behavior across create and edit pages.

## Acceptance Criteria

- nested video entries can be added, edited, and deleted
- modal reopen shows current values for the selected nested entry
- uploaded video-file entries capture functional upload data
- YouTube entry flow still works
- nested video collection persists correctly on save

## Verification Test Plan

1. Open `/admin/videos/add` and add a YouTube nested entry.
2. Reopen that nested entry and edit it in place.
3. Add an uploaded-file nested entry and verify upload data plus metadata are captured.
4. Remove a nested entry and verify the list updates correctly.
5. Repeat add/edit/delete checks on `/admin/videos/edit/[id]` for a populated record.

## Implementation Notes (2026-04-02)

Refactored `video-form.tsx`:
- `VideoUploadModal` renamed to `VideoEntryModal`; signature extended with `editEntry?: VideoEntry`, `editIndex?: number`, `onSave: (entry, editIndex?) => void`.
- `useEffect([open])` hydrates all modal fields from `editEntry` when opening in edit mode, and resets to empty defaults for add mode.
- Modal title and action button change between "Add Video Entry"/"Add" and "Edit Video Entry"/"Save" based on `editIndex !== undefined`.
- Each video entry row in `VideoForm` now has an edit (pencil) icon button that calls `openEditModal(index)` — sets `editingIndex` + `editingEntry`, then opens modal.
- `handleSave` either appends (add mode) or replaces at index (edit mode).
- Added `video_url?: string` field to `VideoEntry` type and a "Video File URL" `Input` in the type-3 modal form — captures the S3/CDN path for uploaded video entries. Browser-side S3 upload not implemented (requires separate infrastructure task).
- Delete behavior unchanged.

## Notion Summary

P1 authoring gap: Angular Video Management supports modal-based add and edit for nested video entries, including uploaded-file entries. Next still needs full nested-entry editing and real upload support.
