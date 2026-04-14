# Task 02 - Tighten Admin Live Operations and Review UX

- Status: Done
- Priority: P2
- Owner: Frontend

## Objective

Turn the admin live sessions area into a clear operations console for scheduling, activating, monitoring, and closing diviner live sessions.

## Why This Task Exists

The current admin page exists and can create/update/cancel sessions, but the live module research shows the broader system still has split state between admin sessions and diviner dashboard flags. The admin UI must expose enough session clarity to be the operational review surface once the backend contract is aligned.

## Current Repo State

- Entry page: `src/app/admin/live-sessions/page.tsx`
- Primary UI: `src/components/admin/live-sessions-client.tsx`
- Backend list/detail APIs exist.
- Check-in counts are surfaced per session.

## Exact Gap

- The admin screen is a management view, but not yet a strong audit/reconciliation view.
- It is not obvious which session is the operational source of truth when a diviner is marked live elsewhere.
- Session lifecycle states need clearer visual differentiation and operator actions.

## Required Implementation Direction

- Improve the table and modal flows so scheduled, live, ended, and cancelled states are easy to scan.
- Surface current platform URL, check-in enabled state, and count information as first-class operational signals.
- Add clear reconciliation affordances after the API contract is settled, such as current live marker, stale session warning, or status mismatch indicator.
- Preserve the existing admin visual language rather than inventing a new design system.

## Files To Read First

- `src/app/admin/live-sessions/page.tsx`
- `src/components/admin/live-sessions-client.tsx`
- `src/app/api/admin/live-sessions/route.ts`
- `src/app/api/admin/live-sessions/[id]/route.ts`

## Acceptance Criteria

- Admins can scan session status and check-in readiness without opening every record.
- Session lifecycle transitions are visually obvious and operationally safe.
- The admin UI exposes enough data to catch state mismatches once the API/DB source of truth is implemented.

## Verification Test Plan

- [ ] Create a scheduled session and verify it appears with complete metadata.
- [ ] Move a session to live and verify the UI updates status and timestamps predictably.
- [ ] End or cancel a session and verify the admin list still preserves historical visibility.
- [ ] Validate that check-in counts remain visible and tied to the correct session row.

## Completion Notes

- The admin live-sessions console now surfaces platform URL access, check-in readiness, current-live markers, and mismatch warnings inline.
- Operators can scan scheduled, live, ended, and cancelled rows without opening individual records.
- Lifecycle actions continue to operate from the same session contract that now drives dashboard and public live state.
