# Task 01 - Fix Diviner Live Dashboard State Parity

- Status: Open
- Priority: P1
- Owner: Frontend

## Objective

Make the diviner-facing live dashboard reflect the real live-session state model instead of relying on mixed fetch paths and fallback reads.

## Why This Task Exists

`src/app/dashboard/live/page.tsx` currently mixes:
- a fetch to `/api/dashboard/live-status-get`
- a fallback client-side Supabase read from `diviners`
- separate writes to `/api/dashboard/live-status`
- separate platform config writes to `/api/dashboard/live-platforms`

That makes the UI behavior fragile and hides the real contract from the user.

## Current Repo State

- The page supports go-live toggling and per-platform configuration.
- Platform configs are persisted in `stream_platform_configs`.
- Live status is persisted on `diviners.is_live` and `diviners.live_platforms`.
- There is no `live-status-get` route in the app router tree.

## Exact Gap

- Initial dashboard hydration does not use a single supported API contract.
- UI state can diverge from admin-managed `live_sessions`.
- The page does not clearly express whether going live creates a session, activates a scheduled session, or only flips a diviner flag.

## Required Implementation Direction

- Replace unsupported or fallback loading logic with one canonical dashboard-facing read path.
- Rework the page state model so platform selection, live status, and current session context are displayed together.
- Show explicit empty, scheduled, live, and ended states instead of a generic binary toggle-only experience.
- Keep the page focused on diviner operations, not admin-only session management.

## Files To Read First

- `src/app/dashboard/live/page.tsx`
- `src/app/api/dashboard/live-status/route.ts`
- `src/app/api/dashboard/live-platforms/route.ts`
- `src/app/api/admin/live-sessions/route.ts`

## Likely Files To Change

- `src/app/dashboard/live/page.tsx`
- any extracted hook or helper introduced for dashboard live state hydration

## Acceptance Criteria

- The page loads without depending on a non-existent route.
- The page shows one coherent live status model.
- Platform configuration state and live activation state no longer contradict each other.
- The UI makes it obvious whether the diviner is configuring platforms, preparing a session, or currently live.

## Verification Test Plan

- [ ] Load `/dashboard/live` with no configured platforms and confirm the empty state is explicit.
- [ ] Add platform configs and confirm they hydrate from the canonical read path.
- [ ] Toggle live state and confirm the refreshed state matches the backend response with no hidden fallback behavior.
- [ ] Compare dashboard state against the corresponding admin session record after lifecycle alignment work.

