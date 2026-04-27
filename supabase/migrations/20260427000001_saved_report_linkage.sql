-- ============================================================================
-- Saved Report Linkage (Apr 27, 2026)
--
-- Additive schema bridging community domain tables to full saved toolkit
-- report artifacts in astro_ai_responses. Implements Task 02 + Task 03 of
--   tasks/27.04.2026/community-saved-chart-report-lifecycle/
--
-- Two-layer architecture:
--
--   1) Domain lifecycle (existing tables: community_family_members,
--      monthly_transits, relationship_charts) answers product workflow
--      questions: "what CTA does the user see?" / "is the chart valid?"
--
--   2) Full report artifact (existing astro_ai_responses) holds the
--      complete toolkit/AI payload that View renders without re-running
--      compute or AI.
--
-- The migration adds:
--   - natal/monthly/relationship → astro_ai_responses linkage columns
--     with simple report-status text + generated_at timestamps
--   - new community_relationship_reports child table so a single pair
--     (person_a, person_b) can have multiple report types (friendship /
--     romantic / partnership) without overloading relationship_charts'
--     single chart_data column (Task 06 design note).
--
-- Strictly additive. Safe to re-run. Existing lightweight chart fields
-- (natal_chart, transit_data, chart_data) are preserved unchanged so old
-- valid rows keep rendering during rollout (Task 09 compatibility rule).
--
-- Rollback (manual):
--   ALTER TABLE community_family_members DROP COLUMN IF EXISTS natal_report_id;
--   ALTER TABLE community_family_members DROP COLUMN IF EXISTS natal_report_generated_at;
--   ALTER TABLE community_family_members DROP COLUMN IF EXISTS natal_report_status;
--   ALTER TABLE monthly_transits        DROP COLUMN IF EXISTS full_report_id;
--   ALTER TABLE monthly_transits        DROP COLUMN IF EXISTS full_report_generated_at;
--   ALTER TABLE monthly_transits        DROP COLUMN IF EXISTS full_report_status;
--   ALTER TABLE relationship_charts     DROP COLUMN IF EXISTS report_id;
--   ALTER TABLE relationship_charts     DROP COLUMN IF EXISTS report_type;
--   ALTER TABLE relationship_charts     DROP COLUMN IF EXISTS report_generated_at;
--   ALTER TABLE relationship_charts     DROP COLUMN IF EXISTS report_status;
--   DROP TABLE IF EXISTS public.community_relationship_reports;
-- ============================================================================

-- ── Natal report linkage on community_family_members ──────────────────────
ALTER TABLE public.community_family_members
  ADD COLUMN IF NOT EXISTS natal_report_id UUID
    REFERENCES public.astro_ai_responses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS natal_report_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS natal_report_status VARCHAR(24);

