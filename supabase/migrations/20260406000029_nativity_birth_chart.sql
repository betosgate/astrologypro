-- Migration: nativity_birth_chart
-- Stores saved birth chart results for community members

CREATE TABLE IF NOT EXISTS birth_chart_results (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_member_id uuid          REFERENCES community_members(id),
  city_label          text          NOT NULL,
  birth_day           int           NOT NULL,
  birth_month         int           NOT NULL,
  birth_year          int           NOT NULL,
  birth_hour          int           NOT NULL,
  birth_min           int           NOT NULL,
  lat                 numeric(10,6) NOT NULL,
  lon                 numeric(10,6) NOT NULL,
  tzone               text          NOT NULL,
  chart_url           text,
  astro_data          jsonb,
  created_at          timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX ON birth_chart_results(user_id, created_at DESC);

ALTER TABLE birth_chart_results ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'birth_chart_results'
      AND policyname = 'users_own_charts'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "users_own_charts"
        ON birth_chart_results FOR ALL
        USING (auth.uid() = user_id)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'birth_chart_results'
      AND policyname = 'service_role_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "service_role_all"
        ON birth_chart_results FOR ALL
        TO service_role
        USING (true)
    $p$;
  END IF;
END $$;

-- AI rate limiting: simple counter per user per UTC day
CREATE TABLE IF NOT EXISTS ai_interpretation_usage (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date        NOT NULL DEFAULT CURRENT_DATE,
  call_count int         NOT NULL DEFAULT 0,
  UNIQUE (user_id, usage_date)
);

CREATE INDEX ON ai_interpretation_usage(user_id, usage_date);

ALTER TABLE ai_interpretation_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ai_interpretation_usage'
      AND policyname = 'users_own_usage'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "users_own_usage"
        ON ai_interpretation_usage FOR ALL
        USING (auth.uid() = user_id)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ai_interpretation_usage'
      AND policyname = 'service_role_usage_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "service_role_usage_all"
        ON ai_interpretation_usage FOR ALL
        TO service_role
        USING (true)
    $p$;
  END IF;
END $$;
