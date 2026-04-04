# Assignment Notification Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Assignment Notification
- Angular Source Route:
  - `admin-dashboard/assignment-notification`
- Next Route:
  - `/admin/training/notifications`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/assignment-notification`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/assignment-notification`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Assignment Notification`.

This is a list-only module. The current Next implementation already covers the base notification listing, but Angular still carries additional list behaviors for filtering and preview.

## Verified Current Comparison Summary

### Already Implemented In Next

- assignment notification list route at `/admin/training/notifications`
- list uses `training-centre/assignment-notification-list`
- list uses `training-centre/assignment-notification-list-count`
- list already shows:
  - `added_by_name`
  - `added_by_email`
  - `lesson_title`
  - `createdon_datetime`
- list already supports text search by:
  - `added_by_name`
  - `added_by_email`
  - `lesson_title`

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list includes a Preview action from the list
- Angular preview shows:
  - added by name
  - added by email
  - lesson title
  - created datetime
  - assignment answer entries from `answerdata`
- Angular list supports created-date range search on `createdon_datetime`
- Angular list exposes lesson-name search through `admin/lesson-name-autocomplete-with-assignment`, not only generic text search

## Recommended Execution Order

1. `01-close-assignment-notification-preview-parity.md`
2. `02-close-assignment-notification-filter-parity.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/admin-dashboard-routing.module.ts`
- `src/app/admin-dashboard/assignment-notification/assignment-notification.component.ts`
- `src/app/admin-dashboard/assignment-notification/assignment-notification.component.html`
- `src/app/admin-dashboard/assignment-notification/previewmodal.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/training/notifications/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- No add/edit task exists because this module is list-only in the current admin flow.
- No delete/status/bulk task exists because the live Angular notification module does not expose those as meaningful working behaviors.
