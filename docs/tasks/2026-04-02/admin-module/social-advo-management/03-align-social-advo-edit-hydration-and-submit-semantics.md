# Align Social Advo Edit Hydration And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: edit prefill, media hydration, payload normalization
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/social-advo-management/03-align-social-advo-edit-hydration-and-submit-semantics.md`

## Goal

Ensure the Next Social Advo edit flow hydrates and saves the record in a backend-compatible way once media parity is in place.

## Verified Current Code Truth

- Angular edit route resolves `social-advo/social-advo-edit`.
- Angular edit populates top-level fields from the returned record and reuses stored media values for:
  - `images`
  - `audio`
  - `video`
- Angular submit sends the current form value and includes `_id` on update.
- Next edit route already uses the Angular-aligned edit fetch flow.
- The current generic Next form reset behavior converts non-switch field values to strings, which is not suitable for Angular-style stored media arrays or asset objects.
- The current shared file field expects a single string value and is therefore not sufficient for reliable media rehydration in this module.

## User-Visible Problem

Even after media controls are upgraded, the module can still fail if edit hydration and submit serialization do not preserve the backend-compatible media shape.

## Required Behavior

1. Edit mode must prepopulate all top-level scalar fields correctly.
2. Edit mode must rehydrate stored image, audio, and video values correctly.
3. Submit payload must preserve the expected media structure on update.
4. Add mode must avoid edit-only assumptions.
5. Save and reopen must round-trip without silently dropping existing media values.

## Tasks

1. Audit the real `social-advo/social-advo-edit` response shape for scalar and media fields.
2. Add explicit hydration logic for media fields if the shared generic form is not sufficient.
3. Add explicit payload normalization for image, audio, and video values if the shared generic submit path is not sufficient.
4. Verify `_id`, boolean switches, and other scalar fields still serialize correctly.
5. Reopen saved records and confirm persisted media values round-trip accurately.

## Acceptance Criteria

- edit route prepopulates all required fields correctly
- stored image, audio, and video values rehydrate correctly
- save payload keeps backend-compatible media structure
- reopening the edited record shows the saved media state accurately
- no add/edit regression remains after the media workflow upgrade

## Verification Test Plan

1. Open `/admin/social-advo/edit/[id]` for a record with existing media.
2. Verify image, audio, and video values are all represented correctly in the UI.
3. Update one media field and one scalar field, then save.
4. Reopen the same record and verify both changes persisted correctly.
5. Create a new record after the hydration changes and confirm add flow still works.

## Notion Summary

P1 integration gap: the Next Social Advo edit flow needs explicit hydration and submit-shape verification so uploaded media values survive edit, save, and reopen cycles without data loss.
