-- ============================================================================
-- astro_ai_responses (Apr 24, 2026)
--
-- Persistence layer for AI-generated astrological reports. Replaces the
-- legacy NestJS/MongoDB `save-astro-AI-Response` endpoint with an in-house
-- Supabase-backed equivalent so the AstrologyPro Next.js app can:
--   • avoid repeating expensive AI generation on every visit
--   • render previously generated reports from a stable record
--   • support shareable links via the row's UUID
--
-- Strictly additive. Safe to re-run.
--
-- Spec source:
--   tasks/24.04.2026/astro-toolkit/astro_ai_save_response_logic_nextjs.md
--   tasks/24.04.2026/astro-toolkit/astro_ai_implementation_logic.md
-- ============================================================================

-- ── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.astro_ai_responses (
  id                                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Optional FK to the user who created the row. Nullable so rows that
  -- legitimately belong to no user (e.g. anonymous shareable artifacts in
  -- the future) are still possible. Default flow: the save endpoint sets
  -- this to the authenticated user.
  user_id                           UUID         REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Spec fields (preserve original names + types).
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
  -- Mirrors the legacy "P2 = partner" naming used by the existing admin
  -- horoscope flow (see src/app/admin/horoscope/page.tsx). Kept additive so
  -- both _self/_partner and _p2 conventions survive without schema churn.
  free_natal_wheel_chart_p2         TEXT,
  free_natal_wheel_chart_transit_p2 TEXT,

  response_share_url                TEXT,
  created_at                        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Note on JSONB NOT NULL DEFAULT: the spec writes `JSONB DEFAULT '{}'::jsonb`
-- but leaves NULL allowed. The strict NOT NULL above keeps the application
-- code simpler — rows are guaranteed to round-trip as objects/arrays, never
-- as `null`. Existing rows that *would have been* NULL just get the default
-- empty object/array on insert, which is what the spec's NestJS shape does
-- in practice anyway.

-- Note on TEXT vs JSONB for `ai_response`: the spec doc shows BOTH `TEXT`
-- (in the SQL DDL block) and the implementation logic doc treats it as a
-- structured object (`reportData.ai_response.western_horoscope_planets.map`).
-- We choose JSONB so the persisted shape matches the runtime usage and
-- queries can filter into the structure if ever needed. The TEXT spec line
-- looks like a holdover from the Mongo schema.

-- ── updated_at trigger ───────────────────────────────────────────────────────
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

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.astro_ai_responses ENABLE ROW LEVEL SECURITY;

-- Service role: full access (used by all server-side admin clients).
DROP POLICY IF EXISTS astro_ai_responses_service_role_all
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_service_role_all
  ON public.astro_ai_responses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users: SELECT any row by id.
-- The id is a UUID — the share-link key — so by-id reads are intentional.
-- This is the same shape the spec doc proposes for "password-protected
-- shared links (using the _id as the access key)".
DROP POLICY IF EXISTS astro_ai_responses_authenticated_select
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_authenticated_select
  ON public.astro_ai_responses
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users: INSERT only with user_id = themselves.
DROP POLICY IF EXISTS astro_ai_responses_authenticated_insert
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_authenticated_insert
  ON public.astro_ai_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Authenticated users: UPDATE only their own rows.
DROP POLICY IF EXISTS astro_ai_responses_authenticated_update
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_authenticated_update
  ON public.astro_ai_responses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Authenticated users: DELETE only their own rows.
DROP POLICY IF EXISTS astro_ai_responses_authenticated_delete
  ON public.astro_ai_responses;
CREATE POLICY astro_ai_responses_authenticated_delete
  ON public.astro_ai_responses
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- "My recent reports" listing pattern.
CREATE INDEX IF NOT EXISTS ix_astro_ai_responses_user_created
  ON public.astro_ai_responses (user_id, created_at DESC);

-- Toolname breakdown — useful for analytics + future "find my last report
-- for tool X" reads. Partial so we don't index NULL toolnames.
CREATE INDEX IF NOT EXISTS ix_astro_ai_responses_toolname
  ON public.astro_ai_responses (toolname)
  WHERE toolname IS NOT NULL;

-- ============================================================================
-- Rollback (manual):
--   DROP TRIGGER IF EXISTS astro_ai_responses_updated_at_trg
--     ON public.astro_ai_responses;
--   DROP FUNCTION IF EXISTS public.astro_ai_responses_set_updated_at();
--   DROP TABLE IF EXISTS public.astro_ai_responses;
-- ============================================================================
