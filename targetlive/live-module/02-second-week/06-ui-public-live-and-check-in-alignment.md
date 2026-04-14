# Task 06 - Align Public Live Section and Check-In Flow

- Status: Done
- Priority: P1
- Owner: Frontend / Full-stack

## Objective

Make the public diviner page and the dedicated check-in page present one coherent live experience.

## Why This Task Exists

Current research shows:
- `src/app/[username]/page.tsx` shows live UI based on `diviners.is_live`
- `src/app/check-in/[username]/page.tsx` shows the check-in form only when a `live_sessions` record with `status = 'live'` exists and `check_in_enabled = true`

That means a visitor can potentially see a public page that looks live while the dedicated check-in page says there is no active session.

## Current Repo State

- The public diviner page loads enabled stream platform configs and a live stream section.
- The same page renders the embedded `CheckInForm` when the diviner is marked live.
- The dedicated check-in page loads active session copy and uses session-level `check_in_enabled`.

## Exact Gap

- Public entry points are not guaranteed to gate from the same live/session truth.
- Session-level check-in settings are not clearly reflected on the public profile page.
- Fallback content and next-live messaging on the public profile should follow the same operational state model as the dedicated check-in page.

## Required Implementation Direction

- Align public live rendering with the same session/lifecycle logic used by check-in.
- Respect session-level check-in enablement consistently across public entry points.
- Preserve the stronger branded public profile experience while removing contradictory states.

## Files To Read First

- `src/app/[username]/page.tsx`
- `src/app/check-in/[username]/page.tsx`
- `src/app/api/admin/live-sessions/[id]/route.ts`
- `src/app/api/admin/live-sessions/route.ts`

## Acceptance Criteria

- A visitor cannot encounter conflicting live/check-in states between the two public entry points.
- Session title and check-in availability are consistent wherever the live CTA appears.
- Offline and fallback states are explicit and intentional.

## Verification Test Plan

- [ ] Visit a diviner profile while no session is live and confirm both public entry points agree.
- [ ] Visit while a session is live and confirm both surfaces present consistent live and check-in affordances.
- [ ] Disable check-in for the active session and confirm both surfaces handle that state consistently.

## Completion Notes

- The public diviner page now treats the active `live_sessions` row as the live-state source instead of trusting mirrored diviner flags directly.
- The embedded profile check-in CTA only renders when the active session exists and has `check_in_enabled = true`.
- The public profile and `/check-in/[username]` now gate from the same operational live-session truth.
