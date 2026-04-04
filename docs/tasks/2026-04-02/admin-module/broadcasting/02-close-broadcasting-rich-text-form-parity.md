# Close Broadcasting Rich Text Form Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: short description editor, description editor, content-authoring fidelity
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/broadcasting/02-close-broadcasting-rich-text-form-parity.md`

## Goal

Close the authoring gap between Angular Broadcasting and the current Next broadcasting form so admins can create and edit broadcast content with the same formatting fidelity.

## Verified Current Code Truth

- Angular add/edit form includes:
  - `title`
  - rich `shortDescription`
  - rich `description`
  - `status`
- Angular uses CKEditor-style rich-text authoring for both content fields.
- Next add/edit currently supports the same field set, but `shortDescription` and `description` are plain textareas.
- Broadcasting does not appear to require the broader media workflows seen in Blog or Video.

## User-Visible Problem

Next can author only a simplified text version of a broadcast. That risks content-formatting loss or forces continued use of the Angular app for formatting-sensitive broadcast messages.

## Required Behavior

1. Replace plain textareas with a rich-content authoring surface if backend content expects HTML.
2. Preserve create and edit usability for both content fields.
3. Keep the broadcasting form simpler than Blog and Video; do not add unnecessary media or workflow complexity.
4. Ensure stored rich-text content can round-trip safely through edit mode.
5. Preserve current title and status behavior.

## Tasks

1. Introduce a rich editor or equivalent HTML-safe authoring surface for `shortDescription`.
2. Introduce the same for `description`.
3. Verify edit mode rehydrates formatted content safely.
4. Confirm submit behavior preserves formatted content rather than flattening it.
5. Re-test create and edit flows after the form component change.

## Acceptance Criteria

- `shortDescription` supports the required formatting fidelity
- `description` supports the required formatting fidelity
- existing records with formatted content can be edited without losing content
- title and status behavior remain intact

## Verification Test Plan

1. Open `/admin/broadcasting/add` and confirm both content fields support rich-text authoring.
2. Create a broadcast with formatting in both fields and verify the saved content round-trips correctly.
3. Open `/admin/broadcasting/edit/[id]` and confirm formatted content rehydrates correctly.
4. Save an edited record and confirm formatting is preserved.
5. Re-test plain create/edit with no special formatting to confirm no regression.

## Implementation Notes (2026-04-02)

Created `broadcasting/_components/broadcasting-form.tsx` and updated both `add/page.tsx` and `edit/[id]/page.tsx` to use it instead of `GenericFormPage`:
- `BroadcastingForm` uses `react-hook-form` with `Controller` for `shortDescription` and `description`, both rendered by `RichHtmlEditor`.
- Status uses inline custom switch (same pattern as `AssignmentForm`) — boolean toggle that submits as 0/1.
- Title uses a plain `Input` with `register()` validation.
- `GenericFormPage` is no longer used for broadcasting; removing its `textarea` rendering ensures HTML content is not accidentally stringified or flattened.
- `BroadcastingForm` is reusable for both add and edit via `useParams()` — id presence determines mode.

## Notion Summary

P1 authoring gap: Angular Broadcasting uses rich-text editors for both short and full descriptions. Next currently uses plain textareas and needs content-authoring parity.
