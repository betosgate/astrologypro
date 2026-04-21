export const MIGRATION_SQL = `-- Admin calendar booking: public shareable booking link per admin.

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_users_username_lower
  ON public.admin_users (LOWER(username))
  WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.admin_bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name      TEXT        NOT NULL,
  client_email     TEXT        NOT NULL,
  client_note      TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER     NOT NULL,
  timezone         TEXT        NOT NULL DEFAULT 'America/New_York',
  status           TEXT        NOT NULL DEFAULT 'confirmed'
                               CHECK (status IN ('confirmed', 'canceled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_bookings_admin_user_scheduled
  ON public.admin_bookings (admin_user_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_admin_bookings_scheduled
  ON public.admin_bookings (scheduled_at);

ALTER TABLE public.admin_bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_bookings' AND policyname = 'admin_bookings_service_role'
  ) THEN
    CREATE POLICY admin_bookings_service_role
      ON public.admin_bookings FOR ALL
      TO service_role
      USING (TRUE) WITH CHECK (TRUE);
  END IF;
END $$;
`;
