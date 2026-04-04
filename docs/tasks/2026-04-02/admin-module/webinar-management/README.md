# Webinar Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Webinar
- Angular Source Routes:
  - `admin-dashboard/webiner`
  - `admin-dashboard/webiner/add-webiner`
  - `admin-dashboard/webiner/edit-webiner/:id`
- Next Route:
  - `/admin/webinars`
  - `/admin/webinars/add`
  - `/admin/webinars/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/webinar-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/webinar-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Webinar`.

The Next webinar module is already close to Angular. The remaining parity work is limited to list preview and proper created-date filtering behavior.

## Verified Current Comparison Summary

### Already Implemented In Next

- webinar list route at `/admin/webinars`
- webinar add route at `/admin/webinars/add`
- webinar edit route at `/admin/webinars/edit/[id]`
- list uses:
  - `webinar/webinar-list`
  - `webinar/webinar-list-count`
- list supports:
  - title search
  - status filtering
  - row-level delete
  - row-level status toggle
  - edit navigation
- form already supports:
  - `title`
  - `priority`
  - `frequency`
  - `description`
  - `status`
- add and edit flows already use the correct business endpoints for create and update behavior

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list includes a Preview action from the list
- Angular list supports created-date range search on `createdon_datetime`

## Important Analysis Note

- No form-parity task is included because the current Next webinar form is already materially aligned with Angular’s working form behavior.
- No fetch-endpoint naming task is included because naming differences alone are not treated as migration work.

## Recommended Execution Order

1. `01-close-webinar-list-preview-and-date-filter-parity.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/webiner/webiner-routing.module.ts`
- `src/app/admin-dashboard/webiner/webiner-list/webiner-list.component.ts`
- `src/app/admin-dashboard/webiner/webiner-list/webiner-list.component.html`
- `src/app/admin-dashboard/webiner/add-webiner/main/main.component.ts`
- `src/app/admin-dashboard/webiner/add-webiner/main/main.component.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/webinars/page.tsx`
- `src/app/(admin)/admin/webinars/add/page.tsx`
- `src/app/(admin)/admin/webinars/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- The current Next webinar form already exceeds the minimum Angular parity bar in this migration review.
