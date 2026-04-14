-- ============================================================================
-- Cron Run Log + supporting schema changes for CC-6 background jobs.
-- ============================================================================

-- Unique constraint on mundane_astro_events to support idempotent generation
-- (ON CONFLICT DO NOTHING in generate-astro-events cron).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mundane_astro_events_title_datetime_uniq'
  ) THEN
    ALTER TABLE mundane_astro_events
      ADD CONSTRAINT mundane_astro_events_title_datetime_uniq
        UNIQUE (title, event_datetime_utc);
  END IF;
END $$;

-- Add 'settled' to settlement_status CHECK constraint so settlement-sweep
-- can transition pending entries to settled status.
ALTER TABLE public.revenue_ledger_entries
  DROP CONSTRAINT IF EXISTS revenue_ledger_entries_settlement_status_check;

ALTER TABLE public.revenue_ledger_entries
  ADD CONSTRAINT revenue_ledger_entries_settlement_status_check
    CHECK (settlement_status IN ('pending', 'approved', 'held', 'paid', 'reversed', 'disputed', 'settled'));

-- Cron run log table
CREATE TABLE IF NOT EXISTS cron_run_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'error')),
  result JSONB,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_cron_run_log_job ON cron_run_log(job_name, started_at DESC);

ALTER TABLE cron_run_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cron_log_service" ON cron_run_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "cron_log_admin_read" ON cron_run_log
  FOR SELECT TO authenticated
  USING (true);
