# Master Task 07 - Perennial User Ritual Flow Parity - 2026-04-02

- Status: Todo
- Priority: P1
- Owner: Frontend
- Module: Perennial Mandalism -> My Rituals / Create Ritual / Ritual Result
- PMS Type: Master Task
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/perennial-user-dashboard`
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/perennial-user-dashboard/07-master-ritual-parity-task.md`

## Goal

Bring the full Perennial ritual workflow in `Divine-infinite-ui-next` to parity with Angular, while allowing the primary create entry point to live under the `My Rituals` tab in Next.

This includes:

1. user-filtered My Rituals list
2. ritual count and row mapping
3. standard ritual creation presets
4. custom planetary/zodiacal ritual configuration
5. post-create result routing
6. config-id-driven ritual result fetch
7. ritual video-library fetch and sequencing
8. dynamic ritual pre-start gating

## Current Product Truth

The Next app already has `/admin/perennial/rituals` and a ritual result shell, but the behavior is only partially connected. Angular is config-driven: create a saved ritual configuration, navigate by config id, load the saved ritual tags, then fetch and sequence the ritual videos from those tags. Next currently mixes config-id routing with tag-query-driven result behavior, which is the core parity gap.

## Child Tasks In Scope

1. `08-my-rituals-list-and-navigation-parity.md`
2. `09-create-ritual-standard-presets-parity.md`
3. `10-custom-ritual-configurator-parity.md`
4. `11-ritual-result-config-fetch-and-video-sequencing-parity.md`

## Delivery Expectations

1. Keep `/admin/perennial/rituals` working as the main ritual management surface.
2. Preserve all 4 Angular ritual options.
3. Preserve Angular API contracts and payload shapes unless backend validation proves a newer contract is required.
4. Treat `config_id` as the primary source of truth for ritual result loading.
5. Keep the task split small enough that list, create, custom configuration, and result playback can be implemented and verified independently.

## Done Definition

- ritual list and ritual count are Angular-equivalent
- create flow supports standard and custom ritual variants
- create success routes directly to result for the saved config
- result page loads by config id and not by query-computed tags
- ritual video fetch, ordering, and dynamic pre-start flow match Angular behavior closely enough for user-facing parity

## Verification Gate

1. Complete the child tasks in order unless a dependency requires reordering.
2. Verify every API payload against backend behavior during implementation.
3. Validate standard ritual, custom invocation, custom banishing, and existing-list-row navigation paths.
4. Run an end-to-end walkthrough from My Rituals -> Create Ritual -> Result page -> Playback.

## Notion Summary

Master ritual parity task for the Perennial User Dashboard. Use this task set to close the Angular-to-Next gap for My Rituals, Create Ritual, saved ritual config loading, ritual video-library fetch, and dynamic ritual playback behavior.
