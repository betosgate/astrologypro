# Package Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Package
- Angular Source Routes:
  - `admin-dashboard/package`
  - `admin-dashboard/package/add-package`
  - `admin-dashboard/package/edit-package/:id`
- Next Route:
  - `/admin/packages`
  - `/admin/packages/add`
  - `/admin/packages/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/package-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/package-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Package`.

The Next package module already covers the base CRUD flow, but Angular still carries meaningful list preview behavior and several important package-authoring fields that are not yet represented in the current Next form.

## Verified Current Comparison Summary

### Already Implemented In Next

- package list route at `/admin/packages`
- package add route at `/admin/packages/add`
- package edit route at `/admin/packages/edit/[id]`
- list uses:
  - `package/package-list`
  - `package/package-list-count`
- list supports:
  - package name search
  - status filtering
  - purchase type filtering
  - row-level delete
  - row-level status toggle
  - edit navigation
- form already supports:
  - `name`
  - `priority`
  - `purchase_type`
  - `package_type`
  - `price`
  - `sessions`
  - `subscription_period`
  - `description`
  - `status`
- add and edit already submit through `package/addupdate-packages`

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list includes a Preview action from the list
- Angular list supports created-date range search on `created_at`
- Angular preview shows additional package business fields including:
  - `subscription_period`
  - `sessions`
  - `added_by_name`
  - `webinar_names`
  - `price`
  - `description`
  - `status_formatted`
- Angular form includes webinar multi-select from `webinar/fetch-all-webinar`
- Angular form includes package image upload with stored image metadata
- Angular form treats `price` as required
- Angular form treats `description` as required
- Angular purchase-type branching is more strictly validated in the live form

## Recommended Execution Order

1. `01-close-package-list-preview-and-date-filter-parity.md`
2. `02-close-package-form-webinar-image-and-required-field-parity.md`
3. `03-align-package-purchase-type-branching-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/package/package-routing.module.ts`
- `src/app/admin-dashboard/package/package-list/package-list.component.ts`
- `src/app/admin-dashboard/package/package-list/package-list.component.html`
- `src/app/admin-dashboard/package/package-list/packagecustompreview.html`
- `src/app/admin-dashboard/package/package-add-module/add-package/add-package.component.ts`
- `src/app/admin-dashboard/package/package-add-module/add-package/add-package.component.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/packages/page.tsx`
- `src/app/(admin)/admin/packages/_components/package-form.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- No endpoint-name-only task is included.
- The main migration risk is package authoring completeness: webinar linkage, image upload, and purchase-type-specific payload correctness.
