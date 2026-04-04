# Master Task - Package Management Parity - 2026-04-02

- Module: Admin -> Miscellaneous -> Package
- Status: Done
- Owner: Frontend
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/package-management`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/package-management`
- Primary Next Routes:
  - `/admin/packages`
  - `/admin/packages/add`
  - `/admin/packages/edit/[id]`

## Objective

Close the remaining Angular-to-Next parity gaps for the Package admin module, focusing on list preview and the missing package-authoring fields and validations still present in Angular.

## Current Product Truth

- The Next package module already supports the core CRUD workflow.
- The remaining verified gaps are:
  - list preview
  - created-date filtering
  - webinar linkage
  - package image upload
  - required price and description validation parity
  - stricter purchase-type branch behavior and payload semantics

## Child Tasks

1. `01-close-package-list-preview-and-date-filter-parity.md`
2. `02-close-package-form-webinar-image-and-required-field-parity.md`
3. `03-align-package-purchase-type-branching-and-submit-semantics.md`

## Done Definition

- `/admin/packages` supports preview and created-date filtering.
- add and edit forms support webinar linking and package image authoring.
- required package fields are validated consistently.
- purchase-type-specific fields and payload rules behave correctly for single, multiple, and subscription packages.
- existing list actions and edit hydration continue to work.

## Verification Gate

1. Validate preview works from the package list.
2. Validate created-date filtering returns the expected result window.
3. Validate add and edit support webinar linkage and image upload.
4. Validate price and description cannot be omitted where Angular requires them.
5. Validate single, multiple, and subscription package payloads save and reopen correctly.

## Notion Ready Summary

Title: Package Management parity

Summary:
The Next Package module already covers the core CRUD path, but it still misses important Angular business behavior: richer preview, created-date filtering, webinar linkage, package image upload, and stricter purchase-type-specific package authoring. The main work is on the form side, not route scaffolding.
