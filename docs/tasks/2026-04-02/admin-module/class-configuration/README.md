# Class Configuration Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Class Configuration
- Angular Source Routes:
  - `admin-dashboard/class_configure`
  - `admin-dashboard/class_configure/add-class-configure`
  - `admin-dashboard/class_configure/edit-class-configure/:id`
- Next Route:
  - `/admin/training/classes`
  - `/admin/training/classes/add`
  - `/admin/training/classes/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/class-configuration`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/class-configuration`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Class Configuration`.

The Next module already has a dedicated list page and a custom add/edit form. The remaining gaps are concentrated in list search/preview behavior and in the dependent session-selection logic inside the form.

## Verified Current Comparison Summary

### Already Implemented In Next

- class configuration list route at `/admin/training/classes`
- class configuration add route at `/admin/training/classes/add`
- class configuration edit route at `/admin/training/classes/edit/[id]`
- list uses `quatermanagement/class_list` and `quatermanagement/class_list-count`
- custom form already fetches:
  - quarter options from `quatermanagement/quater_dropdown`
  - admin options from `user/admin_autocomplete`
- edit form already fetches existing record data from `quatermanagement/edit_class_data`
- add and edit already submit through:
  - `quatermanagement/add_class_config`
  - `quatermanagement/edit_class_config`
- form already includes:
  - `quater_id`
  - `schedule`
  - `session`
  - `admin_id`

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list supports text search by:
  - `admin_name`
  - `quater_name`
  - `schedule`
  - `session`
- Angular list includes a Preview action from the list
- Angular form derives session choices from the selected `schedule`
- Angular form uses schedule-specific session labels, not generic `Session 1A/1B/...`
- Angular edit flow repopulates the dependent session option list before rendering the selected session

## Recommended Execution Order

1. `01-close-class-configuration-list-search-and-preview-parity.md`
2. `02-close-class-configuration-dependent-session-parity.md`
3. `03-align-class-configuration-edit-hydration-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/class-configuration/class-configuration-routing.module.ts`
- `src/app/admin-dashboard/class-configuration/configured-class-list/configured-class-list.component.ts`
- `src/app/admin-dashboard/class-configuration/configured-class-list/configured-class-list.component.html`
- `src/app/admin-dashboard/class-configuration/add-class/add-class.component.ts`
- `src/app/admin-dashboard/class-configuration/add-class/add-class.component.html`

### Next

- `src/app/(admin)/_lib/navigation.ts`
- `src/app/(admin)/admin/training/classes/page.tsx`
- `src/app/(admin)/admin/training/classes/add/page.tsx`
- `src/app/(admin)/admin/training/classes/edit/[id]/page.tsx`
- `src/app/(admin)/admin/training/classes/_components/class-config-form.tsx`

## Notes

- This folder is the canonical task set for this module.
- No task is included for delete or bulk-action parity because the live Angular list is wired with visibly inconsistent copied endpoints there, so this review does not treat them as trusted parity requirements.
- The meaningful migration risk is the dependent session-selection behavior, not route scaffolding.
