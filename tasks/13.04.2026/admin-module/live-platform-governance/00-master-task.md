# Live Platform Governance and Admin Enablement Pack

## Objective

Support all target live platforms with admin-controlled enablement so the platform team can decide which live providers are available at any time.

Target platform set:

- `youtube`
- `twitch`
- `facebook`
- `instagram`
- `tiktok`
- `zoom`
- `other`

Admin must be able to:

- enable or disable a platform globally
- optionally enable or disable a platform for a specific diviner
- control whether the platform is first-class, link-out only, or disabled

This pack is architecture and task writing only. It does not implement the feature.

## Current Repo Grounding

### Existing live configuration model

The current codebase already supports per-diviner live platform configs via:

- `src/app/api/dashboard/live-platforms/route.ts`
- `src/app/dashboard/live/page.tsx`
- `src/components/public/live-stream-section.tsx`
- `supabase/migrations/20260406000043_stream_platforms.sql`

### Current supported platform enum

The current local model supports:

- `youtube`
- `facebook`
- `instagram`
- `tiktok`
- `zoom`
- `other`

It does not yet include:

- `twitch`

### Current architectural limitation

The current system treats platform support as hardcoded in app code and migration checks. There is no admin-governed platform registry that can answer:

- which platforms are globally available
- which platforms are in beta
- which platforms are embed-capable
- which platforms are link-out only
- which platforms are disabled for compliance, policy, or stability reasons

## Product Direction

The correct model is not just “support every platform equally.” It is:

1. platform registry
2. platform capability model
3. global admin governance
4. optional per-diviner availability rules
5. diviner-facing configuration constrained by that governance

## Recommended Platform Classes

### First-class platforms

- `youtube`
- `twitch`
- `zoom`

These are the main targets for deeper product investment such as account connection, event sync, and richer playback logic.

### Managed but weaker platforms

- `facebook`

This can remain supported, but with more conservative expectations around lifecycle management.

### Link-out/manual-status platforms

- `instagram`
- `tiktok`

These should be supported in the registry, but modeled as less-capable unless and until the product team decides otherwise.

### Escape hatch

- `other`

This remains for unsupported providers, but it should also be admin-governed.

## Workstreams

1. `01-platform-registry-and-capability-model.md`
2. `02-global-admin-enable-disable-controls.md`
3. `03-diviner-level-availability-and-override-rules.md`
4. `04-dashboard-live-settings-constrained-by-admin-policy.md`
5. `05-public-player-and-linkout-rendering-rules.md`
6. `06-twitch-addition-and-migration-alignment.md`
7. `07-announcements-sync-and-ops-governance.md`

## Acceptance Standard

This feature set is complete only when:

- all target platforms exist in a governed registry
- admin can enable or disable them globally
- diviner settings cannot bypass admin policy
- `twitch` is added as a first-class modeled platform
- public rendering follows platform capability rules instead of hardcoded assumptions

## Status

- `01-platform-registry-and-capability-model.md` — Done
- `02-global-admin-enable-disable-controls.md` — Done
- `03-diviner-level-availability-and-override-rules.md` — Done
- `04-dashboard-live-settings-constrained-by-admin-policy.md` — Done
- `05-public-player-and-linkout-rendering-rules.md` — Done
- `06-twitch-addition-and-migration-alignment.md` — Done
- `07-announcements-sync-and-ops-governance.md` — Done
