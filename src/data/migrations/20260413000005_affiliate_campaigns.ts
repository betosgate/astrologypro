// AUTO-GENERATED bundled mirror of supabase/migrations/20260413000005_affiliate_campaigns.sql
// Used by /api/admin/db/migrate so the deployed function does not need fs.

export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS affiliate_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','expired')),
  start_date DATE NOT NULL,
  end_date DATE,
  commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage','fixed')),
  commission_value NUMERIC(10,4) DEFAULT 0,
  budget_cap_cents INTEGER,
  spent_cents INTEGER DEFAULT 0,
  target_product_type TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES affiliate_campaigns(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL,
  affiliate_type TEXT NOT NULL CHECK (affiliate_type IN ('diviner_affiliate','social_advocate')),
  custom_commission_value NUMERIC(10,4),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, affiliate_id, affiliate_type)
);

CREATE TABLE IF NOT EXISTS campaign_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES affiliate_campaigns(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL,
  affiliate_type TEXT NOT NULL,
  order_reference TEXT,
  order_amount_cents INTEGER DEFAULT 0,
  commission_amount_cents INTEGER DEFAULT 0,
  converted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_diviner ON affiliate_campaigns(diviner_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON affiliate_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_affiliates_campaign ON campaign_affiliates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_conversions_campaign ON campaign_conversions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_conversions_affiliate ON campaign_conversions(campaign_id, affiliate_id);

ALTER TABLE affiliate_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diviners_read_own_campaigns" ON affiliate_campaigns
  FOR SELECT USING (
    diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
    OR diviner_id IS NULL
  );

CREATE POLICY "diviners_insert_own_campaigns" ON affiliate_campaigns
  FOR INSERT WITH CHECK (
    diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "diviners_update_own_campaigns" ON affiliate_campaigns
  FOR UPDATE USING (
    diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "diviners_delete_own_draft_campaigns" ON affiliate_campaigns
  FOR DELETE USING (
    status = 'draft' AND
    diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "read_campaign_affiliates" ON campaign_affiliates
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM affiliate_campaigns
      WHERE diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
         OR diviner_id IS NULL
    )
  );

CREATE POLICY "manage_campaign_affiliates" ON campaign_affiliates
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM affiliate_campaigns
      WHERE diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "read_campaign_conversions" ON campaign_conversions
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM affiliate_campaigns
      WHERE diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
         OR diviner_id IS NULL
    )
  );
`;
