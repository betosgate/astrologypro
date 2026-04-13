# Task 01: Platform Registry and Capability Model

## Goal

Replace hardcoded live-platform assumptions with a database-backed platform registry that defines capabilities and product posture per platform.

## Why This Is Needed

Right now:

- valid platform values are hardcoded in `src/app/api/dashboard/live-platforms/route.ts`
- platform labels are hardcoded in `src/app/dashboard/live/page.tsx`
- embed behavior is hardcoded in `src/components/public/live-stream-section.tsx`
- schema-level platform support is fixed in `supabase/migrations/20260406000043_stream_platforms.sql`

That makes admin governance impossible without shipping code every time platform policy changes.

## Required Data Model

### 1. Platform registry table

Create a table like:

- `live_platform_registry`

Recommended fields:

- `platform_key`
- `display_name`
- `is_globally_enabled`
- `is_selectable_by_diviners`
- `integration_tier`
- `playback_mode`
- `supports_embed`
- `supports_chat_embed`
- `supports_oauth_connection`
- `supports_event_sync`
- `supports_auto_live_detection`
- `sort_order`
- `admin_notes`

### 2. Enum-like values

Recommended `integration_tier` values:

- `first_class`
- `managed`
- `link_out_only`
- `custom`

Recommended `playback_mode` values:

- `embedded_player`
- `external_link`
- `manual_status`

### 3. Seeded platform rows

Seed rows for:

- youtube
- twitch
- facebook
- instagram
- tiktok
- zoom
- other

### 4. Diviner config relationship

Keep `stream_platform_configs` for diviner-specific URLs and settings, but make it subordinate to the registry.

The registry decides what is allowed.
The per-diviner row decides what that diviner configured.

## Acceptance Criteria

- platform support is no longer purely hardcoded
- the app can answer capability questions from one source of truth
- new platform policy changes can happen without code edits to every UI component
