# TargetLive Live Module — Second Week Master Task

- Date: 2026-04-13
- Status: In Progress
- Priority: P1
- Owner: Scrum / Full-stack planning

---

## Goal

Stabilize the Live module as one coherent product area across:
- diviner dashboard live controls
- admin live session operations
- public profile live rendering
- public check-in capture
- DB lifecycle and reporting integrity

This folder is a planning pack only. It defines research-backed tasks and sequencing. It does not imply that any implementation in this folder has already been executed.

## Researched Repo Surface

- Diviner live dashboard: `src/app/dashboard/live/page.tsx`
- Admin live sessions page: `src/app/admin/live-sessions/page.tsx`
- Admin live sessions client: `src/components/admin/live-sessions-client.tsx`
- Dashboard live status API: `src/app/api/dashboard/live-status/route.ts`
- Dashboard live platforms API: `src/app/api/dashboard/live-platforms/route.ts`
- Admin live sessions list/create API: `src/app/api/admin/live-sessions/route.ts`
- Admin live session detail/update API: `src/app/api/admin/live-sessions/[id]/route.ts`
- Public diviner page live section: `src/app/[username]/page.tsx`
- Public check-in entry route: `src/app/check-in/[username]/page.tsx`
- Live/check-in schema: `supabase/migrations/20260406000039_check_in_system.sql`
- Stream platform config schema: `supabase/migrations/20260406000043_stream_platforms.sql`
- Check-in to live-session link migration: `supabase/migrations/20260413000008_checkin_live_session_link.sql`

## Core Findings From Research

1. The dashboard live page fetches `/api/dashboard/live-status-get`, but the repo only contains `src/app/api/dashboard/live-status/route.ts`. The page then falls back to a client-side Supabase read, which means live state is not sourced consistently.
2. Public live rendering currently depends on `diviners.is_live` and `diviners.live_platforms`, while the check-in page depends on an active `live_sessions` row with `status = 'live'`. Those two sources can drift.
3. Admin can create and mutate `live_sessions`, but the diviner dashboard toggles a separate live state directly on `diviners` and does not clearly establish how session lifecycle should be created, started, ended, or reconciled.
4. `check_ins.live_session_id` exists, but the module still needs a clearer session-driven reporting story so admin counts, diviner status, and public forms remain aligned.
5. Archived live sessions are not integrated into the diviner media workflow. `media_items` supports `video` entries, but there is no clean flow for diviners to convert an old live session into a reusable video-library item.

## Execution Order

1. `05-db-live-source-of-truth-and-reporting.md`
2. `03-api-diviner-live-state-parity.md`
3. `04-api-admin-session-lifecycle-alignment.md`
4. `01-ui-diviner-live-dashboard-parity.md`
5. `02-ui-admin-live-operations-and-review.md`
6. `06-ui-public-live-and-check-in-alignment.md`
7. `07-live-archive-to-video-library.md`

## Planning Rules

- Treat `live_sessions`, `stream_platform_configs`, `diviners.is_live`, and `diviners.live_platforms` as one connected system, not separate features.
- Do not add a third live-state source.
- Any UI changes must follow the lifecycle rules defined at API/DB level first.
- Public live visibility and check-in availability must derive from the same operational truth.

## Expected Outcome

- Diviner dashboard, admin console, and public live experience all reflect the same session state.
- Check-in capture is reliably attributable to a concrete live session.
- The team has a clean implementation sequence covering DB, API, and UI without ambiguous ownership.
- Diviners have a low-friction path to turn finished live sessions into durable video-library content.

## Execution Status

- `05-db-live-source-of-truth-and-reporting.md` — Done
- `03-api-diviner-live-state-parity.md` — Done
- `04-api-admin-session-lifecycle-alignment.md` — Done
- `01-ui-diviner-live-dashboard-parity.md` — Done
- `02-ui-admin-live-operations-and-review.md` — Open
- `06-ui-public-live-and-check-in-alignment.md` — Done
- `07-live-archive-to-video-library.md` — Done
