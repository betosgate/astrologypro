# Astro Terrot Decan Video And Pronuncement Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Astro Terrot Decan Video And Pronuncement
- Angular Source Routes:
  - `admin-dashboard/astro-decan-video-and-pronuncement-list`
  - `admin-dashboard/add-astro-decan-videos-pdfs`
  - `admin-dashboard/add-astro-decan-videos-pdfs/:_id`
- Next Routes:
  - `/admin/astrology/decan-videos`
  - `/admin/astrology/decan-videos/add`
  - `/admin/astrology/decan-videos/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/astro-terrot-decan-video-pronuncement`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/astro-terrot-decan-video-pronuncement`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Astro Terrot Decan Video And Pronuncement`.

The Next module already has the correct list and add/edit route shell, and it correctly avoids delete parity because Angular hides delete for this module. The remaining work is concentrated in three places: list search and preview parity, sign and decan selection parity in the form, and alignment of the nested content payload and upload-backed edit flow across the three content branches.

## Verified Current Comparison Summary

### Already Implemented In Next

- decan-videos list route at `/admin/astrology/decan-videos`
- decan-videos add route at `/admin/astrology/decan-videos/add`
- decan-videos edit route at `/admin/astrology/decan-videos/edit/[id]`
- list uses:
  - `wheel_signs/astro-decan-video-pronumcement-list`
  - `wheel_signs/astro-decan-video-pronumcement-list-count`
- list already shows:
  - `sign`
  - `decan`
  - `content_type`
  - `created_on`
- delete is intentionally hidden, which matches the working Angular list

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list supports autocomplete-backed search for:
  - `sign`
  - `decan`
- Angular list exposes a Preview action
- Angular form loads sign options from `wheel_signs/wheel-sign-autocomplete`
- Angular form uses three branch workflows:
  - uploaded video
  - YouTube video
  - pronouncement
- Angular save submits a nested `content` object rather than flattening branch fields
- Angular save also transforms:
  - `sign_id` from the selected sign
  - `sign` from the selected sign label
- Angular edit hydrates branch-specific fields from `formValue.content.*`
- Angular edit hydrates upload-backed fields such as:
  - `thumbnail_path`
  - `video`
  - `assets`

## Recommended Execution Order

1. `01-close-decan-video-list-search-and-preview-parity.md`
2. `02-build-sign-selection-and-branch-aware-form-parity.md`
3. `03-align-decan-video-content-hydration-upload-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/admin-dashboard-routing.module.ts`
- `src/app/admin-dashboard/astro-terrot-decan-info/astro-decan-video-pronuncement-list/astro-decan-video-pronuncement-list.component.ts`
- `src/app/admin-dashboard/astro-terrot-decan-info/add-astro-decan-videos-pdfs/add-astro-decan-videos-pdfs.component.ts`

### Next

- `src/app/(admin)/admin/astrology/decan-videos/page.tsx`
- `src/app/(admin)/admin/astrology/decan-videos/add/page.tsx`
- `src/app/(admin)/admin/astrology/decan-videos/edit/[id]/page.tsx`
- `src/app/(admin)/admin/astrology/decan-videos/_components/decan-video-form.tsx`

## Notes

- This folder is the canonical task set for this module.
- No delete task is included because the live Angular module hides delete.
- The main migration risk is branch-specific content correctness, not list scaffolding.
