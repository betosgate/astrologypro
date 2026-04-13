-- ============================================================
-- Task 09: Chart Notification Delivery Audit
-- Tracks delivery of natal chart and monthly transit notifications
-- independently from chart generation, so failures are visible
-- to admin and resend is safe and auditable.
-- build: 2026-04-13
-- ============================================================

CREATE TABLE IF NOT EXISTS chart_notification_deliveries (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What kind of artifact triggered this notification
  artifact_type           TEXT        NOT NULL
    CHECK (artifact_type IN ('natal_chart', 'monthly_transit', 'relationship_chart')),

  -- ID of the specific artifact row (family_member_id for natal, monthly_transit.id for transit)
  artifact_id             TEXT        NOT NULL,

  -- Who should receive the notification (the owning community member)
  recipient_user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email         TEXT,

  -- Channel used (email is required; in_app is recommended but optional MVP)
  delivery_channel        TEXT        NOT NULL DEFAULT 'email'
    CHECK (delivery_channel IN ('email', 'in_app', 'both')),

  -- Current delivery state
  delivery_status         TEXT        NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'resent')),

  -- True if this notification is for a regeneration (not the first-time chart)
  is_regeneration_notice  BOOLEAN     NOT NULL DEFAULT false,

  first_sent_at           TIMESTAMPTZ,
  last_attempted_at       TIMESTAMPTZ,
  resend_count            INTEGER     NOT NULL DEFAULT 0,
  failure_reason          TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chart_notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Members can view their own notification history
CREATE POLICY "member_view_own_chart_notifs"
  ON chart_notification_deliveries FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

-- Service role full access (cron jobs, admin ops)
CREATE POLICY "service_role_chart_notifs"
  ON chart_notification_deliveries FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cnd_artifact
  ON chart_notification_deliveries(artifact_type, artifact_id);

CREATE INDEX IF NOT EXISTS idx_cnd_recipient
  ON chart_notification_deliveries(recipient_user_id);

-- Admin monitoring: quickly find all failures and pending sends
CREATE INDEX IF NOT EXISTS idx_cnd_status_failures
  ON chart_notification_deliveries(delivery_status)
  WHERE delivery_status IN ('pending', 'failed');
