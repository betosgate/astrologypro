# Close Quarter Form Description Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: form validation, rich text authoring, edit rehydration
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/quarter-management/02-close-quarter-form-description-parity.md`

## Goal

Bring the Next quarter add/edit form to Angular parity for description validation and authoring behavior.

## Verified Current Code Truth

- Angular form includes:
  - `quarter_name`
  - `sit_count`
  - `priority`
  - `description` as required
  - `status`
- Angular renders `description` as an editor field, not a plain textarea.
- Next form currently includes the same business fields, but `description` is:
  - a plain textarea
  - not marked as required
- Next also includes `start_date` and `end_date`, but those extra fields do not by themselves establish a parity gap for missing Angular behavior.

## User-Visible Problem

Admins in Next can save a quarter without required description content and do not get the richer description authoring flow Angular currently provides.

## Required Behavior

1. `description` must be validated consistently with the Angular form.
2. Quarter description authoring must support the intended rich text workflow.
3. Edit mode must rehydrate saved description content correctly.
4. Existing non-description fields must keep working without regression.

## Tasks

1. Make `description` required in the Next quarter form.
2. Replace the plain textarea with the project-appropriate rich text editing approach used for comparable admin modules.
3. Ensure edit mode hydrates saved description content into the upgraded input cleanly.
4. Verify add and edit submit payloads still preserve the expected description value.

## Acceptance Criteria

- description is required in add and edit flows
- description is authored through a rich text input
- edit mode rehydrates saved description content correctly
- quarter name, sit count, priority, and status continue to work

## Verification Test Plan

1. Open `/admin/quarters/add` and verify the form blocks submit when description is empty.
2. Enter formatted description content and save a new quarter.
3. Reopen the saved quarter and verify the description rehydrates correctly.
4. Update the description and one scalar field, save again, and verify both changes persist.

## Notion Summary

P1 form parity gap: the Next Quarter form needs required rich-description authoring so quarter records are created and edited with the same content expectations as Angular.
