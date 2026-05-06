// Bundled mirror of supabase/migrations/20260506000003_mystery_school_decan_admin_content.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- ============================================================================
-- Mystery School Decan Admin Content Upgrade
--
-- Backend foundation for the richer Decan experience:
--   1. Adds admin-managed content columns to decans.
--   2. Creates decan_instructor_journals (Beto/admin per-Decan logs).
--   3. Creates decan_resources (per-Decan PDFs/videos/audio/links).
--   4. Creates decan_student_journal_entries (optional learner journals
--      with admin review/feedback/rating). Required scry/mundane
--      journals stay in their own tables (out of scope per spec §Out Of
--      Scope).
--
-- Sprint plan:
--   docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md
-- ============================================================================

BEGIN;

-- ─── 1. decans content columns ────────────────────────────────────────────
ALTER TABLE public.decans
  ADD COLUMN IF NOT EXISTS intro_video_url             TEXT,
  ADD COLUMN IF NOT EXISTS intro_audio_url             TEXT,
  ADD COLUMN IF NOT EXISTS ritual_video_url            TEXT,
  ADD COLUMN IF NOT EXISTS tarot_explanation           TEXT,
  ADD COLUMN IF NOT EXISTS learning_objectives         TEXT,
  ADD COLUMN IF NOT EXISTS practice_focus_title        TEXT,
  ADD COLUMN IF NOT EXISTS practice_focus_instructions TEXT,
  ADD COLUMN IF NOT EXISTS practice_focus_technique    TEXT,
  ADD COLUMN IF NOT EXISTS related_audio_url           TEXT,
  ADD COLUMN IF NOT EXISTS content_active              BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS content_updated_at          TIMESTAMPTZ;

-- ─── 2. decan_instructor_journals ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.decan_instructor_journals (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  decan_id          UUID         NOT NULL REFERENCES public.decans(id) ON DELETE CASCADE,
  title             TEXT         NOT NULL,
  entry_type        TEXT         NOT NULL DEFAULT 'text'
                                 CHECK (entry_type IN ('text', 'audio', 'video')),
  content           TEXT,
  media_url         TEXT,
  duration_seconds  INTEGER      CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  instructor_name   TEXT,
  is_published      BOOLEAN      NOT NULL DEFAULT FALSE,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decan_instructor_journals_decan
  ON public.decan_instructor_journals (decan_id, is_published, published_at DESC);

ALTER TABLE public.decan_instructor_journals ENABLE ROW LEVEL SECURITY;

DO $rls_ij$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='decan_instructor_journals'
      AND policyname='svc_decan_instructor_journals') THEN
    EXECUTE 'CREATE POLICY svc_decan_instructor_journals
             ON public.decan_instructor_journals
             FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='decan_instructor_journals'
      AND policyname='auth_read_published_decan_instructor_journals') THEN
    EXECUTE 'CREATE POLICY auth_read_published_decan_instructor_journals
             ON public.decan_instructor_journals
             FOR SELECT TO authenticated
             USING (is_published = TRUE)';
  END IF;
END
$rls_ij$;

-- ─── 3. decan_resources ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.decan_resources (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  decan_id      UUID         NOT NULL REFERENCES public.decans(id) ON DELETE CASCADE,
  title         TEXT         NOT NULL,
  resource_type TEXT         NOT NULL DEFAULT 'link'
                             CHECK (resource_type IN ('pdf', 'video', 'audio', 'link', 'image', 'text')),
  url           TEXT,
  description   TEXT,
  sort_order    INTEGER      NOT NULL DEFAULT 0,
  is_published  BOOLEAN      NOT NULL DEFAULT FALSE,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decan_resources_decan
  ON public.decan_resources (decan_id, is_published, sort_order);

ALTER TABLE public.decan_resources ENABLE ROW LEVEL SECURITY;

DO $rls_res$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='decan_resources'
      AND policyname='svc_decan_resources') THEN
    EXECUTE 'CREATE POLICY svc_decan_resources
             ON public.decan_resources
             FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='decan_resources'
      AND policyname='auth_read_published_decan_resources') THEN
    EXECUTE 'CREATE POLICY auth_read_published_decan_resources
             ON public.decan_resources
             FOR SELECT TO authenticated
             USING (is_published = TRUE)';
  END IF;
END
$rls_res$;

