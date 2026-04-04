# Align Blog Fetch Model And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: edit prefill normalization, response-shape handling, submit payload fidelity
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/blog-management/03-align-blog-fetch-model-and-submit-semantics.md`

## Goal

Align Next blog edit and submit behavior with the Angular/backend contract so add/edit flows are based on the real blog data shape instead of generic assumptions.

## Verified Current Code Truth

- Angular edit form reads from `response.response.results.res`.
- Angular submit sends:
  - `title`
  - `description`
  - `priority`
  - `status`
  - `available_for_perennial`
  - `images`
  - `files`
  - `audios`
  - `videos`
- Angular includes `_id` on edit.
- Next generic form resets fields from `data.results?.res ?? data.results ?? data` and converts switches to boolean-backed fields.
- Next currently submits only the fields declared in the simplified form config.

## User-Visible Problem

Even where the form looks close, edit prefill and submit behavior can still drift from the actual blog API contract. That causes silent field loss, broken edit screens, or mismatched payloads.

## Required Behavior

1. Prefill blog edit form state from the actual returned record shape.
2. Normalize fetched blog records so all supported fields prepopulate safely.
3. Submit the correct blog payload for create and edit.
4. Preserve boolean-to-integer conversion for `status` and `available_for_perennial`.
5. Avoid generic normalization logic that accidentally strips nested media structures.

## Tasks

1. Validate that the current Next edit fetch returns the same functional blog data needed for edit prefill.
2. Update blog edit prefill logic for the real response structure.
3. Ensure `_id` is included on edit submit.
4. Verify payload serialization for media collections and boolean-backed fields.
5. Add defensive handling for optional or legacy blog records with partial media data.

## Acceptance Criteria

- blog edit prefill uses a response model that functionally supports the required fields
- blog fields prepopulate correctly in edit mode
- create and edit submit the expected payload shape
- status and perennial fields persist correctly
- no supported blog media fields are lost on save

## Verification Test Plan

1. Open `/admin/blog/edit/[id]` for a populated blog and verify all fields prefill correctly.
2. Save an existing post without changing media and confirm media is preserved.
3. Toggle status and perennial fields and verify the backend receives the expected values.
4. Create a new post and verify the payload shape matches the supported field set.
5. Re-test list and preview behavior after fetch-model alignment to confirm no regressions.

## Implementation Notes (2026-04-02)

Already correct before this session. Full audit confirmed in `blog-form.tsx`:
- Add route: no entity fetch. Clean defaults.
- Edit fetch: `blogmanagement/blog-details-fetch` POST `{ _id: id }`. Response shape: `data?.response?.results?.res ?? data?.results?.res ?? data?.results ?? data` — handles multi-path Angular response nesting.
- Hydration: `useEffect` on `record` calls `reset()` with all scalar fields; media arrays hydrated directly; `status` and `available_for_perennial` normalized to boolean for form, then back to 0/1 on submit. `_displayUrl` stripped from media items before submit.
- Submit: explicit payload `{ title, description, priority, status: 0|1, available_for_perennial: 0|1, images, files, audios, videos }` plus `_id` on edit. Endpoints: `blogmanagement/blog-management-add` / `blogmanagement/blog-management-edit`.
- No code changes required.

## Notion Summary

P1 contract gap: Blog edit must prefill and submit against the real backend data shape, without relying on generic assumptions that can drop fields or media data.
