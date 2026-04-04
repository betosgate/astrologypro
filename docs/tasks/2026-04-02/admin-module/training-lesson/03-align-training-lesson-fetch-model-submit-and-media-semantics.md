# Align Training Lesson Fetch Model Submit And Media Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: add/edit prefill behavior, prerequisite field semantics, media payload normalization, explicit submit transformations
- Estimate: 1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-lesson/03-align-training-lesson-fetch-model-submit-and-media-semantics.md`

## Goal

Audit and align the lesson module so Next uses stable prefill behavior, backend-compatible prerequisite semantics, and correct payload shapes for add/edit operations, especially once dependent fields and media collections are supported.

## Verified Current Code Truth

- Angular edit prepopulation uses lesson edit route data and `admin/lesson-edit` semantics.
- Angular add flow does not need a record fetch before rendering.
- Angular submit logic:
  - converts `status` to `1` or `0`
  - includes `_id` on edit
  - removes empty `image`, `video`, `audio`, and `assets` arrays before submit
  - submits to `admin/lesson-add` or `admin/lesson-update`
- Angular prerequisite field key is `prerequisite_lesson`.
- Next add page still declares `fetchEndpoint: admin/lesson-fetch`, which is unnecessary for add mode.
- Next edit page correctly uses `admin/lesson-edit`.
- Next currently uses field key `pre_requisite_lesson`, which is not the Angular field name.
- Next generic form page uses generic transformations and sends `id` for edit identity by default.
- Next shared file upload field currently returns base64 string data for a single selected file, which is not equivalent to Angular’s bucket-backed multi-file metadata structure.

## User-Visible Problem

Even with UI parity work, the lesson module can remain unstable if field keys, payload identity, dependent data, and media data are serialized differently from backend expectations.

## Required Behavior

1. Add route should not perform misleading entity fetch behavior.
2. Edit route should prepopulate correctly from the available lesson record data.
3. Lesson submit payload must use backend-compatible identity and prerequisite-field semantics.
4. Media fields must serialize in the structure expected by the API, not merely as generic single-file base64 strings.
5. Empty media collections should be omitted when appropriate, matching Angular behavior.

## Tasks

1. Remove or correct unnecessary add-page fetch configuration.
2. Verify `_id` vs `id` expectations for lesson edit submit.
3. Normalize prerequisite field save/rehydration semantics to match backend expectations.
4. Add explicit lesson payload transformation logic if shared generic form behavior is insufficient.
5. Define and implement the correct media payload format for lesson uploads.
6. Ensure empty media collections are omitted safely on submit.

## Acceptance Criteria

- add route does not perform unnecessary entity fetch behavior
- edit route prepopulates correctly
- submit payload uses correct identity and field names
- media payload format is backend-compatible
- empty media arrays are not sent when they should be omitted
- no hidden data-shape regression remains in the lesson module

## Verification Test Plan

1. Open add page and confirm no unnecessary record fetch is attempted.
2. Open edit page and confirm existing lesson data loads correctly.
3. Submit add and edit flows and verify payload key/type correctness.
4. Confirm prerequisite field is saved and rehydrated correctly.
5. Confirm media payload shape is accepted by backend and rehydrates correctly on edit.
6. Submit with no media selected and verify empty media collections are omitted safely.

## Implementation Notes (2026-04-02)

Already correct before this session. Full audit confirmed in `lesson-form.tsx`:
- Add route: `useParams()` returns no `id`; no entity fetch performed. The stale `fetchEndpoint: 'admin/lesson-fetch'` concern was pre-implementation; bespoke `LessonForm` never used `GenericFormPage`. Add page is clean.
- Edit fetch: `admin/lesson-edit` POST `{ _id: id }`. Response shape: `data.results?.res ?? data.results ?? data`.
- Hydration: `useEffect` on `record` calls `reset()` with all fields; `prerequisite_lesson` hydrated from `record.prerequisite_lesson`; media URL fields hydrated as strings; assets hydrated as array.
- Submit: explicit payload with `_id` on edit; `status: 0|1`; empty media URL fields omitted; `prerequisite_lesson` uses correct field key. Endpoints: `admin/lesson-add` / `admin/lesson-update`.
- No code changes required.

## Notion Summary

P1 integration gap: the Next Training Lesson module needs an explicit model and payload audit so add/edit flows remain backend-compatible. Align prefill behavior, prerequisite semantics, identity handling, and media serialization before considering the lesson module fully migrated.
