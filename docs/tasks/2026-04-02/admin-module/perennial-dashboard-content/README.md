# Perennial Dashboard Content Parity Task Index - 2026-04-02

- Module: Admin -> Perennial Mandalism -> Manage Dashboard Contents
- Angular Source Routes:
  - `admin-dashboard/perrenial-mandalism/dashboard-content-list`
  - `admin-dashboard/perrenial-mandalism/add-dashboard-content`
  - `admin-dashboard/perrenial-mandalism/edit-dashboard-content/:_id`
- Next Route: `/admin/perennial-content`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content`

## Scope Of This Review

This folder contains the validated parity tasks for the Perennial Mandalism nav review of **Manage Dashboard Contents**.

This is not a simple CRUD migration. The Angular module is a content-type-driven admin system where the form behavior, required fields, media handling, scheduling, and reminder logic all change based on the selected content type. The current Next module only represents a small subset of that behavior.

## Verified Current Comparison Summary

### Already Implemented In Next

- content list route at `/admin/perennial-content`
- content add route at `/admin/perennial-content/add`
- content edit route at `/admin/perennial-content/edit/[id]`
- list uses `content/content-list` and `content/content-list-count`
- list already exposes title search plus filters for content status, access control, and content type
- edit mode already fetches and prepopulates a content record
- add/edit already supports the shared baseline fields:
  - `title`
  - `priority`
  - `content_type`
  - `description`
  - `access_control`
  - `content_status`

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list includes preview via `ContentPreviewComponent`
- Angular list sorts by priority ascending and filters by `display_dates`, status, access control, and content type
- Angular content form is dynamic and changes materially by content type
- Angular supports five content-type workflows with different required fields:
  - Live Stream
  - Video Library
  - Document
  - YouTube Video
  - Announcement
- Angular Live Stream workflow includes:
  - tags
  - stream source branch
  - embed/direct URL branch
  - scheduled date
  - duration
  - thumbnail
  - access control
  - priority
  - publish status
  - reminders
  - reminder time
  - reminder method
- Angular Video Library workflow includes:
  - video source branch
  - uploaded video / YouTube / direct video URL branching
  - thumbnail
  - tags
  - access control
  - priority
  - publish status
- Angular Document workflow includes:
  - file upload
  - thumbnail
  - tags
  - access control
  - priority
  - publish status
- Angular YouTube Video workflow includes:
  - YouTube URL
  - tags
  - thumbnail
  - access control
  - priority
  - publish status
- Angular Announcement workflow includes:
  - thumbnail
  - display start date
  - display end date
  - link
  - tags
  - access control
  - publish status
- Angular add/edit performs field injection/removal dynamically when `content_type`, `stream_source`, `video_source`, and `reminders` change
- Angular submit sends the active branch-specific field set instead of a flat shared content schema
- Next currently models the module as one generic form with no branch-specific field workflows

## Recommended Execution Order

1. `01-close-perennial-content-list-preview-sort-and-filter-parity.md`
2. `02-build-content-type-driven-form-shell-and-branch-state.md`
3. `03-build-live-stream-content-workflow.md`
4. `04-build-video-library-document-and-youtube-workflows.md`
5. `05-build-announcement-workflow-and-display-window-behavior.md`
6. `06-align-content-prefill-branch-hydration-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/layout/header/header.component.html`
- `src/app/services/resolve.service.ts`
- `src/app/admin-dashboard/content-management/content-list/content-list.component.ts`
- `src/app/admin-dashboard/content-management/content-list/content-list.component.html`
- `src/app/admin-dashboard/content-management/add-edit-content/add-edit-content.component.ts`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/perennial-content/page.tsx`
- `src/app/(admin)/admin/perennial-content/add/page.tsx`
- `src/app/(admin)/admin/perennial-content/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- Do not treat this as “just another generic form parity pass.” The missing behavior is architectural: content type controls the entire authoring model.
- The task split is intentionally deeper than previous modules so implementation can proceed in slices without losing branch-specific context.
