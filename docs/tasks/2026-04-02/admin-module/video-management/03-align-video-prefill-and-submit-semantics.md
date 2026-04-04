# Align Video Prefill And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: edit prefill behavior, nested record hydration, payload normalization
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/video-management/03-align-video-prefill-and-submit-semantics.md`

## Goal

Align Next video edit/save behavior with the real returned record shape so both top-level fields and nested video entries round-trip correctly.

## Verified Current Code Truth

- Angular edit flow resolves a record and hydrates the form before editing.
- Angular submit sends:
  - `title`
  - `priority`
  - `description`
  - `status`
  - `videos`
- Angular includes `_id` on edit.
- Next custom form already:
  - fetches an existing record in edit mode
  - prepopulates top-level fields
  - hydrates `videos` when the returned record contains an array
  - submits `_id` on edit
  - normalizes `priority` and `status`
- Next nested `videos` handling should still be validated against the real returned record shape once uploaded-file entries and nested-entry editing are fully supported.

## User-Visible Problem

Even with UI parity work, the video module can still break if nested `videos` records are hydrated or serialized differently from backend expectations.

## Required Behavior

1. Edit mode must reliably prepopulate top-level and nested video data.
2. Submit payload must preserve backend-compatible top-level and nested structures.
3. Numeric and boolean fields must be normalized correctly.
4. Nested uploaded-file entries must round-trip safely once implemented.
5. Add route should not rely on edit-only assumptions.

## Tasks

1. Validate that the current Next edit fetch returns the full functional video data needed for form hydration.
2. Verify nested `videos` entries rehydrate correctly for both YouTube and uploaded-file variants.
3. Confirm `_id`, `priority`, and `status` are serialized correctly on save.
4. Add explicit payload transformation only where the current custom form is insufficient.
5. Re-test create and edit flows after nested-entry parity is implemented.

## Acceptance Criteria

- edit route prepopulates correctly from the active fetch flow
- nested `videos` entries rehydrate correctly
- submit payload uses correct identity and normalized scalar values
- nested uploaded-file entries round-trip safely once supported
- no hidden data-shape regression remains in the video module

## Verification Test Plan

1. Open `/admin/videos/edit/[id]` for a populated video and verify top-level fields load correctly.
2. Verify nested YouTube entries rehydrate correctly in edit mode.
3. After uploaded-file parity is implemented, verify uploaded-file entries also rehydrate correctly.
4. Submit add and edit flows and verify payload key/type correctness.
5. Reopen the saved record and confirm persisted nested video values round-trip correctly.

## Implementation Notes (2026-04-02)

Already correct before this session. Full audit confirmed in `video-form.tsx`:
- Edit fetch: `videomanagement/video-data-fetch` POST `{ _id: id }`. Response shape: `data.results?.res ?? data.results ?? data`.
- Top-level hydration: `useEffect` on `record` calls `form.reset()` with `title`, `priority` (as string), `description`, `status: record.status === 1 || record.status === true`.
- Nested videos: `if (Array.isArray(rec.videos)) setVideos(rec.videos)` — hydrates both YouTube and file entries.
- Submit: explicit payload `{ title, priority: parseFloat(), description, status: 0|1, videos }` plus `_id` on edit.
- Add route performs no entity fetch.
- No code changes required for this task; all verified as part of Task 02 implementation.

## Notion Summary

P1 integration gap: the Next Video Management module needs an explicit prefill and payload audit so nested video entries and top-level fields remain stable across add/edit flows.
