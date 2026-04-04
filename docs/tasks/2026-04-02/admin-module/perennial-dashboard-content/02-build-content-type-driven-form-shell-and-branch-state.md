# Build Content Type Driven Form Shell And Branch State - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: form architecture, content-type branching, dynamic field injection/removal model
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content/02-build-content-type-driven-form-shell-and-branch-state.md`

## Goal

Replace the current flat generic content form with a content-type-driven form shell that can actually host the Angular workflows without turning each branch into ad hoc hacks.

## Verified Current Code Truth

- Angular always starts with `content_type`, then dynamically injects or removes the rest of the field set based on selection.
- Angular also dynamically changes fields again when:
  - `stream_source` changes
  - `video_source` changes
  - `reminders` changes
- Next currently treats the content module as a single shared form with one small common field set.
- The missing behavior is structural, not just additive.

## User-Visible Problem

Without a real content-type-driven form architecture, the Next module cannot safely represent the actual dashboard content workflows. Trying to bolt the Angular branches onto the current flat form will make edit-mode hydration and submit logic fragile.

## Required Behavior

1. Treat `content_type` as the primary branch controller for the form.
2. Allow branch-specific required fields and conditional sections.
3. Support secondary branch controllers such as stream source, video source, and reminders.
4. Preserve create/edit usability without form resets that lose user input unnecessarily.
5. Keep the architecture explicit enough that each content-type task can build on it independently.

## Tasks

1. Introduce a dedicated form shell for perennial dashboard content instead of relying only on the generic form page.
2. Implement content-type branch selection with stable field-state transitions.
3. Implement secondary branch-state support for nested conditional controls.
4. Define shared baseline fields versus branch-specific fields clearly in code.
5. Ensure edit mode can mount the correct branch before field hydration begins.

## Acceptance Criteria

- the form architecture is content-type driven
- switching content type updates the visible branch-specific field set correctly
- secondary branching can be layered on top without brittle hacks
- create and edit mode can both mount the correct form branch
- follow-on content-type tasks can implement branch fields without reworking the form shell

## Verification Test Plan

1. Open `/admin/perennial-content/add` and verify selecting different content types changes the form structure.
2. Confirm switching between content types does not leave stale fields mounted incorrectly.
3. Verify secondary branch controls can show and hide dependent fields.
4. Open `/admin/perennial-content/edit/[id]` for different content types and confirm the correct branch loads.
5. Re-test save/cancel flows after the new form shell is introduced.

## Implementation Notes (2026-04-02)

New bespoke `PerennialContentForm` in `perennial-content/_components/perennial-content-form.tsx`:
- `content_type` select is always rendered first. React Hook Form `watch("content_type")` drives which branch section renders.
- Branch sections (`LiveStreamFields`, `VideoLibraryFields`, `DocumentFields`, `YouTubeVideoFields`, `AnnouncementFields`) are conditionally rendered; stale fields are naturally absent from React tree.
- Secondary branching: `watch("stream_source")` swaps embed_url ↔ direct_url; `watch("video_source")` swaps file_path / youtube_url / video_url; `watch("reminders")` shows/hides reminder_time and reminder_method.
- Common metadata block (`CommonMetaFields`) renders only once a content_type is chosen.
- Add/edit pages replaced from GenericFormPage to `<PerennialContentForm />`.

## Notion Summary

P1 architecture gap: this module needs a content-type-driven form shell before individual field parity can be implemented safely. Build the branching foundation first.
