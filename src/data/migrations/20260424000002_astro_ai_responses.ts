// Bundled mirror of supabase/migrations/20260424000002_astro_ai_responses.sql
// Keep this file byte-for-byte aligned with the canonical .sql.

export const MIGRATION_SQL = `
-- ============================================================================
-- astro_ai_responses (Apr 24, 2026)
--
-- Persistence layer for AI-generated astrological reports. Replaces the
-- legacy NestJS/MongoDB \`save-astro-AI-Response\` endpoint with an in-house
-- Supabase-backed equivalent so the AstrologyPro Next.js app can:
--   * avoid repeating expensive AI generation on every visit
--   * render previously generated reports from a stable record
--   * support shareable links via the row's UUID
--
-- Strictly additive. Safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.astro_ai_responses (
  id                                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                           UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  condition                         JSONB        NOT NULL DEFAULT '{}'::jsonb,
  toolname                          TEXT,
  ai_response                       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  json_condition                    TEXT,
  chat_response                     JSONB        NOT NULL DEFAULT '{}'::jsonb,
  chat_questions                    JSONB        NOT NULL DEFAULT '[]'::jsonb,
  natal_chart                       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  form_data                         JSONB        NOT NULL DEFAULT '{}'::jsonb,
  astro_api_data                    JSONB        NOT NULL DEFAULT '{}'::jsonb,
  summary                           TEXT,
  free_natal_wheel_chart            TEXT,
  free_natal_wheel_chart_transit    TEXT,
  free_natal_wheel_chart_self       TEXT,
  free_natal_wheel_chart_partner    TEXT,
  free_natal_wheel_chart_p2         TEXT,
  free_natal_wheel_chart_transit_p2 TEXT,
  response_share_url                TEXT,
  created_at                        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.astro_ai_responses_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS astro_ai_responses_updated_at_trg
  ON public.astro_ai_responses;

CREATE TRIGGER astro_ai_responses_updated_at_trg
  BEFORE UPDATE ON public.astro_ai_responses
  FOR EACH ROW
  EXECUTE PROCEDURE public.astro_ai_responses_set_updated_at();

ALTER TABLE public.astro_ai_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS astro_ai_responses_service_role_all
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_service_role_all
  ON public.astro_ai_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS astro_ai_responses_authenticated_select
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_authenticated_select
  ON public.astro_ai_responses
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS astro_ai_responses_authenticated_insert
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_authenticated_insert
  ON public.astro_ai_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS astro_ai_responses_authenticated_update
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_authenticated_update
  ON public.astro_ai_responses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS astro_ai_responses_authenticated_delete
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_authenticated_delete
  ON public.astro_ai_responses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS ix_astro_ai_responses_user_created
  ON public.astro_ai_responses (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_astro_ai_responses_toolname
  ON public.astro_ai_responses (toolname)
  WHERE toolname IS NOT NULL;
`;
