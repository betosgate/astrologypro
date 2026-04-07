-- Affiliates: belong to a diviner
CREATE TABLE IF NOT EXISTS diviner_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID NOT NULL,           -- the diviner who owns this affiliate
  user_id UUID,                        -- if affiliate has a platform account
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended','blocked')),
  notes TEXT,
  -- Commission config (override hierarchy — most specific wins)
  default_commission_type TEXT DEFAULT 'percentage' CHECK (default_commission_type IN ('percentage','fixed')),
  default_commission_value NUMERIC(10,4) DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(diviner_id, email)
);

-- Unique referral links per affiliate (can be product-targeted)
CREATE TABLE IF NOT EXISTS affiliate_referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES diviner_affiliates(id) ON DELETE CASCADE,
  diviner_id UUID NOT NULL,
  product_id UUID,                -- NULL = general link
  product_type TEXT,              -- 'package' | 'session' | 'subscription' | null
  slug TEXT UNIQUE NOT NULL,      -- used in URL: /ref/{slug}
  url TEXT GENERATED ALWAYS AS ('https://astrologypro.com/ref/' || slug) STORED,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aff_links_affiliate ON affiliate_referral_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_aff_links_slug ON affiliate_referral_links(slug);

-- Click tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES affiliate_referral_links(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aff_clicks_link ON affiliate_clicks(link_id, created_at);

-- Commission ledger: one row per commissionable event
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES diviner_affiliates(id) ON DELETE RESTRICT,
  diviner_id UUID NOT NULL,
  link_id UUID REFERENCES affiliate_referral_links(id),
  order_reference TEXT,           -- external order/payment ID
  order_amount_cents INTEGER NOT NULL DEFAULT 0,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage','fixed')),
  commission_rate NUMERIC(10,4) NOT NULL,
  commission_amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','rejected','reversed')),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  notes TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aff_commissions_affiliate ON affiliate_commissions(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_aff_commissions_diviner ON affiliate_commissions(diviner_id, status);

-- Payout records: one payout can cover multiple commissions
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES diviner_affiliates(id) ON DELETE RESTRICT,
  diviner_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  method TEXT,                    -- bank/paypal/cash/other
  reference TEXT,                 -- payment reference
  proof_url TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aff_payouts_affiliate ON affiliate_payouts(affiliate_id, paid_at);

-- Commission-payout link table
CREATE TABLE IF NOT EXISTS affiliate_payout_items (
  payout_id UUID NOT NULL REFERENCES affiliate_payouts(id) ON DELETE CASCADE,
  commission_id UUID NOT NULL REFERENCES affiliate_commissions(id),
  PRIMARY KEY (payout_id, commission_id)
);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION aff_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_aff_updated ON diviner_affiliates;
CREATE TRIGGER trg_aff_updated BEFORE UPDATE ON diviner_affiliates FOR EACH ROW EXECUTE FUNCTION aff_updated_at();
DROP TRIGGER IF EXISTS trg_comm_updated ON affiliate_commissions;
CREATE TRIGGER trg_comm_updated BEFORE UPDATE ON affiliate_commissions FOR EACH ROW EXECUTE FUNCTION aff_updated_at();

-- RLS
ALTER TABLE diviner_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payout_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: service_role bypasses all (used by admin client)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='diviner_affiliates' AND policyname='svc_diviner_affiliates') THEN
    EXECUTE $p$ CREATE POLICY "svc_diviner_affiliates" ON diviner_affiliates FOR ALL TO service_role USING (true) $p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_referral_links' AND policyname='svc_aff_links') THEN
    EXECUTE $p$ CREATE POLICY "svc_aff_links" ON affiliate_referral_links FOR ALL TO service_role USING (true) $p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_commissions' AND policyname='svc_aff_commissions') THEN
    EXECUTE $p$ CREATE POLICY "svc_aff_commissions" ON affiliate_commissions FOR ALL TO service_role USING (true) $p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_payouts' AND policyname='svc_aff_payouts') THEN
    EXECUTE $p$ CREATE POLICY "svc_aff_payouts" ON affiliate_payouts FOR ALL TO service_role USING (true) $p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_clicks' AND policyname='svc_aff_clicks') THEN
    EXECUTE $p$ CREATE POLICY "svc_aff_clicks" ON affiliate_clicks FOR ALL TO service_role USING (true) $p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_payout_items' AND policyname='svc_aff_payout_items') THEN
    EXECUTE $p$ CREATE POLICY "svc_aff_payout_items" ON affiliate_payout_items FOR ALL TO service_role USING (true) $p$;
  END IF;
END $$;

-- Diviners can read their own affiliates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='diviner_affiliates' AND policyname='diviner_own_affiliates') THEN
    EXECUTE $p$ CREATE POLICY "diviner_own_affiliates" ON diviner_affiliates FOR SELECT USING (auth.uid() = diviner_id) $p$;
  END IF;
END $$;

-- Diviners can read their own commissions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_commissions' AND policyname='diviner_own_commissions') THEN
    EXECUTE $p$ CREATE POLICY "diviner_own_commissions" ON affiliate_commissions FOR SELECT USING (auth.uid() = diviner_id) $p$;
  END IF;
END $$;

-- Diviners can read their own payouts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_payouts' AND policyname='diviner_own_payouts') THEN
    EXECUTE $p$ CREATE POLICY "diviner_own_payouts" ON affiliate_payouts FOR SELECT USING (auth.uid() = diviner_id) $p$;
  END IF;
END $$;
