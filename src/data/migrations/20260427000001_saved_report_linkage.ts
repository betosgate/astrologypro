// Bundled mirror of supabase/migrations/20260427000001_saved_report_linkage.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- ============================================================================
-- Saved Report Linkage (Apr 27, 2026)
--
-- Additive schema bridging community domain tables to full saved toolkit
-- report artifacts in astro_ai_responses.
-- ============================================================================

ALTER TABLE public.community_family_members
  ADD COLUMN IF NOT EXISTS natal_report_id UUID
    REFERENCES public.astro_ai_responses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS natal_report_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS natal_report_status VARCHAR(24);

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

CREATE TABLE IF NOT EXISTS public.community_relationship_reports (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                UUID         NOT NULL
    REFERENCES public.community_members(id) ON DELETE CASCADE,
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

DROP TRIGGER IF EXISTS community_relationship_reports_updated_at_trg
  ON public.community_relationship_reports;
CREATE TRIGGER community_relationship_reports_updated_at_trg
  BEFORE UPDATE ON public.community_relationship_reports
  FOR EACH ROW
  EXECUTE PROCEDURE public.astro_ai_responses_set_updated_at();

ALTER TABLE public.community_relationship_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crr_service_role_all
  ON public.community_relationship_reports;
CREATE POLICY crr_service_role_all
  ON public.community_relationship_reports
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

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
`;
