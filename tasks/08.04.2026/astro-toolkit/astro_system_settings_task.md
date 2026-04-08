# Astro System Settings — Centralised API Keys + System Config

- Status: Completed (2026-04-08)
- Strategy: 2(a) — additive replacement of `astrology_api_keys`. New table coexists; legacy table is left in place during the dual-read window. A follow-up migration will drop `astrology_api_keys` after every consumer has been switched to the new helper.

## Schema

`supabase/migrations/20260408000107_astro_system_settings.sql`

```
astro_system_settings (
  id            UUID PRIMARY KEY,
  type          TEXT  CHECK type IN ('ASTROLOGY_API','FREEASTROLOGY_API','SYSTEM_CONFIG'),
  key_name      TEXT  NOT NULL,
  key_value     TEXT  NOT NULL,
  secret_value  TEXT  NULL,        -- only used by ASTROLOGY_API
  status        TEXT  CHECK ('active','inactive') DEFAULT 'active',
  notes         TEXT  NULL,
  created_at, updated_at,
  UNIQUE (type, key_name)
)
```

- Index: `(type, status)` — covers the "give me one active row of type X" query.
- Unique constraint: `(type, key_name)` — same name can repeat across types.
- RLS: enabled, `service_role` only (credentials).
- updated_at trigger via `extensions.moddatetime` when present, manual fallback otherwise.
- Backfill: every existing row of `astrology_api_keys` is inserted as type `ASTROLOGY_API`, mapping `label → key_name`, `access_key → key_value`, `secret_key → secret_value`, and `is_active → status`. Idempotent via the unique constraint.

## Runner registration

Migration is registered in `src/lib/db/migrations.ts` so it can be applied via `/admin/db/migrations` with one click. The runner uses the Supabase Management API, so the DDL + backfill apply in a single call.

## Helper library

`src/lib/astro/system-settings.ts`:

| Function | Returns | Fallback chain |
|---|---|---|
| `listActiveAstroSettings(type)` | All active rows of `type`, ordered by `created_at` | `astro_system_settings` → `astrology_api_keys` (for ASTROLOGY_API) / `FREEASTROLOGY_API_KEYS` env var (for FREEASTROLOGY_API) / empty (for SYSTEM_CONFIG) |
| `getActiveAstroSetting(type)` | First active row, or null | Same |
| `getSystemConfigValue(keyName)` | Single SYSTEM_CONFIG `key_value`, or null | `astro_system_settings` → `process.env[keyName]` |

The fallback chain guarantees that **callers can switch to the helper today**, before any data has been entered into `astro_system_settings`. The legacy sources keep working until the new table has been populated.

## API endpoints

| Verb | Route | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/admin/astro-system-settings` (?type=…) | List all settings, optionally filtered by type | admin |
| `POST` | `/api/admin/astro-system-settings` | Add a new key/config row | admin |
| `PATCH` | `/api/admin/astro-system-settings/[id]` | Update key_value, secret_value, status, or notes (type and key_name are immutable) | admin |
| `DELETE` | `/api/admin/astro-system-settings/[id]` | Hard delete a row | admin |
| `GET` | `/api/admin/astro-system-settings/active` | Resolved active values: one credential per credential-type + system URL config | admin |

`POST` rejects `secret_value` for non-`ASTROLOGY_API` types (`FREEASTROLOGY_API` and `SYSTEM_CONFIG` have no secret pair). `POST` returns `409` on `(type, key_name)` conflict.

`PATCH` keeps `type` and `key_name` immutable so the unique constraint can never drift.

## How to roll out

1. Click **Run migration** for `20260408000107_astro_system_settings` at `/admin/db/migrations`.
2. The backfill copies the 4 existing `astrology_api_keys` rows into the new table as `ASTROLOGY_API` entries.
3. Optionally add `FREEASTROLOGY_API` rows (one per key currently in the `FREEASTROLOGY_API_KEYS` env var) and `SYSTEM_CONFIG` rows for `ASTRO_AI_API_URL` / `ASTRO_PLANET_RETURN_URL` via the admin API or a small admin UI.
4. Verify with `GET /api/admin/astro-system-settings/active`.
5. Switch consumers (`natal-wheel/route.ts`, `ai-interpret/route.ts`, `planet-return/route.ts`) to call `getActiveAstroSetting(...)` / `getSystemConfigValue(...)` instead of reading env vars directly. Each switch is a small PR — the helper is fallback-safe so consumers can be migrated one at a time.
6. Once every consumer is on the helper and `astrology_api_keys` has no readers, ship a follow-up migration to drop the old table and remove the env-var fallbacks.

## Future cleanup (NOT shipped now)

- Drop `astrology_api_keys` table after all consumers migrated.
- Remove `FREEASTROLOGY_API_KEYS` env-var fallback in `natal-wheel/route.ts`.
- Remove `ASTRO_AI_API_URL` / `ASTRO_PLANET_RETURN_URL` env-var fallbacks in their respective routes.
- Add a small admin UI page at `/admin/astro-system-settings` listing rows + add/edit forms (currently the API is the only interface).
