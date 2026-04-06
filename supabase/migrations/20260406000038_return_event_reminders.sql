-- Migration 038: Lifecycle Return Events
-- Creates lifecycle_return_events table for Saturn/Jupiter/Solar return tracking
-- and seeds email_sequence_controls for the new sequence.

-- ---------------------------------------------------------------------------
-- lifecycle_return_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lifecycle_return_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- source: either client or community_family_member (exactly one must be set)
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  family_member_id uuid REFERENCES community_family_members(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('saturn_return', 'jupiter_return', 'solar_return')),
  event_date date NOT NULL,         -- computed date of the return
  occurrence_number integer NOT NULL DEFAULT 1,  -- 1st, 2nd, 3rd return, etc.
  -- reminder tracking (null = not yet sent)
  reminder_30d_sent_at timestamptz,
  reminder_7d_sent_at timestamptz,
  reminder_1d_sent_at timestamptz,
  reminder_day_of_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_one_source CHECK (
    (client_id IS NOT NULL AND family_member_id IS NULL) OR
    (client_id IS NULL AND family_member_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS lifecycle_events_event_date_idx ON lifecycle_return_events(event_date);
CREATE INDEX IF NOT EXISTS lifecycle_events_client_idx ON lifecycle_return_events(client_id);
CREATE INDEX IF NOT EXISTS lifecycle_events_family_idx ON lifecycle_return_events(family_member_id);
CREATE INDEX IF NOT EXISTS lifecycle_events_type_idx ON lifecycle_return_events(event_type);

-- Composite index to support the cron's window query (event_date range + reminder sent checks)
CREATE INDEX IF NOT EXISTS lifecycle_events_date_type_idx ON lifecycle_return_events(event_date, event_type);

-- RLS: admin can manage all events; diviners can see their clients' events
ALTER TABLE lifecycle_return_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'lifecycle_return_events'
      AND policyname = 'lifecycle_events_admin'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "lifecycle_events_admin" ON lifecycle_return_events FOR ALL
        USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Add primary_diviner_id to clients for attribution / email routing
-- ---------------------------------------------------------------------------
ALTER TABLE clients ADD COLUMN IF NOT EXISTS primary_diviner_id uuid REFERENCES diviners(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS clients_primary_diviner_idx ON clients(primary_diviner_id);

-- ---------------------------------------------------------------------------
-- Seed email_sequence_controls for the new return_reminders sequence
-- ---------------------------------------------------------------------------
INSERT INTO email_sequence_controls (sequence_name, display_name, description, is_paused)
VALUES (
  'return_reminders',
  'Return Event Reminders',
  'Saturn Return, Jupiter Return, and Solar Return lifecycle reminder emails',
  false
)
ON CONFLICT (sequence_name) DO NOTHING;
