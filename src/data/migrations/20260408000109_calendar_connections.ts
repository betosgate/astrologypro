// AUTO-GENERATED bundled mirror of supabase/migrations/20260408000109_calendar_connections.sql
// Used by /api/admin/db/migrate so the deployed function does not need filesystem access.
// To regenerate: copy the .sql file contents into the template literal below.

export const MIGRATION_SQL = `-- ============================================================================
-- calendar_connections — normalized OAuth calendar token store
--
-- Replaces the per-provider JSONB columns currently on \`diviners\`
-- (\`google_calendar_token\`, \`outlook_calendar_token\`) with a single normalized
-- table keyed on (user_id, provider). Lets owners (any user, not only
-- diviners) connect Google + Microsoft calendars.
--
-- Keyed on owner_id alongside user_id so it ties into the diviner_id ->
-- owner_id additive rename (migration 20260408000108). owner_id has no FK
-- because there is no canonical "owner" table — the value points at the
-- same owner_id used by bookings/services/etc.
--
-- Additive: existing diviners.google_calendar_token / outlook_calendar_token
-- columns are NOT touched. A future migration can drop them after consumers
-- migrate to read from this table.
--
-- Idempotent: every operation uses IF NOT EXISTS or DO blocks.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id      UUID        NOT NULL,
  provider      TEXT        NOT NULL,
  email         TEXT,
  access_token  TEXT,
  refresh_token TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT calendar_connections_provider_check
    CHECK (provider IN ('google', 'microsoft')),
  CONSTRAINT calendar_connections_user_provider_key
    UNIQUE (user_id, provider)
);

-- Indexes
-- (user_id, provider) is already covered by the unique constraint
CREATE INDEX IF NOT EXISTS idx_calendar_connections_owner_id
  ON public.calendar_connections (owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id
  ON public.calendar_connections (user_id);

-- updated_at trigger — uses extensions.moddatetime when present, manual fallback otherwise
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'extensions' AND p.proname = 'moddatetime'
  ) THEN
    BEGIN
      EXECUTE 'CREATE TRIGGER set_updated_at_calendar_connections
               BEFORE UPDATE ON public.calendar_connections
               FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  ELSE
    CREATE OR REPLACE FUNCTION public.update_calendar_connections_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $f$
    BEGIN NEW.updated_at = now(); RETURN NEW; END; $f$;

    BEGIN
      EXECUTE 'CREATE TRIGGER set_updated_at_calendar_connections
               BEFORE UPDATE ON public.calendar_connections
               FOR EACH ROW EXECUTE FUNCTION public.update_calendar_connections_updated_at()';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------
-- Mandatory because this table stores long-lived OAuth refresh tokens.
-- Three policies:
--   1. service_role full access (admin/server jobs / cron syncs)
--   2. own-row SELECT for the authenticated user (so client code can read
--      its own connection state without exposing other users' tokens)
--   3. own-row INSERT/UPDATE/DELETE for the authenticated user (so the
--      OAuth callback handlers can write the row using the user's session)
-- Notably: NO public read. There is no scenario where one user should see
-- another user's refresh token.
-- ----------------------------------------------------------------------------
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_connections' AND policyname = 'calendar_connections_service_role'
  ) THEN
    CREATE POLICY calendar_connections_service_role
      ON public.calendar_connections FOR ALL
      TO service_role
      USING (TRUE) WITH CHECK (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_connections' AND policyname = 'calendar_connections_select_own'
  ) THEN
    CREATE POLICY calendar_connections_select_own
      ON public.calendar_connections FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_connections' AND policyname = 'calendar_connections_insert_own'
  ) THEN
    CREATE POLICY calendar_connections_insert_own
      ON public.calendar_connections FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_connections' AND policyname = 'calendar_connections_update_own'
  ) THEN
    CREATE POLICY calendar_connections_update_own
      ON public.calendar_connections FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'calendar_connections' AND policyname = 'calendar_connections_delete_own'
  ) THEN
    CREATE POLICY calendar_connections_delete_own
      ON public.calendar_connections FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE public.calendar_connections IS
  'Normalized OAuth calendar token store, keyed on (user_id, provider). Replaces diviners.google_calendar_token / outlook_calendar_token JSONB columns. owner_id ties to the generic owner_id used by bookings/services. RLS: service_role full access; users can only see/write their own row.';
`;
