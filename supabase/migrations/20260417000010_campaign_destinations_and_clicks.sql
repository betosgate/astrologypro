-- Task 09 (Campaign Task 01): Extend Campaigns with Destination Columns + Campaign Clicks Table
-- Depends on: 20260417000001 (diviner_services.is_enabled must exist for the auto-pause trigger)

-- ── Step 1: Add destination columns to affiliate_campaigns ────────────────────

ALTER TABLE affiliate_campaigns
  ADD COLUMN IF NOT EXISTS destination_type TEXT
    CHECK (destination_type IN ('PROFILE', 'SERVICE')),
  ADD COLUMN IF NOT EXISTS destination_profile_id UUID REFERENCES diviners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_service_template_id UUID REFERENCES service_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_diviner_service_id UUID REFERENCES diviner_services(id) ON DELETE SET NULL,

  -- Generated campaign code and URL
  ADD COLUMN IF NOT EXISTS campaign_code VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS share_url TEXT,

  -- Tracking link reference
  ADD COLUMN IF NOT EXISTS tracking_link_id UUID REFERENCES tracking_links(id) ON DELETE SET NULL,

  -- Channel/source metadata
  ADD COLUMN IF NOT EXISTS channel TEXT
    CHECK (channel IN ('facebook', 'instagram', 'whatsapp', 'youtube', 'email', 'twitter', 'tiktok', 'linkedin', 'direct', 'other')),
  ADD COLUMN IF NOT EXISTS content_variant TEXT,

  -- Auto-pause tracking
  ADD COLUMN IF NOT EXISTS auto_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_pause_reason TEXT,

  -- Updated by
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- ── Step 2: Add destination consistency constraints ───────────────────────────

ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT chk_destination_profile
    CHECK (
      destination_type != 'PROFILE'
      OR (destination_profile_id IS NOT NULL AND destination_service_template_id IS NULL)
    ),
  ADD CONSTRAINT chk_destination_service
    CHECK (
      destination_type != 'SERVICE'
      OR (destination_service_template_id IS NOT NULL AND destination_profile_id IS NULL)
    );

-- ── Step 3: Create campaign_clicks table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campaign reference
  campaign_id UUID REFERENCES affiliate_campaigns(id) ON DELETE CASCADE,
  tracking_link_id UUID REFERENCES tracking_links(id) ON DELETE SET NULL,
  campaign_code VARCHAR(12),

  -- Diviner + destination
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('PROFILE', 'SERVICE')),
  destination_id UUID NOT NULL,
  resolved_url TEXT NOT NULL,

  -- Click metadata
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer_url TEXT,
  user_agent TEXT,
  ip_hash VARCHAR(64),

  -- Device (parsed from user-agent at insert time)
  device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  browser VARCHAR(50),
  os VARCHAR(50),

  -- Geo (from Vercel headers)
  country_code VARCHAR(2),
  country_region VARCHAR(10),
  city VARCHAR(100),

  -- Session/visitor
  session_id VARCHAR(64),
  anonymous_visitor_id VARCHAR(64),

  -- Source tracking
  source VARCHAR(100),
  medium VARCHAR(100),
  utm_campaign VARCHAR(200),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_content VARCHAR(100),

  -- Click classification
  is_unique_click BOOLEAN NOT NULL DEFAULT TRUE,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,

  -- Conversion readiness (populated later)
  converted BOOLEAN DEFAULT FALSE,
  conversion_id UUID REFERENCES campaign_conversions(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Step 4: Indexes on campaign_clicks ───────────────────────────────────────

-- Primary query: clicks for a campaign by date
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign_date
  ON campaign_clicks(campaign_id, clicked_at DESC);

-- Diviner's click overview
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_diviner_date
  ON campaign_clicks(diviner_id, clicked_at DESC);

-- Unique click detection (visitor + campaign within time window)
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_unique_check
  ON campaign_clicks(campaign_id, anonymous_visitor_id, clicked_at DESC)
  WHERE anonymous_visitor_id IS NOT NULL;

-- Destination analysis
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_destination
  ON campaign_clicks(destination_type, destination_id, clicked_at DESC);

-- Campaign code lookup (for redirect route)
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_code
  ON campaign_clicks(campaign_code, clicked_at DESC);

-- Bot filtering
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_non_bot
  ON campaign_clicks(campaign_id, clicked_at DESC)
  WHERE is_bot = FALSE;

-- ── Step 5: Extend tracking_links table ──────────────────────────────────────

ALTER TABLE tracking_links
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES affiliate_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_type TEXT
    CHECK (destination_type IN ('PROFILE', 'SERVICE')),
  ADD COLUMN IF NOT EXISTS destination_entity_id UUID,
  ADD COLUMN IF NOT EXISTS unique_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── Step 6: Indexes on affiliate_campaigns (destination columns) ──────────────

-- Campaign code lookup (unique, sparse)
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_code
  ON affiliate_campaigns(campaign_code)
  WHERE campaign_code IS NOT NULL;

-- Destination type queries
CREATE INDEX IF NOT EXISTS idx_campaigns_destination_type
  ON affiliate_campaigns(diviner_id, destination_type, status);

-- Service destination lookup (for auto-pause trigger)
CREATE INDEX IF NOT EXISTS idx_campaigns_service_destination
  ON affiliate_campaigns(destination_service_template_id, status)
  WHERE destination_service_template_id IS NOT NULL;

-- ── Step 7: RLS for campaign_clicks ──────────────────────────────────────────

ALTER TABLE campaign_clicks ENABLE ROW LEVEL SECURITY;

-- Diviner can read their own clicks
CREATE POLICY campaign_clicks_diviner_read ON campaign_clicks
  FOR SELECT
  USING (
    diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
  );

-- Admin can read all clicks
CREATE POLICY campaign_clicks_admin_read ON campaign_clicks
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Insert allowed for service role (server-side click logging)
CREATE POLICY campaign_clicks_insert ON campaign_clicks
  FOR INSERT
  WITH CHECK (TRUE);

-- ── Step 8: Campaign code generation function ─────────────────────────────────

-- Generate unique cmp_ prefixed code (excludes ambiguous chars: 0/O, 1/l/I)
CREATE OR REPLACE FUNCTION generate_campaign_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  result TEXT := 'cmp_';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ── Step 9: Auto-pause trigger when service is disabled ───────────────────────

CREATE OR REPLACE FUNCTION auto_pause_campaigns_on_service_disable()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_enabled = TRUE AND NEW.is_enabled = FALSE THEN
    UPDATE affiliate_campaigns
    SET
      status = 'paused',
      auto_paused_at = now(),
      auto_pause_reason = 'Linked service disabled by admin',
      updated_at = now()
    WHERE
      destination_service_template_id = NEW.template_id
      AND diviner_id = NEW.diviner_id
      AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_pause_campaigns ON diviner_services;

CREATE TRIGGER trg_auto_pause_campaigns
  AFTER UPDATE OF is_enabled ON diviner_services
  FOR EACH ROW
  WHEN (OLD.is_enabled = TRUE AND NEW.is_enabled = FALSE)
  EXECUTE FUNCTION auto_pause_campaigns_on_service_disable();

-- ── Step 10: Backfill campaign_code for existing campaigns ────────────────────

-- Note: In the unlikely event of a collision, re-run this statement.
-- The UNIQUE index on campaign_code prevents silent duplicates.
UPDATE affiliate_campaigns
SET campaign_code = generate_campaign_code()
WHERE campaign_code IS NULL;
