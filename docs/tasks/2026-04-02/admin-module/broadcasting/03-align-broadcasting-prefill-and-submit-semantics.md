# Align Broadcasting Prefill And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: edit prefill behavior, rich-text rehydration, payload normalization
- Estimate: 0.5 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/broadcasting/03-align-broadcasting-prefill-and-submit-semantics.md`

## Goal

Validate and align broadcasting edit/save behavior so rich-text fields prefill and submit safely once form parity is restored.

## Verified Current Code Truth

- Angular edit flow resolves a record and hydrates the form before editing.
- Angular submit sends:
  - `title`
  - `shortDescription`
  - `description`
  - `status`
- Angular includes `_id` on edit.
- Next generic form already fetches a record for edit mode and normalizes switch fields for submit.
- Once rich-text parity is implemented, broadcasting prefill/save behavior must still be verified so generic form normalization does not flatten or mis-handle HTML-backed content.

## User-Visible Problem

Even if the visible form looks correct, edit/save behavior can still drift if formatted content is rehydrated or serialized incorrectly.

## Required Behavior

1. Edit mode must reliably prepopulate both rich-text fields.
2. Submit payload must preserve backend-compatible field shapes for formatted content.
3. Numeric/boolean normalization must remain correct for existing fields.
4. Add route should not rely on edit-only assumptions.
5. The module should not rely on accidental generic behavior for critical rich-text transformations.

## Tasks

1. Validate that the current Next edit fetch returns the full functional broadcasting data needed for form hydration.
2. Verify rich-text field values rehydrate correctly in edit mode.
3. Confirm `_id` and `status` are serialized correctly on save.
4. Add explicit broadcasting-specific transformation only if the generic form layer is insufficient.
5. Re-test create and edit flows after rich-text parity is implemented.

## Acceptance Criteria

- edit route prepopulates correctly from the active fetch flow
- rich-text fields rehydrate correctly
- submit payload preserves formatted content safely
- status and identity handling remain correct
- no hidden data-shape regression remains in the broadcasting module

## Verification Test Plan

1. Open `/admin/broadcasting/edit/[id]` for a populated record and verify all fields load correctly.
2. Confirm formatted short and full descriptions rehydrate correctly after rich-text parity is implemented.
3. Submit add and edit flows and verify payload key/type correctness.
4. Reopen the saved record and confirm formatted content round-trips correctly.
5. Re-test list behavior after saving to ensure no regression in updated-date filtering or status display.

## Implementation Notes (2026-04-02)

Satisfied by the bespoke `BroadcastingForm` implemented in Task 02. Full audit confirmed:
- Edit fetch: `brodcasting/brodcast-data-fetch` POST `{ _id: id }`. Response shape: `data.results?.res ?? data.results ?? data`.
- Hydration: `useEffect` on `record` calls `reset()` with `title`, `shortDescription`, `description` (all as strings, HTML content preserved as-is), `status: r.status === 1 || r.status === true`.
- Submit: explicit payload `{ title, shortDescription, description, status: 0|1 }` plus `_id` on edit. HTML content in rich text fields passes through unchanged — no stringify, no flattening.
- Add route: no entity fetch. Clean defaults.
- No additional code changes required.

## Notion Summary

P1 integration gap: the Next Broadcasting module needs an explicit prefill and payload audit so rich-text content remains stable across add/edit flows.
