# Task 04 - Align Admin Session Lifecycle With Public Live State

- Status: Done
- Priority: P1
- Owner: Backend API

## Objective

Make `live_sessions` the operational lifecycle model that cleanly coordinates admin actions, diviner live status, and public availability.

## Why This Task Exists

Admin APIs already manage `live_sessions`, but the public site and dashboard also depend on `diviners.is_live` and `diviners.live_platforms`. Without lifecycle alignment, the system can show a diviner as live while no active session exists, or expose a session while dashboard state is stale.

## Current Repo State

- Admin list/create route: `src/app/api/admin/live-sessions/route.ts`
- Admin detail/update/delete route: `src/app/api/admin/live-sessions/[id]/route.ts`
- Public check-in route finds one `live_sessions` row with `status = 'live'`.
- Public diviner page uses `diviners.is_live` to decide whether to render the check-in form section.

## Exact Gap

- Session start/end transitions are not yet guaranteed to synchronize with public live flags.
- The current model allows admin and diviner surfaces to mutate adjacent live state without a clearly enforced ordering.
- Check-in eligibility and public profile live rendering can disagree.

## Required Implementation Direction

- Define lifecycle transitions for scheduled, live, ended, and cancelled sessions.
- Decide whether `diviners.is_live` is derived from `live_sessions`, mirrored from it, or retained only as a denormalized read helper.
- Ensure public check-in eligibility and public live rendering both use the same lifecycle truth.
- Preserve admin control over scheduling and status transitions.

## Files To Read First

- `src/app/api/admin/live-sessions/route.ts`
- `src/app/api/admin/live-sessions/[id]/route.ts`
- `src/app/check-in/[username]/page.tsx`
- `src/app/[username]/page.tsx`

## Acceptance Criteria

- A session moved to `live` is reflected consistently across admin, dashboard, and public surfaces.
- A session moved to `ended` or `cancelled` no longer leaves stale public live affordances.
- Public check-in form availability and public live section availability no longer disagree.

## Verification Test Plan

- [ ] Mark a session live and confirm both public profile and `/check-in/[username]` expose the session consistently.
- [ ] End the session and confirm both public surfaces stop presenting live-only actions.
- [ ] Cancel a scheduled session and confirm it does not appear as active anywhere.

## Completion Notes

- Admin live-session mutations now synchronize the mirrored diviner live flags after create, update, and cancel flows.
- Session activation rejects a second concurrent live session for the same diviner.
- Dashboard live toggles now start or end a `live_sessions` record instead of mutating diviner flags independently.
