-- Scheduled notifications: deduplication table for cron-driven event reminder emails
-- Used by /api/cron/event-reminders to avoid sending duplicate reminders

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  diviner_id     UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  event_type     VARCHAR(50) NOT NULL,
  event_date     VARCHAR(50) NOT NULL,
  days_before    INTEGER NOT NULL,
  status         VARCHAR(20) DEFAULT 'sent',
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_scheduled_notifications_dedup
  ON scheduled_notifications (client_id, diviner_id, event_type, event_date, days_before);

CREATE INDEX idx_scheduled_notifications_client ON scheduled_notifications (client_id);
CREATE INDEX idx_scheduled_notifications_diviner ON scheduled_notifications (diviner_id);
