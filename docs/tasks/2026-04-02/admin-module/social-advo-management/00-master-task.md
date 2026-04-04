# Master Task - Social Advo Management Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Social Advo Post
- Status: Done (bulk actions + S3 bucket upload deferred)
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/social-advo-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/social-advo-management`
- Primary Next Routes:
  - `/admin/social-advo`
  - `/admin/social-advo/add`
  - `/admin/social-advo/edit/[id]`

## Objective

Close the remaining Angular-to-Next parity gaps for the Social Advo Post admin module, focusing on real list behaviors and on the actual media authoring and edit round-trip model used by Angular.

## Current Product Truth

- The current Next module already covers the base CRUD flow.
- The biggest remaining gaps are not routing or basic fields.
- The verified parity gaps are:
  - list preview
  - created and updated date-range filters
  - bulk list actions
  - required-description validation parity
  - uploaded image/audio/video workflow parity
  - edit hydration and submit compatibility for stored media values

## Child Tasks

1. `01-close-social-advo-list-preview-filter-and-bulk-action-parity.md`
2. `02-close-social-advo-form-media-and-validation-parity.md`
3. `03-align-social-advo-edit-hydration-and-submit-semantics.md`

## Done Definition

- `/admin/social-advo` supports preview, date-range filtering, and bulk actions aligned to Angular’s working admin flow.
- add and edit routes support image, audio, and video authoring in a backend-compatible way.
- description validation is aligned where Angular requires it.
- edit mode correctly hydrates stored media fields and save preserves the backend-compatible shape.
- existing row-level edit, delete, and status flows continue to work.

## Verification Gate

1. Validate preview works from the list without breaking current row actions.
2. Validate created-date and updated-date range filters return the expected result windows.
3. Validate bulk status update and bulk delete work for selected posts.
4. Validate add and edit both support image, audio, and video media authoring.
5. Validate an edited record reopens with the saved media values intact.

## Notion Ready Summary

Title: Social Advo Post parity

Summary:
The Next Social Advo Post module already covers the basic admin CRUD flow, but it still misses several Angular behaviors that matter operationally: preview, date-range filtering, bulk list actions, and the real uploaded media workflow for image, audio, and video fields. The highest-risk work is the media round-trip model, because Angular stores and rehydrates uploaded asset objects while the current Next form still treats those inputs more generically.
