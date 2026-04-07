-- Stores the mapping between calendar webhook channel IDs and diviners.
-- When Google/Outlook sends a push notification, we look up the channel_id
-- to find which diviner's bookings to reconcile.

CREATE TABLE IF NOT EXISTS calendar_webhook_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL UNIQUE,
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  resource_id TEXT,
  expiration TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cwc_channel ON calendar_webhook_channels(channel_id);

ALTER TABLE calendar_webhook_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "svc_webhook_channels" ON calendar_webhook_channels
  FOR ALL TO service_role USING (true);
