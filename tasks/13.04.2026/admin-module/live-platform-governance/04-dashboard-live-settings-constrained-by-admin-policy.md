# Task 04: Dashboard Live Settings Constrained by Admin Policy

## Goal

Update the diviner live dashboard so it only exposes platforms that are allowed under admin governance.

## Why This Is Needed

Today the dashboard page hardcodes all platforms in `ALL_PLATFORMS`, which means a diviner can see and interact with platforms regardless of admin preference.

That breaks the requested control model.

## Required Changes

### 1. Dynamic platform list

Replace hardcoded dashboard platform lists with data loaded from the governed platform registry.

### 2. Save-time validation

Even if the UI hides a platform, the backend must also validate:

- platform exists
- platform is globally allowed
- platform is allowed for this diviner

### 3. UX states

The dashboard should clearly distinguish:

- enabled and usable platforms
- disabled platforms not available to this diviner
- link-out/manual platforms versus embedded platforms

### 4. Live status constraints

When diviner marks themselves live:

- only allowed enabled platforms may be selected into `live_platforms`

Do not let stored stale platform keys pass through.

## Files In Scope

- `src/app/dashboard/live/page.tsx`
- `src/app/api/dashboard/live-platforms/route.ts`
- live status endpoint(s)

## Acceptance Criteria

- diviner dashboard reflects admin platform governance in real time
- backend validation matches frontend availability
- invalid or disallowed platform keys cannot be persisted
