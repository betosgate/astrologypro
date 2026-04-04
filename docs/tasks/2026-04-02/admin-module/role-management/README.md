# Role Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Role
- Angular Source Routes:
  - `admin-dashboard/role`
  - `admin-dashboard/role/add-role`
  - `admin-dashboard/role/add-role/:id`
- Next Route:
  - `/admin/roles`
  - `/admin/roles/add`
  - `/admin/roles/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/role-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/role-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Role`.

The Next role module is already substantially migrated. The remaining parity work is concentrated in list-level filtering and bulk actions, not in the add/edit form.

## Verified Current Comparison Summary

### Already Implemented In Next

- role list route at `/admin/roles`
- role add route at `/admin/roles/add`
- role edit route at `/admin/roles/edit/[id]`
- list uses `admin/role-list` and `admin/role-list-count`
- list supports row-level status toggle
- list supports row-level delete
- list supports preview from the list via `admin/role-preview`
- list supports text search by `role_name`
- list supports status filtering
- add and edit form already support:
  - `role_name`
  - `slug`
  - `priority`
  - `description`
  - `status`
- edit flow is already tracked in the Next repo route documentation as valid for `/admin/roles/edit/[id]`

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list supports date-range search on `createdon_datetime`
- Angular list supports date-range search on `updatedon_datetime`
- Angular list exposes multi-select list actions
- Angular list supports bulk status updates on selected roles
- Angular list supports bulk delete on selected roles

## Recommended Execution Order

1. `01-close-role-list-date-filter-parity.md`
2. `02-close-role-list-bulk-action-parity.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/role/role-routing.module.ts`
- `src/app/admin-dashboard/role/role-list/role-list.component.ts`
- `src/app/admin-dashboard/role/role-list/role-list.component.html`
- `src/app/admin-dashboard/role/role-add-module/role-add-module-routing.module.ts`
- `src/app/admin-dashboard/role/role-add-module/add-role/add-role.component.ts`
- `src/app/admin-dashboard/role/role-add-module/add-role/add-role.component.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/roles/page.tsx`
- `src/app/(admin)/admin/roles/add/page.tsx`
- `src/app/(admin)/admin/roles/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `docs/backoffice/ROUTE-TRACKER.md`

## Notes

- This folder is the canonical task set for this module.
- No task is included for fetch-endpoint naming differences because current repo evidence does not show a functional edit-hydration problem.
- No task is included for row-level preview, delete, or status toggle because those behaviors already exist in Next.
