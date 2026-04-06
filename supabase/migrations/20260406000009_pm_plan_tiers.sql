-- ============================================================
-- Perennial Mandalism Plan Tiers (admin configurable)
-- build: 2026-04-06
-- ============================================================

CREATE TABLE IF NOT EXISTS pm_plan_tiers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,                          -- "Starter", "Family", "Extended"
  description           TEXT,
  base_price_usd        NUMERIC(10,2) NOT NULL,                 -- flat monthly fee
  base_member_limit     INTEGER NOT NULL DEFAULT 3,             -- members included in base price
  extra_per_member_usd  NUMERIC(10,2) NOT NULL DEFAULT 0,       -- per extra member per month
  max_total_members     INTEGER NOT NULL DEFAULT 10,
  stripe_price_id       TEXT,                                   -- Stripe Price ID for base (recurring)
  stripe_extra_price_id TEXT,                                   -- Stripe Price ID for per-extra-seat
  is_active             BOOLEAN NOT NULL DEFAULT true,
  display_order         INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default tiers
INSERT INTO pm_plan_tiers (name, description, base_price_usd, base_member_limit, extra_per_member_usd, max_total_members, display_order)
VALUES
  ('Individual', 'Perfect for your personal spiritual journey. Includes up to 3 members.', 19.95, 3, 5.00, 10, 1),
  ('Family', 'For the whole family. Includes up to 6 members.', 34.95, 6, 5.00, 15, 2)
ON CONFLICT DO NOTHING;

-- Add tier_id FK to community_members
ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS pm_tier_id UUID REFERENCES pm_plan_tiers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS extra_member_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- RLS
ALTER TABLE pm_plan_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_pm_tiers"  ON pm_plan_tiers FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "service_all_pm_tiers"  ON pm_plan_tiers FOR ALL    TO service_role  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pm_plan_tiers_active  ON pm_plan_tiers(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_community_members_tier ON community_members(pm_tier_id);
