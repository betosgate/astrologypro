# Master Task - Astro Terrot Decan Video And Pronuncement Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Astro Terrot Decan Video And Pronuncement
- Status: Planned
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/astro-terrot-decan-video-pronuncement`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/astro-terrot-decan-video-pronuncement`
- Primary Next Routes:
  - `/admin/astrology/decan-videos`
  - `/admin/astrology/decan-videos/add`
  - `/admin/astrology/decan-videos/edit/[id]`

## Objective

Close the remaining Angular-to-Next parity gaps for the Astro Terrot Decan Video And Pronuncement admin module, focusing on the real list-search, preview, and branch-specific content-contract differences.

## Current Product Truth

- The Next decan-videos module already has the main screens in place.
- The remaining verified gaps are:
  - sign and decan search parity on the list
  - preview access from the list
  - sign selection parity in add and edit
  - branch-aware form behavior for uploaded video, YouTube video, and pronouncement
  - nested `content` hydration, upload semantics, and submit payload compatibility

## Child Tasks

1. `01-close-decan-video-list-search-and-preview-parity.md`
2. `02-build-sign-selection-and-branch-aware-form-parity.md`
3. `03-align-decan-video-content-hydration-upload-and-submit-semantics.md`

## Done Definition

- `/admin/astrology/decan-videos` supports sign and decan search with a usable admin workflow.
- preview opens from the list and shows the row content correctly.
- add and edit forms use a real sign-selection flow rather than free-text sign entry.
- all three content branches behave correctly.
- create and edit both save and reopen correctly using the expected nested `content` semantics and uploaded assets.

## Verification Gate

1. Validate list search by sign and decan returns expected rows.
2. Validate preview opens from the list and shows the current row content.
3. Validate add and edit both load and preserve the selected sign correctly.
4. Validate uploaded-video records save and reopen with thumbnail and video values.
5. Validate YouTube-video records save and reopen with the correct fields.
6. Validate pronouncement records save and reopen with assets and text fields.

## Notion Ready Summary

Title: Astro Terrot Decan Video And Pronuncement parity

Summary:
The Next Decan Videos module already has the route shell and basic list in place, but the important remaining work is around the real admin behavior: sign/decan search, preview from the list, sign selection parity, and matching Angular’s nested `content` model for uploaded video, YouTube video, and pronouncement records.
