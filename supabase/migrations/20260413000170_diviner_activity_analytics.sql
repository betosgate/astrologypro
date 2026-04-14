ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS source_host text,
  ADD COLUMN IF NOT EXISTS traffic_source text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS attribution_kind text,
  ADD COLUMN IF NOT EXISTS affiliate_related boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advocate_related boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS country_region text,
  ADD COLUMN IF NOT EXISTS city text;

CREATE INDEX IF NOT EXISTS idx_page_views_diviner_created ON public.page_views(diviner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_diviner_path ON public.page_views(diviner_id, path);
CREATE INDEX IF NOT EXISTS idx_page_views_traffic_source ON public.page_views(traffic_source, created_at DESC);

CREATE TABLE IF NOT EXISTS public.diviner_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES public.diviners(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  path varchar(255),
  referrer text,
  user_agent text,
  ip_hash varchar(64),
  source_host text,
  traffic_source text,
  referral_code text,
  attribution_kind text,
  country_code text,
  country_region text,
  city text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diviner_activity_events_diviner_created
  ON public.diviner_activity_events(diviner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diviner_activity_events_diviner_type
  ON public.diviner_activity_events(diviner_id, activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diviner_activity_events_created
  ON public.diviner_activity_events(created_at DESC);

ALTER TABLE public.diviner_activity_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diviner_activity_events'
      AND policyname = 'dae_diviner_select_own'
  ) THEN
    CREATE POLICY dae_diviner_select_own
      ON public.diviner_activity_events
      FOR SELECT
      USING (
        diviner_id IN (
          SELECT id FROM public.diviners WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diviner_activity_events'
      AND policyname = 'dae_service_role_all'
  ) THEN
    CREATE POLICY dae_service_role_all
      ON public.diviner_activity_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
