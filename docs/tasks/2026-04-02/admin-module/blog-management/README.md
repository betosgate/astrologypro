# Blog Management Parity Task Index - 2026-04-02

- Module: Admin -> Blog
- Angular Source Routes:
  - `blog-manegement`
  - `blog-manegement/add-blog`
  - `blog-manegement/edit/:_id`
- Next Route: `/admin/blog`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/blog-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/blog-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Blog nav review of **Blog Management**.

The Next.js blog module already has list, add, and edit routes, but Angular still carries several blog-specific behaviors that are only partially migrated or are currently approximated in generic admin scaffolding.

## Verified Current Comparison Summary

### Already Implemented In Next

- blog list route at `/admin/blog`
- blog add route at `/admin/blog/add`
- blog edit route at `/admin/blog/edit/[id]`
- list uses `blogmanagement/blog-list` and `blogmanagement/blog-list-count`
- list supports status toggle and delete actions
- list already shows title, priority, perennial flag, status, created date, and updated date
- add/edit already supports title, priority, description, image, perennial flag, and status
- add/edit already uses blog-specific add and edit endpoints

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list includes a Preview action backed by `blogmanagement/blog-details-fetch`
- Angular list uses title autocomplete search via `blogmanagement/blog-list-title-autocomplete`
- Angular list supports date-range search on `created_on` and `updated_on`
- Angular add/edit uses a rich editor for description, while Next currently uses plain textarea
- Angular authoring supports separate media collections for `images`, `files`, `audios`, and `videos`
- Angular edit flow uses resolver-backed record prefill with nested response data, so Next edit prefill should be validated against actual returned blog shape rather than assumed generic form behavior
- Angular image upload supports thumbnail metadata through `img_status`

## Recommended Execution Order

1. `01-close-blog-list-preview-and-search-parity.md`
2. `02-close-blog-form-rich-content-and-media-parity.md`
3. `03-align-blog-fetch-model-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/app-routing.module.ts`
- `src/app/blog-management-routing-module/blog-management-routing-module-routing.module.ts`
- `src/app/services/resolve.service.ts`
- `src/app/blog-managemnt/blog-managemnt.component.ts`
- `src/app/blog-managemnt/blog-managemnt.component.html`
- `src/app/blog-managemnt/add-blog/add-blog.component.ts`
- `src/app/blog-managemnt/add-blog/add-blog.component.html`
- `src/app/blog-managemnt/preview_component.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/blog/page.tsx`
- `src/app/(admin)/admin/blog/add/page.tsx`
- `src/app/(admin)/admin/blog/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- The current Next blog implementation is directionally correct, but it still relies on generic list/form behavior where Angular uses blog-specific preview, search, media, and edit-prefill contracts.
