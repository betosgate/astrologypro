# Video Management Parity Task Index - 2026-04-02

- Module: Admin -> Video -> Video List
- Angular Source Routes:
  - `video-management`
  - `video-management/add-video`
  - `video-management/edit/:_id`
- Next Route: `/admin/videos`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/video-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/video-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Video nav review of **Video Management**.

The Next.js video module already has list, add, and edit routes with a dedicated custom form, but Angular still carries several video-management behaviors that are only partially migrated.

## Verified Current Comparison Summary

### Already Implemented In Next

- video list route at `/admin/videos`
- video add route at `/admin/videos/add`
- video edit route at `/admin/videos/edit/[id]`
- list uses `videomanagement/video-list` and `videomanagement/video-list-count`
- list supports status toggle and delete actions
- list already shows title, description, priority, status, created date, and updated date
- form already supports title, priority, description, status, and nested `videos` entries
- form already supports add and delete for nested video entries
- edit form already fetches an existing record and rehydrates top-level fields plus stored `videos`

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list includes a Preview action from the list
- Angular list uses title autocomplete search via `videomanagement/video-title-autocomplete`
- Angular list supports priority search plus date-range search on `created_on` and `updated_on`
- Angular add/edit uses a rich editor for description, while Next currently uses plain textarea
- Angular nested video workflow supports modal-based add and edit of individual video entries, not only add and delete
- Angular nested video workflow supports uploaded-file entries with actual file metadata, not just title/description placeholders
- Angular modal flow reopens and edits an existing nested video entry in place
- video edit prefill and submit behavior should be validated against the real returned nested record shape once uploaded-file entries are supported

## Recommended Execution Order

1. `01-close-video-list-preview-and-search-parity.md`
2. `02-close-video-entry-modal-and-upload-parity.md`
3. `03-align-video-prefill-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/app-routing.module.ts`
- `src/app/video-management/video-management-routing.module.ts`
- `src/app/video-management/video-list/video-list.component.ts`
- `src/app/video-management/video-list/video-list.component.html`
- `src/app/video-management/video-add/video-add.component.ts`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/videos/page.tsx`
- `src/app/(admin)/admin/videos/add/page.tsx`
- `src/app/(admin)/admin/videos/edit/[id]/page.tsx`
- `src/app/(admin)/admin/videos/_components/video-form.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- The current Next video implementation is closer to parity than the generic admin modules, but nested video entry behavior is still meaningfully simpler than Angular.
