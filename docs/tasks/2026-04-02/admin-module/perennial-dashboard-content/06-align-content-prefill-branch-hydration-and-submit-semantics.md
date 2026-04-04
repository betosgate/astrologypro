# Align Content Prefill Branch Hydration And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: branch hydration, add/edit payload shaping, conditional field omission, content-type-aware submit behavior
- Estimate: 1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/perennial-dashboard-content/06-align-content-prefill-branch-hydration-and-submit-semantics.md`

## Goal

Align edit hydration and submit logic so each content-type branch round-trips safely with the backend once the branch workflows are implemented.

## Verified Current Code Truth

- Angular edit flow resolves a record and mounts the correct branch before or during field hydration.
- Angular submit sends the active branch-specific field set and updates with `_id` on edit.
- Angular branch state also affects which fields are added, removed, or omitted during editing and saving.
- Next currently relies on a generic form model that assumes one shared content schema.
- Once branch parity is implemented, incorrect hydration or stale-field submission will become the main regression risk.

## User-Visible Problem

Even if all branch fields exist visually, the module can still break if edit mode mounts the wrong branch, stale hidden fields are submitted, or branch-specific payloads are serialized incorrectly.

## Required Behavior

1. Edit mode must mount and hydrate the correct content-type branch.
2. Secondary branch controls must also hydrate correctly.
3. Submit payload must include only the relevant active branch fields.
4. Hidden or no-longer-applicable fields must be omitted safely.
5. Add and edit flows must remain stable across all supported content types.

## Tasks

1. Implement content-type-aware edit hydration.
2. Implement secondary branch hydration for stream source, video source, and reminders.
3. Add content-type-aware payload shaping with safe omission of stale fields.
4. Validate `_id` handling and shared field serialization on edit.
5. Run full branch-by-branch create/edit regression validation.

## Acceptance Criteria

- edit mode mounts the correct branch for each content type
- secondary branch state rehydrates correctly
- submit payload contains only relevant active-branch fields
- stale hidden fields are not accidentally saved
- no hidden data-shape regression remains in the module

## Verification Test Plan

1. Open `/admin/perennial-content/edit/[id]` for one record of each content type and confirm the correct branch loads.
2. Change secondary branch controls and verify dependent values update correctly.
3. Save edited records and inspect whether irrelevant fields are omitted safely.
4. Reopen saved records and verify branch hydration still matches the persisted data.
5. Run a final create/edit walkthrough for all supported content types.

## Implementation Notes (2026-04-02)

`PerennialContentForm` in `perennial-content-form.tsx`:
- Edit fetch: `content/content-fetch` POST `{ _id: id }`. Response shape: `data.results?.res ?? data.results ?? data`.
- Hydration: `useEffect` on `record` calls `reset()` with all fields including `content_type`. Because content_type is set first in the form state (same `reset()` call), the correct branch renders immediately on mount.
- Submit: explicit payload shaped per `values.content_type`. Base fields always included; branch-specific fields added only from active branch; stale fields from inactive branches never sent.
- `_id` included on edit. No reliance on GenericFormPage generic serialization.
- Add route: no entity fetch (isEdit = false, query disabled).
- Endpoints: `content/content-add` (add), `content/content-update` (edit). Cache keys `content/content-list` and `content/content-list-count` invalidated on success.

## Notion Summary

P1 integration gap: once the content-type branches exist, the main risk shifts to edit hydration and submit semantics. Make branch-aware prefill and payload shaping explicit before treating this module as migrated.
