-- Add sla_breached_at column to support_tickets for precise breach timestamping
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ;

-- Function: mark tickets where SLA due date has passed and breach not yet recorded
CREATE OR REPLACE FUNCTION mark_sla_breached()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE support_tickets
  SET
    sla_breached    = TRUE,
    sla_breached_at = NOW()
  WHERE
    sla_due_at IS NOT NULL
    AND sla_due_at < NOW()
    AND sla_breached_at IS NULL
    AND status NOT IN ('resolved', 'closed', 'cancelled');
END;
$$;

-- Schedule pg_cron job to run every 5 minutes (wrapped in DO block in case pg_cron is not available)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'sla-breach-check',
      '*/5 * * * *',
      'SELECT mark_sla_breached()'
    );
  END IF;
EXCEPTION
  WHEN others THEN
    -- pg_cron not available; SLA breaches can be detected via API polling instead
    NULL;
END $$;