-- ─── 4. decan_student_journal_entries ─────────────────────────────────────
-- Optional/general per-Decan journal entries that complement the required
-- scry_journals + mundane_journals tables (which are NOT touched).
CREATE TABLE IF NOT EXISTS public.decan_student_journal_entries (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID         NOT NULL REFERENCES public.mystery_school_students(id) ON DELETE CASCADE,
  user_id             UUID         NOT NULL,
  decan_id            UUID         NOT NULL REFERENCES public.decans(id) ON DELETE CASCADE,
  title               TEXT,
  content             TEXT,
  entry_type          TEXT         NOT NULL DEFAULT 'text'
                                   CHECK (entry_type IN ('text', 'audio', 'video', 'image', 'mixed')),
  audio_url           TEXT,
  video_url           TEXT,
  image_url           TEXT,
  status              TEXT         NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft', 'submitted', 'reviewed', 'revision_requested')),
  submitted_at        TIMESTAMPTZ,
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         UUID,        -- auth.users.id of admin reviewer
  feedback_text       TEXT,
  rating              INTEGER      CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsje_student_decan
  ON public.decan_student_journal_entries (student_id, decan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dsje_status
  ON public.decan_student_journal_entries (status, submitted_at DESC)
  WHERE status IN ('submitted', 'revision_requested');
CREATE INDEX IF NOT EXISTS idx_dsje_user
  ON public.decan_student_journal_entries (user_id, created_at DESC);

ALTER TABLE public.decan_student_journal_entries ENABLE ROW LEVEL SECURITY;

DO $rls_dsje$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='decan_student_journal_entries'
      AND policyname='svc_decan_student_journal_entries') THEN
    EXECUTE 'CREATE POLICY svc_decan_student_journal_entries
             ON public.decan_student_journal_entries
             FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='decan_student_journal_entries'
      AND policyname='self_read_decan_student_journal_entries') THEN
    EXECUTE 'CREATE POLICY self_read_decan_student_journal_entries
             ON public.decan_student_journal_entries
             FOR SELECT TO authenticated
             USING (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='decan_student_journal_entries'
      AND policyname='self_write_decan_student_journal_entries') THEN
    EXECUTE 'CREATE POLICY self_write_decan_student_journal_entries
             ON public.decan_student_journal_entries
             FOR INSERT TO authenticated
             WITH CHECK (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='decan_student_journal_entries'
      AND policyname='self_update_decan_student_journal_entries') THEN
    -- Students can edit their own draft / revision_requested rows. Reviewer
    -- writes (status, feedback_text, rating, reviewed_*) go through the
    -- service_role from the admin-review API endpoint.
    EXECUTE 'CREATE POLICY self_update_decan_student_journal_entries
             ON public.decan_student_journal_entries
             FOR UPDATE TO authenticated
             USING (user_id = auth.uid()
                    AND status IN (''draft'', ''revision_requested''))';
  END IF;
END
$rls_dsje$;

-- ─── 5. updated_at trigger (shared) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decan_admin_content_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $trig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'decan_instructor_journals_updated_at'
      AND tgrelid = 'public.decan_instructor_journals'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER decan_instructor_journals_updated_at
             BEFORE UPDATE ON public.decan_instructor_journals
             FOR EACH ROW EXECUTE FUNCTION public.decan_admin_content_set_updated_at()';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'decan_resources_updated_at'
      AND tgrelid = 'public.decan_resources'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER decan_resources_updated_at
             BEFORE UPDATE ON public.decan_resources
             FOR EACH ROW EXECUTE FUNCTION public.decan_admin_content_set_updated_at()';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'decan_student_journal_entries_updated_at'
      AND tgrelid = 'public.decan_student_journal_entries'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER decan_student_journal_entries_updated_at
             BEFORE UPDATE ON public.decan_student_journal_entries
             FOR EACH ROW EXECUTE FUNCTION public.decan_admin_content_set_updated_at()';
  END IF;
END
$trig$;

-- ─── 6. Sanity ────────────────────────────────────────────────────────────
DO $check$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='decans'
      AND column_name='intro_video_url') THEN
    RAISE EXCEPTION 'decans.intro_video_url not added';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='decan_instructor_journals') THEN
    RAISE EXCEPTION 'decan_instructor_journals not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='decan_resources') THEN
    RAISE EXCEPTION 'decan_resources not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='decan_student_journal_entries') THEN
    RAISE EXCEPTION 'decan_student_journal_entries not created';
  END IF;
END
$check$;

COMMIT;
`;
