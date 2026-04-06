-- Email send log (deduplication + history)
CREATE TABLE IF NOT EXISTS email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email_to text NOT NULL,
  template_name text NOT NULL,
  subject text,
  metadata jsonb DEFAULT '{}',
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON email_send_log(user_id, template_name);
CREATE INDEX ON email_send_log(sent_at DESC);
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'email_send_log'
      AND policyname = 'Service role full access'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Service role full access" ON email_send_log USING (true) WITH CHECK (true)
    $p$;
  END IF;
END $$;

-- Email sequence pause controls
CREATE TABLE IF NOT EXISTS email_sequence_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  is_paused boolean NOT NULL DEFAULT false,
  paused_at timestamptz,
  paused_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE email_sequence_controls ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'email_sequence_controls'
      AND policyname = 'Service role full access'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Service role full access" ON email_sequence_controls USING (true) WITH CHECK (true)
    $p$;
  END IF;
END $$;

-- Seed sequence control rows
INSERT INTO email_sequence_controls (sequence_name, display_name, description) VALUES
  ('community_welcome', 'Community Welcome', 'Sent after successful community signup'),
  ('monthly_transit_ready', 'Monthly Transit Ready', 'Sent when monthly transits are generated'),
  ('community_renewal_reminder', 'Renewal Reminder', 'Sent before subscription renewal'),
  ('community_payment_failed', 'Payment Failed', 'Sent on failed subscription payment'),
  ('membership_expiry_warning', 'Expiry Warning', 'Sent when membership is about to expire'),
  ('mystery_school_enrollment', 'Mystery School Enrollment', 'Confirmation after MS enrollment'),
  ('decan_lifecycle', 'Decan Lifecycle', 'Decan open/grace/missed notifications'),
  ('sunday_service_new_episode', 'Sunday Service New Episode', 'Notify members of new episodes')
ON CONFLICT (sequence_name) DO NOTHING;
