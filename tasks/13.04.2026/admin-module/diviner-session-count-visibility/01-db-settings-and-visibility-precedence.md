# Task 01: DB Settings and Visibility Precedence

## Goal

Add the minimum data model needed to support a diviner-controlled public stats block with admin override.

## Why This Is Needed

The current publish system allows admins to block broad public sections, but it does not provide a clean feature-level setting where:

- diviner expresses their own preference
- admin can override that preference
- the app can resolve a final public visibility state deterministically

## Required Schema Design

### 1. Diviner-owned preference fields

Add fields on `diviners` such as:

- `show_public_session_counts boolean not null default false`
- `public_session_counts_updated_at timestamptz null`

This captures the diviner’s own preference.

### 2. Admin override fields

Add fields such as:

- `public_session_counts_override text null`
- `public_session_counts_override_reason text null`
- `public_session_counts_override_by uuid null`
- `public_session_counts_override_at timestamptz null`

Recommended enum-like values for override:

- `null` = no override
- `force_show`
- `force_hide`

### 3. Final visibility resolution

Define one shared resolver utility:

- if section-level public publishing is globally blocked, block the module
- else if admin override is `force_show`, show
- else if admin override is `force_hide`, hide
- else use `show_public_session_counts`

This logic must exist in one place only.

### 4. Optional future-proofing

If the team expects more profile modules like this, consider a more extensible JSONB or module-policy table. If not, keep this feature scalar and direct to reduce complexity.

Given the current codebase style, scalar columns on `diviners` are likely the pragmatic path.

## Files In Scope

- new Supabase migration
- `src/lib/diviner-publishing.ts` or a sibling utility for stats-visibility resolution
- profile/admin API routes that load diviner publishing and profile settings

## Acceptance Criteria

- the DB cleanly represents both diviner preference and admin override
- the app has a documented precedence model
- visibility can be resolved consistently across public page, dashboard, and admin
