# Task 02: Global Admin Enable and Disable Controls

## Goal

Give admins the ability to enable or disable each live platform globally across the product.

## Why This Is Needed

The user requirement is explicit: admin can enable and disable platforms as they wish.

That means the system must support product-wide control for:

- rollout
- beta access
- emergency shutdown
- compliance restrictions
- platform policy changes

## Required Admin UX

### 1. Global live platform management screen

Create a dedicated admin area for platform governance.

For each platform, admin should be able to manage:

- globally enabled or disabled
- selectable by diviners or hidden from diviner UI
- integration tier
- playback mode
- ordering
- admin note or rationale

### 2. Global disable semantics

If a platform is globally disabled:

- it should not appear in diviner add-platform lists
- existing diviner configs should not render publicly
- live status should not be set to that platform going forward
- historical data may remain stored, but it should be inactive

### 3. Safe rollout states

Support at least these operational states:

- enabled and selectable
- enabled but hidden from new diviner setup
- disabled globally

This gives product and operations a safe rollout path.

## API Ownership

Create admin routes dedicated to platform-governance data rather than overloading diviner publishing controls.

Possible routes:

- `GET /api/admin/live-platforms`
- `PATCH /api/admin/live-platforms/[platformKey]`

## Acceptance Criteria

- admin can enable or disable each platform globally
- global policy immediately constrains dashboard configuration and public rendering
- admins have a proper control surface instead of code-only changes

## Status

Done.

Implemented with `src/app/api/admin/live-platforms/route.ts`, `src/app/admin/live-platforms/page.tsx`, and the admin sidebar entry for `/admin/live-platforms`.
