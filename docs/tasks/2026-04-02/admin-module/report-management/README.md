# Report Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Report
- Angular Source Route:
  - `admin-dashboard/report`
- Next Route:
  - `/admin/reports`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/report-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/report-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Report`.

The Next reports page already uses the correct list and count endpoints and is backed by a generic list system that can support the remaining Angular behaviors. The current parity gap is therefore mostly configuration work rather than new infrastructure.

## Verified Current Comparison Summary

### Already Implemented In Next

- report list route at `/admin/reports`
- list uses:
  - `report/report-list`
  - `report/report-list-count`
- list supports:
  - quarter search
  - schedule search
  - sorting
- list already shows:
  - `quater_name`
  - `schedule_name`
  - `clicked_on`
- Next generic list infrastructure already supports:
  - preview dialogs
  - preview from existing row data
  - date-range filters

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list supports date-range filtering on `clicked_on`
- Angular list exposes a Preview action
- Angular preview shows additional row-backed context:
  - `ip_info.city`
  - `ip_info.country`
  - `ip_info.hostname`
  - `ip_info.ip`
  - `ip_info.loc`
  - `ip_info.postal`
  - `ip_info.region`
  - `ip_info.timezone`

## Recommended Execution Order

1. `01-close-report-list-date-filter-parity.md`
2. `02-close-report-preview-ip-metadata-parity.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/report/report-routing.module.ts`
- `src/app/admin-dashboard/report/report.component.ts`
- `src/app/admin-dashboard/report/reportPreviewModal/reportpreview.html`

### Next

- `src/app/(admin)/admin/reports/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- No naming-only task is included.
- No separate search task is included because Next already covers the working Angular quarter search and also adds schedule search.
