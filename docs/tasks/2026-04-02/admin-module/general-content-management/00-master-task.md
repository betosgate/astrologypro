# Master Task - General Content Management Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> General Content List
- Status: Planned
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/general-content-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/general-content-management`
- Primary Next Routes:
  - `/admin/content/general`
  - `/admin/content/general/add`
  - `/admin/content/general/edit/[id]`

## Objective

Close the remaining Angular-to-Next parity gaps for the General Content admin module, focusing on the real form completeness and save-semantics differences that still affect trustworthy create and edit behavior.

## Current Product Truth

- The Next general-content module already has the main list and add/edit path.
- The remaining verified gaps are:
  - missing `assets` upload on the form
  - sign option loading compatibility for the working wheel-sign autocomplete endpoint
  - Angular-style submit transformation for `sign`, `assets_path_link`, and `added_by`

## Child Tasks

1. `01-close-general-content-form-assets-parity.md`
2. `02-align-general-content-sign-option-loading-and-submit-semantics.md`

## Done Definition

- add and edit forms support the uploaded `assets` field.
- sign options load correctly from the working autocomplete endpoint.
- create and edit both preserve the module’s sign and asset save semantics.
- reopening a saved record shows the expected persisted values.

## Verification Gate

1. Validate add and edit support the `assets` upload field.
2. Validate sign options load correctly in the sign selector.
3. Validate create sends the expected sign and asset metadata.
4. Validate edit preserves the same sign and asset behavior.
5. Reopen a saved record and confirm the persisted values are reflected correctly.

## Notion Ready Summary

Title: General Content Management parity

Summary:
The Next General Content module already has the main screens in place, but the remaining work is on the form side. The real gaps are the missing `assets` upload, compatibility with the working sign-autocomplete response shape, and matching Angular’s submit behavior for sign label, asset link data, and `added_by`.
