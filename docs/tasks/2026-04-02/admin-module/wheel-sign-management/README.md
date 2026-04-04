# Wheel Sign Management Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Wheel Sign
- Angular Source Routes:
  - `admin-dashboard/wheel-sign`
  - `admin-dashboard/wheel-sign/wheel-sign-add`
  - `admin-dashboard/wheel-sign/wheel-sign-edit/:_id`
- Next Routes:
  - `/admin/astrology/wheel-signs`
  - `/admin/astrology/wheel-signs/add`
  - `/admin/astrology/wheel-signs/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/wheel-sign-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/wheel-sign-management`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Wheel Sign`.

The Next wheel-sign module already has the correct main routes and most of the list columns. The remaining work is concentrated in three places: search and list-view parity, add/edit form completeness, and the actual save semantics for date-time combination and update payload compatibility.

## Verified Current Comparison Summary

### Already Implemented In Next

- wheel-sign list route at `/admin/astrology/wheel-signs`
- wheel-sign add route at `/admin/astrology/wheel-signs/add`
- wheel-sign edit route at `/admin/astrology/wheel-signs/edit/[id]`
- list uses:
  - `wheel_signs/wheel-sign-list`
  - `wheel_signs/wheel-sign-list-count`
- list already shows:
  - title
  - `startDateTime`
  - `endDateTime`
  - priority
  - `createdAt`
  - `updatedAt`
- form already includes:
  - title
  - priority
  - start date
  - end date
  - start time
  - end time
  - description
  - theme image
  - icon image

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list supports date-range filtering on `startDateTime`
- Angular list supports sign search through autocomplete-backed selection
- Angular list exposes the default row view flow
- Angular form includes `assets` upload in addition to theme and icon image
- Angular submit combines:
  - `start_date` + `start_time` into `startDateTime`
  - `end_date` + `end_time` into `endDateTime`
- Angular update flow submits the record identifier in the shape that module expects for successful edit

## Recommended Execution Order

1. `01-close-wheel-sign-list-search-date-filter-and-view-parity.md`
2. `02-close-wheel-sign-form-assets-and-time-entry-parity.md`
3. `03-align-wheel-sign-date-time-hydration-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/wheel-sign/wheel-sign-routing.module.ts`
- `src/app/admin-dashboard/wheel-sign/wheel-sign/wheel-sign.component.ts`
- `src/app/admin-dashboard/wheel-sign/wheel-sign/wheel-sign.component.html`
- `src/app/admin-dashboard/wheel-sign/wheel-sign-add/wheel-sign-add.component.ts`

### Next

- `src/app/(admin)/admin/astrology/wheel-signs/page.tsx`
- `src/app/(admin)/admin/astrology/wheel-signs/add/page.tsx`
- `src/app/(admin)/admin/astrology/wheel-signs/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- No delete or status-toggle task is included because the live Angular module hides those actions.
- The main migration risk is save semantics, not route scaffolding.
