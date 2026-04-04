# Task 11 - Ritual Result Config Fetch And Video Sequencing Parity - 2026-04-02

- Status: Todo
- Priority: P1
- Parent Task: `07-master-ritual-parity-task.md`
- Scope: config-id-driven result loading, ritual video-library fetch, response normalization, ordering, and dynamic pre-start flow
- Estimate: 0.75-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/perennial-user-dashboard/11-ritual-result-config-fetch-and-video-sequencing-parity.md`

## Goal

Restore Angular’s ritual result flow in Next so the result page is driven by the saved ritual configuration id, not by ad hoc query-param tags, and so the ritual video library is fetched, filtered, ordered, and revealed the same way Angular does it.

## Verified Angular Result Flow

1. Result route receives `:_id`
2. Resolver calls config endpoint with `_id`
3. Angular reads `response.results.res.ritual_tags`
4. Angular calls ritual video-library endpoint with those tags
5. Angular filters and orders the matching ritual videos
6. If the ritual is dynamic, Angular shows a pre-start screen and waits for `Begin the Ritual`

## APIs And Payloads

### Get Ritual Configuration Of User

- Endpoint: `/ritual-invocation/get-ritual-configuration-of-user`
- Method: `POST`
- Purpose: fetch saved ritual config by id
- Payload:

```json
{
  "_id": "<config_id>"
}
```

### Ritual Invocation Configure List

- Endpoint: `ritual-invocation/ritual-invocation-configure-list`
- Method: `POST`
- Purpose: fetch ritual video-library items for the saved ritual tags
- Payload:

```json
{
  "tag": ["...ritual tags from config..."]
}
```

## Required Response Mapping

### Ritual Config Response

Angular uses:

```ts
response.results.res.ritual_tags
```

Normalize into:

```ts
interface RitualConfig {
  _id: string;
  ritual_tags: string[];
  ritual?: string;
  ritual_name?: string;
}
```

### Ritual Video Library Response

Normalize into:

```ts
interface RitualVideo {
  _id: string;
  video_title: string;
  video_url: string;
  video_description: string;
  video_thumbnail: string;
  tag: string[];
  priority: number;
  status: number;
}
```

## Required Ritual Result Behavior

1. Accept `config_id` as the primary input.
2. Fetch config first.
3. Use `ritual_tags` from config as the video-library input.
4. Do not use querystring tags as the primary source of truth.
5. Determine dynamic ritual state from:

```ts
ritual_tags.length > 1
```

6. For dynamic rituals:
  - show `Prepare the Sacred Space`
  - show ritual composition summary
  - do not inject videos into player immediately
  - require explicit `Begin the Ritual`

7. For non-dynamic rituals:
  - allow immediate playback

## Required Video Sequencing

Angular sequencing rules:

- opening videos first
- closing videos last
- middle videos sorted by canonical planetary/zodiacal ritual order
- duplicate-safe assembly

This task must also preserve the ritual video-library concept explicitly:

- the backend video source is the ritual configuration library returned by `ritual-invocation/ritual-invocation-configure-list`
- each item may represent opening, gate, planet, zodiac, or closing content
- sequencing must reflect ritual structure, not generic priority-only ordering

## Acceptance Criteria

- result page works from `config_id`
- config is fetched before ritual videos
- ritual video-library fetch uses saved ritual tags from config
- dynamic rituals require explicit begin action
- non-dynamic rituals can play immediately
- resulting sequence reflects Angular ritual ordering semantics

## Verification Plan

1. Open result page from a newly created ritual and verify config fetch occurs first.
2. Open result page from a list row navigate action and verify the same behavior.
3. Inspect fetched ritual tags and confirm they come from the saved config response.
4. Inspect ritual video-library request and confirm payload uses `tag: ritual_tags`.
5. Verify dynamic ritual pre-start behavior.
6. Verify non-dynamic preset ritual playback behavior.
7. Compare sequence ordering between Angular and Next for at least one custom invocation ritual.

## Notion Summary

P1 result-parity task for saved ritual playback. Restore the config-id-driven result model, the ritual video-library fetch, Angular-style sequencing, and dynamic ritual pre-start behavior.
