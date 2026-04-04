# Build Announcement Workflow And Display Window Behavior - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: announcement branch, display windows, link behavior, thumbnail/access model
- Estimate: 1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content/05-build-announcement-workflow-and-display-window-behavior.md`

## Goal

Implement the Announcement branch with its display-window behavior so time-bounded dashboard announcements can be authored and managed correctly.

## Verified Current Code Truth

- Angular Announcement branch includes:
  - title
  - priority
  - description
  - thumbnail
  - display start date
  - display end date
  - link
  - tags
  - access control
  - content status
- Announcement behavior is different from the other branches because it includes an explicit dashboard display window.
- Next currently has no Announcement-specific workflow beyond the shared flat fields.

## User-Visible Problem

Announcements are a core dashboard-content type, but the time-window and link-driven behavior that makes them useful is currently absent in Next.

## Required Behavior

1. Implement the full Announcement field set.
2. Support display start and end date behavior.
3. Support optional or conditional link behavior where Angular allows it.
4. Preserve thumbnail, tags, access control, priority, and publish status.
5. Ensure edit mode rehydrates the full announcement branch correctly.

## Tasks

1. Build the Announcement branch fields in the form shell.
2. Add display-window fields and validation.
3. Add thumbnail and link support.
4. Preserve the branch-specific tags/access/status/priority behavior.
5. Validate create/edit round-trip behavior for announcement content.

## Acceptance Criteria

- Announcement content can be created and edited in Next
- display start and end dates persist correctly
- optional link behavior works as intended
- thumbnail, tags, access control, priority, and publish status persist correctly
- Announcement records rehydrate correctly in edit mode

## Verification Test Plan

1. Create an Announcement with display dates and verify it saves successfully.
2. Edit the same Announcement and confirm all branch fields rehydrate correctly.
3. Test with and without a link value and verify save behavior remains correct.
4. Confirm thumbnail and metadata fields persist correctly.
5. Re-test list filtering with the new Announcement records present.

## Implementation Notes (2026-04-02)

`AnnouncementFields` in `perennial-content-form.tsx`:
- `display_startdate` and `display_enddate` date Inputs.
- `link` optional text Input; omitted from payload when empty.
- `thumbnail_path`, `tags`, `access_control`, `priority`, `content_status` from `CommonMetaFields`.
- Edit hydration: date fields sliced to YYYY-MM-DD.
- Submit: `display_startdate`, `display_enddate`, and `link` omitted if empty.

## Notion Summary

P1 branch gap: Announcement content needs its own display-window and link-driven workflow in Next to match the Angular dashboard-content system.
