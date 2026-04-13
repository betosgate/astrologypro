# Task 05 - Harden Live Module Source of Truth at DB Level

- Status: Done
- Priority: P0
- Owner: Database / Backend

## Objective

Clarify and harden the database-level contract for live-session lifecycle, public check-in attribution, and reporting integrity.

## Why This Task Exists

The current schema is close, but the module still depends on multiple related tables and denormalized flags:
- `live_sessions`
- `check_ins`
- `check_ins.live_session_id`
- `stream_platform_configs`
- `diviners.is_live`
- `diviners.live_platforms`

That is workable only if the DB contract is explicit and supported by backend rules.

## Current Repo State

- `live_sessions` stores session lifecycle and check-in form copy.
- `check_ins` stores lead captures and now supports `live_session_id`.
- `stream_platform_configs` stores per-diviner platform definitions.
- `diviners` still stores top-level live flags and active platforms.

## Exact Gap

- The repo does not yet encode a clear source-of-truth rule for whether live state is session-driven or diviner-flag-driven.
- Reporting queries may need to combine session rows, check-in attribution, and platform activation state.
- Denormalized diviner fields can drift unless their ownership is explicit.

## Required Implementation Direction

- Establish the DB-level ownership model for live state.
- Decide which fields are authoritative and which are cached/derived.
- Add any missing constraints, indexes, or write-path rules needed to keep:
  - one coherent active live session model
  - accurate check-in attribution
  - predictable platform configuration reads
- Preserve historical session and check-in data for admin reporting.

## Files To Read First

- `supabase/migrations/20260406000039_check_in_system.sql`
- `supabase/migrations/20260406000043_stream_platforms.sql`
- `supabase/migrations/20260413000008_checkin_live_session_link.sql`
- any subsequent migrations that touch `diviners`, `check_ins`, or `live_sessions`

## DB Constraints

- Do not remove historical check-in data.
- Do not create a third live-state source.
- Keep public read policies compatible with the intended public experience.
- Any denormalized field must have a clear owner and synchronization rule.

## Acceptance Criteria

- The team can state which DB fields are authoritative for current live state.
- Check-ins can be reliably attributed to a session for reporting.
- The schema supports consistent admin, dashboard, and public behavior without ambiguous data ownership.

## Verification Test Plan

- [ ] Inspect a live diviner with one active session and confirm all relevant tables tell the same story.
- [ ] Confirm a new check-in can be attributed to the active session.
- [ ] Confirm ended and cancelled sessions remain queryable for history without appearing as active.

## Completion Notes

- Added `20260413000191_live_session_source_of_truth.sql` to enforce one active live session per diviner and align `live_sessions.platform` with current platform support.
- Added `src/lib/live-sessions.ts` so the app derives current and next session state from `live_sessions` and mirrors diviner flags from that result.
- The denormalized diviner fields are now treated as a mirror of live-session state rather than an independent write source.
