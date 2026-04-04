# Quarter Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Quarter Management
- Angular Source Routes:
  - `admin-dashboard/quarter`
  - `admin-dashboard/quarter/quarter-add`
  - `admin-dashboard/quarter/quarter-edit/:_id`
- Next Route:
  - `/admin/quarters`
  - `/admin/quarters/add`
  - `/admin/quarters/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/quarter-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/quarter-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Quarter Management`.

The Next quarter module already covers the core CRUD flow. The remaining gaps are concentrated in list operations and in the description authoring model used by Angular.

## Verified Current Comparison Summary

### Already Implemented In Next

- quarter list route at `/admin/quarters`
- quarter add route at `/admin/quarters/add`
- quarter edit route at `/admin/quarters/edit/[id]`
- list uses `quatermanagement/quater-list` and `quatermanagement/quater-list-count`
- list supports row-level status toggle
- list supports row-level delete
- list supports text search by `quarter_name`
- list supports status filtering
- form already includes:
  - `quarter_name`
  - `sit_count`
  - `priority`
  - `description`
  - `status`
- add and edit both submit through the shared `quatermanagement/add-edit` flow

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list includes a Preview action from the list
- Angular list supports updated-date range search on `updated_at`
- Angular list exposes multi-select list actions
- Angular list supports bulk status update
- Angular list supports bulk delete
- Angular form treats `description` as required
- Angular form uses rich editor authoring for `description`, not plain textarea

## Recommended Execution Order

1. `01-close-quarter-list-preview-filter-and-bulk-action-parity.md`
2. `02-close-quarter-form-description-parity.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/admin-dashboard-routing.module.ts`
- `src/app/quarter-management/quarter-management-routing.module.ts`
- `src/app/quarter-management/quarter-list/quarter-list.component.ts`
- `src/app/quarter-management/quarter-list/quarter-list.component.html`
- `src/app/quarter-management/quarter-add/quarter-add.component.ts`
- `src/app/quarter-management/quarter-add/quarter-add.component.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/quarters/page.tsx`
- `src/app/(admin)/admin/quarters/add/page.tsx`
- `src/app/(admin)/admin/quarters/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- No task is included for fetch endpoint naming differences alone.
- Angular’s created-date filter is commented out in the live quarter list, so it is not treated as a required parity gap.
