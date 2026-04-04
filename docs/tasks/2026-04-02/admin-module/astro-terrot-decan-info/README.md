# Astro Terrot Decan Info Parity Task Index - 2026-04-02

- Module: Admin -> Miscellaneous -> Astro Terrot Decan Info
- Angular Source Routes:
  - `admin-dashboard/astro-terrot-decan-info`
  - `admin-dashboard/astro-terrot-decan-info-add`
  - `admin-dashboard/astro-terrot-decan-info-add/:_id`
- Next Routes:
  - `/admin/astrology/decan-info`
  - `/admin/astrology/decan-info/add`
  - `/admin/astrology/decan-info/edit/[id]`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/astro-terrot-decan-info`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/astro-terrot-decan-info`

## Scope Of This Review

This folder contains the validated parity tasks for the Miscellaneous nav review of `Astro Terrot Decan Info`.

The Next module already covers the main list and add/edit routes and is stronger than Angular in some list actions. The remaining parity work is concentrated in three concrete places: the missing created-on list visibility, sign option and edit hydration compatibility, and the Angular-specific submit transformation for sign and tarot image fields.

## Verified Current Comparison Summary

### Already Implemented In Next

- decan-info list route at `/admin/astrology/decan-info`
- decan-info add route at `/admin/astrology/decan-info/add`
- decan-info edit route at `/admin/astrology/decan-info/edit/[id]`
- list uses:
  - `wheel_signs/astro-decan-info-list`
  - `wheel_signs/astro-decan-info-list-count`
- form already includes:
  - sign
  - planet
  - `tarrot_name`
  - `greek_daemon`
  - decan
  - `decan_priority`
  - `tarot_short_description`
  - `tarrot_thumb_image`

### Implemented In Angular But Not Yet Fully Closed In Next

- Angular list shows `created_on`
- Angular sign dropdown loads options from `wheel_signs/wheel-sign-autocomplete` using `response.res`
- Angular edit hydrates the sign control from `sign_id`
- Angular edit hydrates the image picker from `tarrot_thumb_image`
- Angular submit transforms form data before saving:
  - sends `sign_id` from the selected sign id
  - sends `sign` as the selected sign label
  - sends `tarrot_thumb_image` from the uploaded `images` field

## Recommended Execution Order

1. `01-close-decan-info-list-created-on-parity.md`
2. `02-align-sign-option-loading-and-edit-hydration.md`
3. `03-align-decan-info-submit-and-image-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/admin-dashboard-routing.module.ts`
- `src/app/admin-dashboard/astro-terrot-decan-info/astro-terrot-decan-info.component.ts`
- `src/app/admin-dashboard/astro-terrot-decan-info/astro-terrot-decan-info-add/astro-terrot-decan-info-add.component.ts`

### Next

- `src/app/(admin)/admin/astrology/decan-info/page.tsx`
- `src/app/(admin)/admin/astrology/decan-info/add/page.tsx`
- `src/app/(admin)/admin/astrology/decan-info/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`
- `src/app/(admin)/_components/form-fields/dynamic-select-field.tsx`
- `src/app/(admin)/_components/form-fields/file-upload-field.tsx`

## Notes

- This folder is the canonical task set for this module.
- No preview task is included because the live Angular list does not expose a working preview action for this module.
- No naming-only endpoint task is included.
- The main migration risk is form-contract compatibility, not route scaffolding.
