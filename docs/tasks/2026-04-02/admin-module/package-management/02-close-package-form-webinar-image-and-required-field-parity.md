# Close Package Form Webinar Image And Required Field Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: form fields, uploads, validation, edit hydration
- Estimate: 1-2 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/package-management/02-close-package-form-webinar-image-and-required-field-parity.md`

## Goal

Bring the Next package add/edit form to Angular parity for webinar linkage, package image authoring, and required field validation.

## Verified Current Code Truth

- Angular form includes:
  - webinar multi-select from `webinar/fetch-all-webinar`
  - package image upload
  - required `price`
  - required `description`
- Angular edit flow hydrates existing image metadata and webinar selections back into the form.
- Next form currently includes price and description fields, but:
  - they are not validated as required
  - there is no webinar field
  - there is no package image field
- Next form currently does not model edit hydration for webinar linkage or image metadata.

## User-Visible Problem

Admins in Next cannot attach webinars or package images the way Angular allows, and required package business fields are currently weaker than the live Angular form expects.

## Required Behavior

1. Package form must support webinar multi-select.
2. Package form must support package image upload and edit rehydration.
3. `price` must be validated consistently with Angular.
4. `description` must be validated consistently with Angular.
5. Add and edit must preserve the expected webinar and image data shape.

## Tasks

1. Add webinar multi-select backed by `webinar/fetch-all-webinar`.
2. Add package image upload authoring with backend-compatible stored image shape.
3. Make `price` required.
4. Make `description` required.
5. Ensure edit mode rehydrates webinar selections and image metadata correctly.

## Acceptance Criteria

- admins can select one or more webinars for a package
- admins can upload and replace a package image
- price is required
- description is required
- edit mode rehydrates webinar and image values correctly

## Verification Test Plan

1. Open `/admin/packages/add` and verify price and description are required.
2. Create a package with linked webinars and an uploaded image.
3. Reopen the saved package in edit mode and verify webinar and image values hydrate correctly.
4. Update the image and webinar selections and confirm save succeeds.

## Notion Summary

P1 form parity gap: the Next Package form needs webinar linkage, package image upload, and required price/description validation to match the working Angular package-authoring flow.
