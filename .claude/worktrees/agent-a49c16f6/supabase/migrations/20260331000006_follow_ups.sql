CREATE TABLE follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  step INTEGER NOT NULL, -- 1=immediate, 2=3days, 3=30days
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  email_type VARCHAR(50) NOT NULL, -- 'recording_ready', 'reflection', 'rebooking'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_follow_ups_scheduled ON follow_up_sequences(scheduled_at) WHERE sent_at IS NULL;
ALTER TABLE follow_up_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_ups_diviner" ON follow_up_sequences FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
