# Build Live Stream Content Workflow - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: live stream branch, stream source logic, reminders, scheduling
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content/03-build-live-stream-content-workflow.md`

## Goal

Implement the full Live Stream content branch, including scheduling, stream source branching, thumbnail handling, and reminder logic.

## Verified Current Code Truth

- Angular Live Stream branch includes:
  - title
  - tags
  - description
  - stream source
  - embed or direct URL branch
  - scheduled date
  - duration
  - thumbnail
  - access control
  - priority
  - content status
  - reminders
  - reminder time
  - reminder method
- Angular dynamically swaps URL fields depending on stream source.
- Angular dynamically injects reminder fields only when reminders are enabled.
- Next currently has no Live Stream branch workflow beyond the shared flat fields.

## User-Visible Problem

The most operationally complex content type in Angular is effectively absent in Next. Without this branch, the “Manage Dashboard Contents” module is not functionally migrated.

## Required Behavior

1. Implement the full Live Stream field set.
2. Support stream source branching with the correct dependent URL field behavior.
3. Support reminder toggle behavior with dependent reminder fields.
4. Support thumbnail upload plus shared baseline fields.
5. Ensure edit mode rehydrates the correct branch and dependent controls.

## Tasks

1. Add the Live Stream branch fields to the new form shell.
2. Implement stream source branching and URL field swapping.
3. Implement reminders toggle plus reminder time/method fields.
4. Add thumbnail and scheduling fields with correct validation.
5. Validate Live Stream edit hydration and save behavior.

## Acceptance Criteria

- Live Stream content can be created and edited in Next
- stream source branching works correctly
- reminders branch works correctly
- thumbnail, schedule, access control, priority, and publish status all persist correctly
- Live Stream records rehydrate correctly in edit mode

## Verification Test Plan

1. Create a Live Stream record using each stream-source path and verify the correct URL field behavior.
2. Enable reminders and verify reminder fields appear and save correctly.
3. Disable reminders and verify dependent reminder fields are omitted safely.
4. Edit a saved Live Stream record and verify all branch fields rehydrate correctly.
5. Save again after branch changes and confirm no stale fields persist unexpectedly.

## Implementation Notes (2026-04-02)

`LiveStreamFields` component in `perennial-content-form.tsx`:
- `stream_source` RadioGroup: "0" = Embed URL, "1" = Direct URL. Conditional render of `embed_url` Input vs `direct_url` Input based on watched value.
- `scheduled_date` date Input; `duration` number Input.
- `thumbnail_path` URL input in `CommonMetaFields` (shared). Bucket upload deferred.
- `reminders` Checkbox via Controller. When true: `reminder_time` number Input + `reminder_method` select (Push Notification / Email) rendered.
- Submit: `stream_source` sent as Number(0|1); empty media fields omitted; reminder fields omitted if `reminders` false.
- Edit hydration: `stream_source` normalized from int/string; `reminders` from truthy value; `scheduled_date` sliced to YYYY-MM-DD.

## Notion Summary

P1 branch gap: Live Stream content is the deepest workflow in Angular and needs full scheduling, stream source, thumbnail, and reminder behavior in Next.
