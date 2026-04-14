# Task 03: Diviner-Level Availability and Override Rules

## Goal

Support admin control over platform availability for a specific diviner, not just globally.

## Why This Is Needed

Global control alone is not enough. Operations may need to:

- disable a specific platform for one diviner
- allow a beta platform only for selected diviners
- restrict risky platforms for trust or compliance reasons

## Required Model

### 1. Per-diviner override layer

Add a mechanism like:

- `diviner_live_platform_overrides`

Recommended fields:

- `diviner_id`
- `platform_key`
- `availability_mode`
- `reason`
- `set_by`
- `set_at`

Recommended values:

- `inherit`
- `force_enable`
- `force_disable`

### 2. Effective availability resolution

Resolve platform availability as:

1. if globally disabled, disabled
2. else if diviner override is `force_disable`, disabled
3. else if diviner override is `force_enable`, enabled
4. else inherit global selectable state

### 3. Existing-config behavior

If a diviner already has a config for a platform that later becomes disallowed:

- preserve the stored row
- stop exposing it in public render
- prevent edits unless admin re-enables it

## Acceptance Criteria

- admin can govern platform access for one diviner without changing all diviners
- effective platform availability is deterministic and shared across backend and UI

## Status

Done.

Implemented with `diviner_live_platform_overrides`, `src/app/api/admin/diviners/[id]/live-platforms/route.ts`, and `src/app/admin/diviners/[id]/live-platform-overrides.tsx`.
