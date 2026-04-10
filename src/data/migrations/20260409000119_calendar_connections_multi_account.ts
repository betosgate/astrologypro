// AUTO-GENERATED bundled mirror of supabase/migrations/20260409000119_calendar_connections_multi_account.sql
// Used by /api/admin/db/migrate so the deployed function does not need filesystem access.
// To regenerate: copy the .sql file contents into the template literal below.

export const MIGRATION_SQL = `-- ============================================================================
-- calendar_connections multi-account support
--
-- Expands calendar_connections so one user can connect multiple Google and/or
-- Microsoft accounts at the same time.
--
-- Previous shape:
--   UNIQUE (user_id, provider)
--
-- New shape:
--   account_identifier TEXT NOT NULL
--   UNIQUE (user_id, provider, account_identifier)
--
-- account_identifier stores a stable provider-specific account key such as:
--   - Google primary calendar id / email
--   - Microsoft Graph /me id
--   - legacy fallback: provider:id
--
-- Idempotent and additive-safe.
-- ============================================================================

ALTER TABLE public.calendar_connections
  ADD COLUMN IF NOT EXISTS account_identifier TEXT;

UPDATE public.calendar_connections
SET email = NULLIF(trim(email), '')
WHERE email IS NOT NULL;

UPDATE public.calendar_connections
SET account_identifier = COALESCE(
  NULLIF(trim(account_identifier), ''),
  NULLIF(lower(trim(email)), ''),
  provider || ':' || id::text
)
WHERE account_identifier IS NULL OR trim(account_identifier) = '';

ALTER TABLE public.calendar_connections
  ALTER COLUMN account_identifier SET NOT NULL;

ALTER TABLE public.calendar_connections
  DROP CONSTRAINT IF EXISTS calendar_connections_user_provider_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_connections_user_provider_account
  ON public.calendar_connections (user_id, provider, account_identifier);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_owner_provider
  ON public.calendar_connections (owner_id, provider);

COMMENT ON COLUMN public.calendar_connections.account_identifier IS
  'Stable provider account key (email, calendar id, or provider account id). Enables multiple connected accounts per provider for one user.';

COMMENT ON TABLE public.calendar_connections IS
  'Normalized OAuth calendar token store. Supports multiple connected Google/Microsoft accounts per user via (user_id, provider, account_identifier). owner_id ties to the generic owner_id used by bookings/services. RLS: service_role full access; users can only see/write their own rows.';
`;
