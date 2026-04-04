# Close Social Advo Form Media And Validation Parity - 2026-04-02

- Status: Done (S3 bucket upload deferred)
- Priority: P1
- Owner: Frontend
- Scope: add/edit form fields, media input model, validation rules
- Estimate: 1-2 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/social-advo-management/02-close-social-advo-form-media-and-validation-parity.md`

## Goal

Bring the Next Social Advo add/edit form to Angular parity for required validation and uploaded media authoring.

## Verified Current Code Truth

- Angular form includes:
  - `title`
  - `frequency`
  - `link`
  - `description` as required
  - `images` as uploaded file data
  - `audio` as uploaded file data
  - `video` as uploaded file data
  - `status`
  - `freq_change_enable`
- Angular media fields are configured as upload-backed file inputs and store structured uploaded asset values.
- Next form currently includes the same conceptual fields, but media handling is not equivalent:
  - `images` uses a single generic image file field
  - `audio` is modeled as URL text
  - `video` is modeled as URL text
- The shared `FileUploadField` is image-preview oriented and assumes a single string value, not Angular’s stored media-array pattern.
- Next form does not currently mark `description` as required.

## User-Visible Problem

Admins in Next cannot author social advo media the same way they do in Angular, and validation for required content is weaker than the current admin workflow expects.

## Required Behavior

1. `description` must be validated consistently with the Angular form.
2. Image authoring must support the backend-compatible uploaded media shape used by this module.
3. Audio authoring must support uploaded file workflow rather than only pasted URLs.
4. Video authoring must support uploaded file workflow rather than only pasted URLs.
5. The add/edit form should communicate the real stored media state clearly to admins.

## Tasks

1. Make `description` required in the Next Social Advo form unless a verified production exception is discovered during implementation.
2. Replace the current simplified media inputs with module-appropriate upload-backed image, audio, and video controls.
3. Ensure the form can display existing uploaded media values in edit mode.
4. Keep frequency, link, status, and `freq_change_enable` behavior intact while upgrading media handling.
5. Verify the chosen UI supports the actual stored payload shape returned by the backend for this module.

## Acceptance Criteria

- description is validated as required
- image upload matches the intended backend-compatible workflow
- audio upload matches the intended backend-compatible workflow
- video upload matches the intended backend-compatible workflow
- form still supports add and edit without regressing non-media fields

## Verification Test Plan

1. Open `/admin/social-advo/add` and verify `description` cannot be omitted.
2. Create a post with uploaded image media and verify it saves correctly.
3. Create a post with uploaded audio media and verify it saves correctly.
4. Create a post with uploaded video media and verify it saves correctly.
5. Edit an existing post and verify non-media fields still behave correctly after the media upgrade.

## Notion Summary

P1 form parity gap: the Next Social Advo form needs real upload-backed image, audio, and video handling plus required description validation to match the working Angular admin workflow.
