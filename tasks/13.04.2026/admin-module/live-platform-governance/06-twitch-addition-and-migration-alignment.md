# Task 06: Twitch Addition and Migration Alignment

## Goal

Add `twitch` as a first-class modeled platform across schema, API validation, dashboard, and public rendering.

## Why This Is Needed

The target platform set now includes Twitch, but the current local enum and migration do not.

Without a full alignment pass, the product will end up with partial support and invalid state mismatches.

## Required Alignment

### 1. Schema and migration updates

Update platform constraints so `twitch` is a valid platform key in the registry and any constrained diviner config tables.

### 2. API validation updates

Add `twitch` to:

- dashboard live-platform validation
- live status validation where relevant
- admin governance validation

### 3. Dashboard UX updates

Add Twitch to platform selections and platform metadata display, but only through the governed registry, not another hardcoded array.

### 4. Public playback rules

Add Twitch-specific embed and link behavior in the capability-aware rendering layer.

### 5. Backward compatibility

Ensure the migration path does not break existing rows for current platforms.

## Acceptance Criteria

- `twitch` is supported everywhere the product models live platforms
- the app no longer has platform mismatch between DB, API, and UI

## Status

Done.

Implemented with `supabase/migrations/20260413000190_live_platform_governance.sql`, shared validation updates, governed dashboard support, and Twitch embed handling in the public live section.
