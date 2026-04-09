# Task: Allow Duplicate Astro System Settings

- Status: Completed (2026-04-08)
- Completion Notes:
  - Migration `supabase/migrations/20260408000114_drop_unique_astro_system_settings.sql` (registered in `/admin/db/migrations` runner) drops the named `astro_system_settings_type_name_key` UNIQUE plus a defensive sweep that removes any other UNIQUE on the same column pair. Idempotent.
  - `src/app/api/admin/astro-system-settings/route.ts` POST handler no longer special-cases the 23505 unique_violation — the constraint is gone, so the spec example payload now succeeds.
  - Reads still pick the first active row by `created_at` via `getActiveAstroSetting`, so existing consumers (natal-wheel, ai-interpret, planet-return, fetch-config) are unaffected.
  - To roll out: open `/admin/db/migrations`, click **Run migration** on `20260408000114_drop_unique_astro_system_settings`.

## Problem Statement
When calling the API `POST /api/admin/astro-system-settings` with a payload where the `type` and `key_name` combination already exists in the database, the API currently returns a `409 Conflict` error:

```json
{
  "error": "A setting with this type + key_name already exists"
}
```

**Example Payload causing the error:**
```json
{
  "type": "ASTROLOGY_API",
  "key_name": "ASTROLOGY_API",
  "key_value": "645550",
  "secret_value": "0ff42a42f36ca0d37d68ac6575c5ad827698637b"
}
```

## Requirement
The system should allow multiple entries with the same `type` and `key_name` combination. There should be no "already exists" error for this combination.

## Implementation Steps

### 1. Database Migration
Drop the unique constraint on the `(type, key_name)` columns in the `astro_system_settings` table.
- **Migration File**: `supabase/migrations/20260408000200_drop_unique_astro_settings.sql` (or similar)
- **SQL**:
  ```sql
  ALTER TABLE public.astro_system_settings 
  DROP CONSTRAINT IF EXISTS astro_system_settings_type_key_name_key;
  ```

### 2. Update API Route
Modify `src/app/api/admin/astro-system-settings/route.ts` to remove the unique violation error handling for code `23505`.

- **File**: `src/app/api/admin/astro-system-settings/route.ts`
- **Change**: Remove lines 139-145 which return the 409 error.

### 3. Verification
Verify that multiple entries with `type: "ASTROLOGY_API"` and `key_name: "ASTROLOGY_API"` can be saved successfully.
- Test with `POST /api/admin/astro-system-settings` multiple times with the same payload.
- Verify that `GET /api/admin/astro-system-settings` returns all instances.

## Metadata
- **Created**: 2026-04-08
- **Path**: `tasks/08.04.2026/astro-toolkit/allow-duplicate-system-settings.md`
