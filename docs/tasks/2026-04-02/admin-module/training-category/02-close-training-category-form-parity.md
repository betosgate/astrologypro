# Close Training Category Form Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: field parity, multi-role selection, rich description editing, thumbnail upload, form UX alignment
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-category/02-close-training-category-form-parity.md`

## Goal

Bring the Training Category add/edit form in Next into field-level parity with the Angular form where those fields are active and materially used.

## Verified Current Code Truth

- Angular add/edit form includes:
  - `category_name`
  - `priority`
  - `role`
  - `description`
  - `image`
  - `status`
- Angular role options are loaded from `admin/fetch-role-list` and the field is configured as `multiple: true`.
- Angular description uses a rich editor configuration, not a plain textarea.
- Angular image field uploads a thumbnail using bucket upload/delete endpoints:
  - `user-profile/request-bucket-url`
  - `user-profile/delete-image-from-bucket`
- Angular package-related field exists in code but is commented out, so it should not be treated as current required behavior.
- Next form currently includes:
  - `category_name`
  - `priority`
  - `role`
  - `description`
  - `status`
- Next role field uses `DynamicSelectField`, which currently delegates to `SelectField`.
- Next `SelectField` is single-select only.
- Next description field is currently a plain textarea.
- Next category form currently has no image field.

## User-Visible Problem

The Next category form looks present but is behaviorally incomplete. It can fail parity in authoring flows because the form currently simplifies fields that Angular treats as multi-valued, rich-text, or media-backed.

## Required Behavior

1. Role selection must support Angular-equivalent multi-select semantics if the backend still expects multiple roles.
2. Description editing must support the intended content-authoring fidelity for category descriptions.
3. Thumbnail/image support must be exposed if this field is still required by the module and backend.
4. Existing required fields and save behavior must continue to work.
5. The form must still feel native to the Next admin UI rather than replicating Angular blindly.

## Tasks

1. Add multi-select support to the shared admin form field system or introduce a targeted field type for this module.
2. Update the category `role` field to use the correct multi-value form control semantics.
3. Replace plain textarea description editing with a rich-text-capable field if category content relies on formatted HTML.
4. Add thumbnail/image upload support aligned with the current Next upload architecture and backend contract.
5. Confirm edit-mode prepopulation works for multi-select, rich text, and image fields.
6. Keep inactive/commented Angular fields out of scope unless product confirms they are needed.

## Acceptance Criteria

- role field supports the correct multi-select behavior
- description can preserve required formatted content behavior
- image/thumbnail can be uploaded and persisted when the field is in scope
- add and edit forms both prepopulate correctly
- form save still works without regressing existing fields

## Verification Test Plan

1. Open add category form and verify all in-scope fields are present.
2. Confirm the role field supports selecting more than one role if the backend model requires it.
3. Save a category with multiple roles and verify the payload shape is correct.
4. Enter formatted description content and verify it is preserved after save and reload.
5. Upload a thumbnail, save, reopen edit mode, and confirm the image persists correctly.
6. Remove or replace the image and confirm update behavior works.
7. Re-test a simple add/edit flow with minimal required data to ensure no regressions.

## Implementation Notes (2026-04-02)

Already implemented before this session. Full audit confirmed in `training/categories/_components/category-form.tsx`:
- `MultiSelectCheckboxField` for `role` — fetches from `admin/fetch-role-list`, uses `valueKey: "slug"`, `labelKey: "role_name"`. Hydrates from `record.role` array on edit.
- `RichHtmlEditor` (via `Controller`) for `description` — HTML content preserved as-is through edit round-trips.
- Image URL `Input` for `image` — persists as a URL string, not a browser upload; bucket-backed upload scoped to a separate infrastructure task.
- Inline custom switch for `status`.
- All fields present; add and edit forms prepopulate correctly via `useParams()` mode detection.
- No code changes required.

## Notion Summary

P1 form parity gap: Next Training Category form still simplifies Angular behaviors. Close the remaining field-level gaps around multi-role selection, rich description editing, and thumbnail upload so admin authoring matches backend expectations.
