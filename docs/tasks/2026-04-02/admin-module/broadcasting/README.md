# Broadcasting Parity Task Index - 2026-04-02

- Module: Admin -> Brod Casting
- Angular Source Routes:
  - `brod-casting`
  - `brod-casting/add-blog`
  - `brod-casting/edit/:_id`
- Next Route: `/admin/broadcasting`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/broadcasting`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/broadcasting`

## Scope Of This Review

This folder contains the validated parity tasks for the Brod Casting nav review of **Broadcasting**.

The Next.js broadcasting module already has list, add, and edit routes, but Angular still carries a few broadcast-specific list and authoring behaviors that are only partially represented in the generic admin scaffolding.

## Verified Current Comparison Summary

### Already Implemented In Next

- broadcasting list route at `/admin/broadcasting`
- broadcasting add route at `/admin/broadcasting/add`
- broadcasting edit route at `/admin/broadcasting/edit/[id]`
- list uses `brodcasting/brodcasting-list` and `brodcasting/brodcasting-list-count`
- list supports status toggle and delete actions
- list already shows title, short description, description, status, and updated date
- add/edit already supports title, short description, description, and active status
- edit route already fetches and prepopulates a broadcast record

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list uses title autocomplete search via `brodcasting/brodcasting-autocomplete`
- Angular list supports updated-date range filtering on `updated_on`
- Angular list wiring uses title search plus status filter together, while Next currently treats `updated_on` as a generic text search field
- Angular add/edit uses rich editors for both `shortDescription` and `description`, while Next currently uses plain textareas
- broadcast edit/save behavior should be validated against the actual returned record shape so generic form normalization does not flatten or mis-handle rich-text content

## Recommended Execution Order

1. `01-close-broadcasting-list-search-and-filter-parity.md`
2. `02-close-broadcasting-rich-text-form-parity.md`
3. `03-align-broadcasting-prefill-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/app-routing.module.ts`
- `src/app/brod-casting/brod-casting-routing.module.ts`
- `src/app/brod-casting/list-brodcasting/edit-brodcasting.component.ts`
- `src/app/brod-casting/list-brodcasting/edit-brodcasting.component.html`
- `src/app/brod-casting/add-brodcasting/add-brodcasting.component.ts`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/broadcasting/page.tsx`
- `src/app/(admin)/admin/broadcasting/add/page.tsx`
- `src/app/(admin)/admin/broadcasting/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`

## Notes

- This folder is the canonical task set for this module.
- Broadcasting appears simpler than Blog or Video, so the remaining work should stay focused on list filtering behavior and content-authoring fidelity.
