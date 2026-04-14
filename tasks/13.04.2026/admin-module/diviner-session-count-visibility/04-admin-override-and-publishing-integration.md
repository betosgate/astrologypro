# Task 04: Admin Override and Publishing Integration

## Goal

Allow admins to manage this block on behalf of the diviner and integrate that control into the existing public publishing framework.

## Why This Is Needed

The repo already has a central admin publishing-control surface. This new feature should fit that operational model instead of creating a disconnected admin toggle elsewhere.

## Required Admin Design

### 1. Admin control surface

Add a dedicated card or subsection in the diviner admin area for this feature.

Recommended controls:

- `Use diviner preference`
- `Force show`
- `Force hide`
- optional admin reason

Do not model this as a plain checkbox, because three states are required.

### 2. Relationship to existing section blocking

If the parent public section that contains this block is fully blocked, the block must remain hidden regardless of force-show.

This avoids one control contradicting another.

### 3. Route integration

Likely integration points:

- extend `src/app/api/admin/diviners/[id]/publishing/route.ts`
- or add a sibling admin route for profile-metrics visibility

Choose the path that keeps the API contract understandable.

### 4. Admin auditability

Persist:

- who changed the override
- when
- why

This is important because the admin is acting on behalf of the diviner.

## Acceptance Criteria

- admin can override visibility with three-state control
- override behavior is persisted and auditable
- existing publish controls remain the higher-level authority when broader blocking applies

## Status

Done.

Implemented in `src/app/api/admin/diviners/[id]/publishing/route.ts` and `src/app/admin/diviners/[id]/publishing-controls.tsx` with diviner preference, force-show, and force-hide states plus admin reason storage.
