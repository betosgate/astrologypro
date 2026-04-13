# Task 03 - Unify Diviner Live State APIs

- Status: Open
- Priority: P1
- Owner: Backend API

## Objective

Define a single dashboard-facing live API contract so the diviner dashboard can read and write live state without hidden fallbacks or route mismatches.

## Why This Task Exists

The current dashboard page calls `/api/dashboard/live-status-get`, but the repo only ships `POST /api/dashboard/live-status`. That is a contract gap, not just a UI bug.

## Current Repo State

- `src/app/api/dashboard/live-status/route.ts` supports authenticated writes to `diviners.is_live` and `diviners.live_platforms`.
- `src/app/api/dashboard/live-platforms/route.ts` supports reading and upserting `stream_platform_configs`.
- No canonical read endpoint currently returns the complete dashboard live state bundle.

## Exact Gap

- The dashboard has no official read contract for live state.
- Live status and platform config are read separately and then patched together in the client.
- The API layer does not yet state how a diviner-facing live toggle relates to `live_sessions`.

## Required Implementation Direction

- Add or reshape a canonical read endpoint for dashboard live state.
- Return enough data in one payload to drive the page without client-side Supabase fallback reads.
- Define the relationship between:
  - `diviners.is_live`
  - `diviners.live_platforms`
  - current or scheduled `live_sessions`
  - `stream_platform_configs`
- Keep auth behavior scoped to the authenticated diviner.

## Files To Read First

- `src/app/api/dashboard/live-status/route.ts`
- `src/app/api/dashboard/live-platforms/route.ts`
- `src/app/dashboard/live/page.tsx`
- `src/app/api/admin/live-sessions/route.ts`

## API Constraints

- Do not leave dashboard hydration dependent on a non-existent route.
- Do not require the frontend to query Supabase directly for basic page state.
- Do not introduce a parallel live-state endpoint family with overlapping semantics.

## Acceptance Criteria

- A diviner dashboard client can load all required live state from supported API routes only.
- Read and write contracts are explicit and internally consistent.
- The API documents or encodes how session lifecycle affects diviner live flags.

## Verification Test Plan

- [ ] Call the canonical dashboard read endpoint for a diviner with no live session and verify the empty state payload.
- [ ] Call it for a diviner with configured platforms and verify platform ordering and enabled state are returned correctly.
- [ ] Toggle live state and confirm the next read reflects the persisted truth with no fallback reads.

