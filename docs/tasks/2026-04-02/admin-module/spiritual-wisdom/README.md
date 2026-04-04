# Spiritual Wisdom Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Spiritual Wisdom
- Angular Source Routes:
  - `admin-dashboard/spiritual-wisdom`
  - `admin-dashboard/spiritual-wisdom/add-spiritual`
- Next Route:
  - `/admin/content/spiritual-wisdom`
  - `/admin/content/spiritual-wisdom/add`
  - `/admin/content/spiritual-wisdom/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/spiritual-wisdom`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/spiritual-wisdom`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Spiritual Wisdom`.

This is one of the few modules where the current Next implementation is already more complete than the Angular source. The Angular add form is still a stub, and the list’s edit/preview click handling is not active. The only parity gap kept here is the list’s date-range filtering behavior.

## Verified Current Comparison Summary

### Already Implemented In Next

- spiritual wisdom list route at `/admin/content/spiritual-wisdom`
- spiritual wisdom add route at `/admin/content/spiritual-wisdom/add`
- spiritual wisdom edit route at `/admin/content/spiritual-wisdom/edit/[id]`
- list uses `spiritual-wishdom/spiritual-wisdom-list` and `spiritual-wishdom/spiritual-wisdom-list-count`
- list supports:
  - title search
  - status filtering
  - row-level delete
  - row-level status toggle
  - edit navigation
- form supports:
  - `title`
  - `descriptive_title`
  - `priority`
  - `description`
  - `status`
- add and edit flows already exist in Next

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list supports created-date range search on `created_at`
- Angular list supports updated-date range search on `updatedon_datetime`

## Important Analysis Note

- Angular list declares preview and edit custom buttons, but the click handlers for those actions are commented out in the live component.
- Angular add form route exists, but the `SpiritualFormComponent` is currently only a stub and does not provide the actual authoring workflow.
- Because of that, this parity review does not treat Angular preview/edit/add-form behavior as trusted migration requirements for Next.

## Recommended Execution Order

1. `01-close-spiritual-wisdom-date-filter-parity.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/admin-dashboard-routing.module.ts`
- `src/app/admin-dashboard/spiritual-wisdom/spiritual-wisdom-routing.module.ts`
- `src/app/admin-dashboard/spiritual-wisdom/spiritual-list/spiritual-list.component.ts`
- `src/app/admin-dashboard/spiritual-wisdom/spiritual-list/spiritual-list.component.html`
- `src/app/admin-dashboard/spiritual-wisdom/spiritual-form/spiritual-form.component.ts`
- `src/app/admin-dashboard/spiritual-wisdom/spiritual-form/spiritual-form.component.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/content/spiritual-wisdom/page.tsx`
- `src/app/(admin)/admin/content/spiritual-wisdom/add/page.tsx`
- `src/app/(admin)/admin/content/spiritual-wisdom/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- Next already exceeds Angular in core CRUD completeness for this module.
- No form, preview, or edit-navigation task is included because Angular does not currently provide those as trustworthy working behaviors.
