# General Content Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> General Content List
- Angular Source Routes:
  - `admin-dashboard/gernal-info-list`
  - `admin-dashboard/gernal-content-add-edit`
  - `admin-dashboard/gernal-content-add-edit/:_id`
- Next Routes:
  - `/admin/content/general`
  - `/admin/content/general/add`
  - `/admin/content/general/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/general-content-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/general-content-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `General Content List`.

The Angular source still uses the misspelled `gernal` naming in routes and files, but the behavior itself is a simple journal-style content module. The Next module already covers the core list and add/edit route shell. The real remaining work is concentrated in form completeness and submit semantics.

## Verified Current Comparison Summary

### Already Implemented In Next

- general-content list route at `/admin/content/general`
- general-content add route at `/admin/content/general/add`
- general-content edit route at `/admin/content/general/edit/[id]`
- list uses:
  - `wheel_signs/journal-list`
  - `wheel_signs/journal-list-count`
- list already shows:
  - `sign`
  - `decan`
  - `title`
  - `description`
  - `user_name_with_email`
  - `created_on`
- list already keeps delete enabled, which matches the working Angular module
- form already includes:
  - sign selection by `sign_id`
  - decan
  - title
  - description

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular form includes `assets` upload
- Angular form loads sign options from `wheel_signs/wheel-sign-autocomplete` using `response.res`
- Angular submit transforms:
  - `sign_id` from the selected sign
  - `sign` from the selected sign label
  - `assets_path_link` from the uploaded asset
  - `added_by` from the logged-in admin

## Recommended Execution Order

1. `01-close-general-content-form-assets-parity.md`
2. `02-align-general-content-sign-option-loading-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/admin-dashboard-routing.module.ts`
- `src/app/admin-dashboard/gernal-content-list/gernal-content-list.component.ts`
- `src/app/admin-dashboard/gernal-content-list/gernal-content-add-edit/gernal-content-add-edit.component.ts`

### Next

- `src/app/(admin)/admin/content/general/page.tsx`
- `src/app/(admin)/admin/content/general/add/page.tsx`
- `src/app/(admin)/admin/content/general/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`
- `src/app/(admin)/_components/form-fields/dynamic-select-field.tsx`

## Notes

- This folder is the canonical task set for this module.
- The task folder uses the corrected `general-content` naming, while source references preserve the live Angular spelling.
- I did not create preview or search parity tasks because the live Angular list does not expose a trustworthy working preview flow, and its search endpoint wiring is inconsistent enough that it should not be treated as the parity target.
