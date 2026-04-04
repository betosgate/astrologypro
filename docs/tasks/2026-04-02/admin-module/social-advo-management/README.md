# Social Advo Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Social Advo Post
- Angular Source Routes:
  - `admin-dashboard/social-advo`
  - `admin-dashboard/social-advo/add-social-advo`
  - `admin-dashboard/social-advo/edit-social-advo/:id`
- Next Route:
  - `/admin/social-advo`
  - `/admin/social-advo/add`
  - `/admin/social-advo/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/social-advo-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/social-advo-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Social Advo Post`.

The Next module already has a dedicated list and add/edit flow, but it still trails Angular in several operational list behaviors and in the actual media authoring model used by the form.

## Verified Current Comparison Summary

### Already Implemented In Next

- social advo list route at `/admin/social-advo`
- social advo add route at `/admin/social-advo/add`
- social advo edit route at `/admin/social-advo/edit/[id]`
- list uses `social-advo/social-advo-list` and `social-advo/social-advo-list-count`
- list supports row-level edit
- list supports row-level delete
- list supports row-level status toggle
- list supports title search
- list supports status filtering
- list supports frequency filtering
- form already includes:
  - `title`
  - `frequency`
  - `link`
  - `description`
  - `status`
  - `freq_change_enable`
- edit route already uses the Angular-aligned edit fetch flow

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list includes a Preview action from the list
- Angular list supports created-date range search
- Angular list supports updated-date range search
- Angular list exposes multi-select list actions
- Angular list supports bulk status update
- Angular list supports bulk delete via `social-advo/social-advo-deletemany`
- Angular form treats `description` as required
- Angular form uploads image, audio, and video assets as managed file uploads
- Angular edit flow hydrates stored media objects back into the form
- Next currently models:
  - image as a single image-style file field
  - audio as URL text
  - video as URL text
- The current shared file field is image-preview oriented and does not match Angular’s stored array-based media payload model for image/audio/video

## Recommended Execution Order

1. `01-close-social-advo-list-preview-filter-and-bulk-action-parity.md`
2. `02-close-social-advo-form-media-and-validation-parity.md`
3. `03-align-social-advo-edit-hydration-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/social-advo/social-advo-routing.module.ts`
- `src/app/admin-dashboard/social-advo/social-advo-list/social-advo-list.component.ts`
- `src/app/admin-dashboard/social-advo/social-advo-list/social-advo-list.component.html`
- `src/app/admin-dashboard/social-advo/social-advo-add-module/social-advo-add-module-routing.module.ts`
- `src/app/admin-dashboard/social-advo/social-advo-add-module/add-social-advo/add-social-advo.component.ts`
- `src/app/admin-dashboard/social-advo/social-advo-add-module/add-social-advo/add-social-advo.component.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/social-advo/page.tsx`
- `src/app/(admin)/admin/social-advo/add/page.tsx`
- `src/app/(admin)/admin/social-advo/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`
- `src/app/(admin)/_components/form-fields/file-upload-field.tsx`

## Notes

- This folder is the canonical task set for this module.
- No task is included for endpoint naming differences by themselves.
- The real migration risk here is media shape compatibility, not route scaffolding.
