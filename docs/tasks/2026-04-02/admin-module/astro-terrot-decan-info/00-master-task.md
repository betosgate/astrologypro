# Master Task - Astro Terrot Decan Info Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Astro Terrot Decan Info
- Status: Planned
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/astro-terrot-decan-info`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/astro-terrot-decan-info`
- Primary Next Routes:
  - `/admin/astrology/decan-info`
  - `/admin/astrology/decan-info/add`
  - `/admin/astrology/decan-info/edit/[id]`

## Objective

Close the remaining Angular-to-Next parity gaps for the Astro Terrot Decan Info admin module, focusing on the real data-contract and list-visibility differences that still block trustworthy add and edit behavior.

## Current Product Truth

- The Next decan-info module already covers the main list and add/edit path.
- The remaining verified gaps are:
  - created-on visibility on the list
  - sign option loading compatibility for the live autocomplete endpoint
  - sign edit hydration from `sign_id`
  - tarot image edit hydration and submit semantics
  - Angular-style submit transformation for `sign` and `tarrot_thumb_image`

## Child Tasks

1. `01-close-decan-info-list-created-on-parity.md`
2. `02-align-sign-option-loading-and-edit-hydration.md`
3. `03-align-decan-info-submit-and-image-semantics.md`

## Done Definition

- `/admin/astrology/decan-info` shows `created_on` consistently with Angular.
- add and edit forms load sign options from the working endpoint response shape.
- edit form rehydrates the selected sign and existing tarot image correctly.
- save requests preserve the Angular business semantics for sign id, sign label, and tarot image payloads.
- existing list navigation and basic form validation continue to work.

## Verification Gate

1. Validate the decan-info list shows `created_on`.
2. Validate the sign dropdown loads real options from the existing autocomplete endpoint.
3. Validate editing an existing record preselects the current sign correctly.
4. Validate editing an existing record shows the current tarot image correctly.
5. Validate create and edit both save with the expected sign and tarot-image semantics.
6. Reopen the saved record and confirm the sign and image hydrate correctly.

## Notion Ready Summary

Title: Astro Terrot Decan Info parity

Summary:
The Next Astro Terrot Decan Info module already has the main screens in place, but the important remaining work is around data compatibility rather than UI scaffolding. The key gaps are created-on list visibility, sign option loading and edit hydration, and matching Angular’s save semantics for `sign_id`, `sign`, and the tarot thumbnail image.
