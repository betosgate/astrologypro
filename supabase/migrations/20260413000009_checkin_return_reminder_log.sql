CREATE TABLE IF NOT EXISTS public.check_in_return_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid NOT NULL REFERENCES public.check_ins(id) ON DELETE CASCADE,
  diviner_id uuid NOT NULL REFERENCES public.diviners(id) ON DELETE CASCADE,
  email text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('saturn_return','jupiter_return','solar_return')),
  event_date date NOT NULL,
  occurrence_number integer,
  reminder_window text NOT NULL CHECK (reminder_window IN ('30d','7d','1d','0d')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS check_in_return_reminder_log_unique
  ON public.check_in_return_reminder_log(check_in_id, event_type, event_date, reminder_window);

CREATE INDEX IF NOT EXISTS check_in_return_reminder_log_email_idx
  ON public.check_in_return_reminder_log(email, created_at DESC);

ALTER TABLE public.check_in_return_reminder_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'check_in_return_reminder_log'
      AND policyname = 'service_role_check_in_return_reminder_log'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "service_role_check_in_return_reminder_log"
        ON public.check_in_return_reminder_log
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $p$;
  END IF;
END $$;
