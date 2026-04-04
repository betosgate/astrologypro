# Task 08 - My Rituals List And Navigation Parity - 2026-04-02

- Status: Todo
- Priority: P1
- Parent Task: `07-master-ritual-parity-task.md`
- Scope: ritual list fetch, count fetch, row normalization, and row navigate behavior
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/perennial-user-dashboard/08-my-rituals-list-and-navigation-parity.md`

## Goal

Close the My Rituals list parity gap so the Next rituals list behaves like Angular in terms of user filtering, count handling, row mapping, and navigate action semantics.

## Verified Current Code Truth

- Angular route: `/perennial-mandalism-dashboard/my-rituals`
- Next route: `/admin/perennial/rituals`
- Angular loads list via resolver and count via a separate request.
- Angular filters list to the current user.
- Angular row action opens result in a new tab using `ritual_config_id`.
- Next already has a list and a `Navigate` action, but the downstream result route currently does not honor the same config-driven contract.

## APIs And Payloads

### Ritual List

- Endpoint: `ritual-invocation/ritual-list`
- Method: `POST`
- Payload:

```json
{
  "condition": {
    "limit": 10,
    "skip": 0
  },
  "sort": {
    "type": "desc",
    "field": "created_on"
  },
  "searchcondition": {
    "user_id": "<current_user_id>"
  }
}
```

### Ritual List Count

- Endpoint: `ritual-invocation/ritual-list-count`
- Method: `POST`
- Payload:

```json
{
  "condition": {
    "limit": 10,
    "skip": 0
  },
  "sort": {
    "type": "desc",
    "field": "created_on"
  },
  "searchcondition": {
    "user_id": "<current_user_id>"
  }
}
```

## Required Data Mapping

Angular list currently relies on:

- `ritual`
- `created_on`
- `ritual_config_id`

Required normalized row shape:

```ts
interface RitualListRow {
  _id: string;
  ritual?: string;
  ritual_name?: string;
  name?: string;
  created_on?: number | string;
  created_at?: number | string;
  ritual_config_id?: string;
  ritual_tags?: string[];
}
```

Required navigation mapping:

- use `ritual_config_id` if the backend returns it
- fall back to `_id` only if verified that `_id` is the ritual configuration id

## Required Behavior

1. Filter to current user only.
2. Keep count API aligned with list filters.
3. Normalize display fields without guessing backend semantics.
4. `Navigate` must open the saved ritual result by config id.

## Acceptance Criteria

- My Rituals list is current-user-only
- pagination count matches count API
- row data renders from normalized mapping
- navigate action passes config id correctly

## Verification Plan

1. Open `/admin/perennial/rituals` and verify only current user records appear.
2. Confirm count reflects backend count endpoint.
3. Inspect a row and verify whether `ritual_config_id` or `_id` is the true config identifier.
4. Click `Navigate` and confirm the opened result page is the correct saved ritual.

## Notion Summary

P1 list-parity task for My Rituals. Align list and count APIs, normalize row mapping, and restore Angular-equivalent navigate behavior using the saved ritual config id.
