-- ============================================================================
-- Mundane Astrology — Alert Rules + Notifications
-- ============================================================================

-- Alert rules defined by the user
CREATE TABLE IF NOT EXISTS mundane_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'eclipse_on_entity',    -- eclipse hits sensitive entity chart point
    'ingress_angular',      -- ingress activates angular position
    'leader_chart_hit',     -- transit hits leader natal chart
    'event_cluster',        -- multiple events cluster in short window
    'forecast_window_open', -- forecast period begins
    'custom'                -- user-defined text rule
  )),
  -- Conditions stored as flexible JSONB (entity_ids, planet, degree, orb, etc.)
  conditions JSONB NOT NULL DEFAULT '{}',
  -- Delivery
  delivery_channels TEXT[] DEFAULT ARRAY['in_app'],  -- in_app, email, push
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  muted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mar_user ON mundane_alert_rules(user_id, is_active);

-- Alert notifications generated from rules or manually
CREATE TABLE IF NOT EXISTS mundane_alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_rule_id UUID REFERENCES mundane_alert_rules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_id UUID REFERENCES mundane_entities(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  snoozed_until TIMESTAMPTZ,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_man_user_unread ON mundane_alert_notifications(user_id, is_read, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_man_user_triggered ON mundane_alert_notifications(user_id, triggered_at DESC);

-- RLS
ALTER TABLE mundane_alert_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mundane_alert_rules' AND policyname = 'mar_own'
  ) THEN
    CREATE POLICY "mar_own" ON mundane_alert_rules FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

ALTER TABLE mundane_alert_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mundane_alert_notifications' AND policyname = 'man_own'
  ) THEN
    CREATE POLICY "man_own" ON mundane_alert_notifications FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- updated_at trigger for alert_rules
CREATE OR REPLACE FUNCTION mundane_alerts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mar_updated_at ON mundane_alert_rules;
CREATE TRIGGER trg_mar_updated_at
  BEFORE UPDATE ON mundane_alert_rules
  FOR EACH ROW EXECUTE FUNCTION mundane_alerts_updated_at();

-- Service role bypass policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mundane_alert_rules' AND policyname = 'mar_service_role'
  ) THEN
    CREATE POLICY "mar_service_role" ON mundane_alert_rules FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mundane_alert_notifications' AND policyname = 'man_service_role'
  ) THEN
    CREATE POLICY "man_service_role" ON mundane_alert_notifications FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  END IF;
END $$;