-- Status enum-like CHECK; nullable so existing rows stay untouched.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'community_family_members_natal_report_status_check'
  ) THEN
    ALTER TABLE public.community_family_members
      ADD CONSTRAINT community_family_members_natal_report_status_check
      CHECK (
        natal_report_status IS NULL OR natal_report_status IN (
          'missing', 'generating', 'generated', 'failed', 'stale',
          'locked_for_review'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_cfm_natal_report_id
  ON public.community_family_members (natal_report_id)
  WHERE natal_report_id IS NOT NULL;

-- ── Monthly full-report linkage on monthly_transits ───────────────────────
ALTER TABLE public.monthly_transits
  ADD COLUMN IF NOT EXISTS full_report_id UUID
    REFERENCES public.astro_ai_responses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS full_report_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS full_report_status VARCHAR(24);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'monthly_transits_full_report_status_check'
  ) THEN
    ALTER TABLE public.monthly_transits
      ADD CONSTRAINT monthly_transits_full_report_status_check
      CHECK (
        full_report_status IS NULL OR full_report_status IN (
          'missing', 'generating', 'generated', 'failed', 'stale',
          'locked_for_review'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_monthly_transits_full_report_id
  ON public.monthly_transits (full_report_id)
  WHERE full_report_id IS NOT NULL;

-- ── Relationship single-report linkage on relationship_charts ─────────────
-- For the legacy single-row-per-pair model. New multi-type rollout will
-- prefer community_relationship_reports below; this stays for back-compat.
ALTER TABLE public.relationship_charts
  ADD COLUMN IF NOT EXISTS report_id UUID
    REFERENCES public.astro_ai_responses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS report_type VARCHAR(24),
  ADD COLUMN IF NOT EXISTS report_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_status VARCHAR(24);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationship_charts_report_status_check'
  ) THEN
    ALTER TABLE public.relationship_charts
      ADD CONSTRAINT relationship_charts_report_status_check
      CHECK (
        report_status IS NULL OR report_status IN (
          'missing', 'generating', 'generated', 'failed', 'stale',
          'locked_for_review'
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'relationship_charts_report_type_check'
  ) THEN
    ALTER TABLE public.relationship_charts
      ADD CONSTRAINT relationship_charts_report_type_check
      CHECK (
        report_type IS NULL OR report_type IN (
          'friendship', 'romantic', 'partnership'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_relationship_charts_report_id
  ON public.relationship_charts (report_id)
  WHERE report_id IS NOT NULL;

-- ── Multi-type relationship reports child table ───────────────────────────
-- One row per (member, sorted-pair, report_type) so a couple can have
-- distinct friendship + romantic + partnership reports.
CREATE TABLE IF NOT EXISTS public.community_relationship_reports (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                UUID         NOT NULL
    REFERENCES public.community_members(id) ON DELETE CASCADE,
  -- person_a_id < person_b_id (canonical sort) — same convention as
  -- relationship_charts. Both reference community_family_members(id).
  person_a_id              UUID         NOT NULL
    REFERENCES public.community_family_members(id) ON DELETE CASCADE,
  person_b_id              UUID         NOT NULL
    REFERENCES public.community_family_members(id) ON DELETE CASCADE,
  report_type              VARCHAR(24)  NOT NULL,
  astro_ai_response_id     UUID
    REFERENCES public.astro_ai_responses(id) ON DELETE SET NULL,
  report_status            VARCHAR(24)  NOT NULL DEFAULT 'missing',
  generated_at             TIMESTAMPTZ,
  invalidated_at           TIMESTAMPTZ,
  invalidation_reason      TEXT,
  failure_reason           TEXT,
  last_attempted_at        TIMESTAMPTZ,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT community_relationship_reports_pair_order_check
    CHECK (person_a_id < person_b_id),
  CONSTRAINT community_relationship_reports_report_type_check
    CHECK (report_type IN ('friendship', 'romantic', 'partnership')),
  CONSTRAINT community_relationship_reports_report_status_check
    CHECK (report_status IN (
      'missing', 'generating', 'generated', 'failed', 'stale',
      'locked_for_review'
    )),
  CONSTRAINT community_relationship_reports_unique_pair_type
    UNIQUE (person_a_id, person_b_id, report_type)
);

CREATE INDEX IF NOT EXISTS ix_crr_member
  ON public.community_relationship_reports (member_id);

CREATE INDEX IF NOT EXISTS ix_crr_status
  ON public.community_relationship_reports (member_id, report_status);

-- ── updated_at trigger (reuse the helper installed for astro_ai_responses) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'astro_ai_responses_set_updated_at'
  ) THEN
    -- Helper not present (e.g. new env that hasn't run the astro_ai_responses
    -- migration). Define a local copy to keep this migration self-contained.
    CREATE OR REPLACE FUNCTION public.community_relationship_reports_set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $body$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $body$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS community_relationship_reports_updated_at_trg
  ON public.community_relationship_reports;
CREATE TRIGGER community_relationship_reports_updated_at_trg
  BEFORE UPDATE ON public.community_relationship_reports
  FOR EACH ROW
  EXECUTE PROCEDURE public.astro_ai_responses_set_updated_at();

-- ── RLS on community_relationship_reports ─────────────────────────────────
ALTER TABLE public.community_relationship_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crr_service_role_all
  ON public.community_relationship_reports;
CREATE POLICY crr_service_role_all
  ON public.community_relationship_reports
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated members can SELECT/INSERT/UPDATE/DELETE rows that belong
-- to their own community_members row. Mirrors the policy on
-- community_family_members so household scoping stays consistent.
DROP POLICY IF EXISTS crr_member_own
  ON public.community_relationship_reports;
CREATE POLICY crr_member_own
  ON public.community_relationship_reports
  FOR ALL TO authenticated
  USING (
    member_id IN (
      SELECT id FROM public.community_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.community_members WHERE user_id = auth.uid()
    )
  );
