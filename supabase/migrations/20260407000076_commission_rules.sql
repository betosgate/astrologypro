-- Commission rules: configurable hierarchy (system → diviner → affiliate → product-specific → order override)
CREATE TABLE IF NOT EXISTS affiliate_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID,              -- NULL = system default
  affiliate_id UUID REFERENCES diviner_affiliates(id) ON DELETE CASCADE,
  product_id UUID,              -- NULL = all products
  product_type TEXT,            -- 'package' | 'session' | 'subscription' | NULL
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage','fixed')),
  commission_value NUMERIC(10,4) NOT NULL DEFAULT 0,
  min_order_amount_cents INTEGER DEFAULT 0,
  max_commission_cents INTEGER,     -- cap per commission
  currency TEXT NOT NULL DEFAULT 'USD',
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 0, -- higher = wins
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_acr_affiliate ON affiliate_commission_rules(affiliate_id, is_active);
CREATE INDEX IF NOT EXISTS idx_acr_diviner ON affiliate_commission_rules(diviner_id, is_active);

-- Commission status history (every commission status change)
CREATE TABLE IF NOT EXISTS affiliate_commission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES affiliate_commissions(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ach_commission ON affiliate_commission_history(commission_id, created_at);

-- Commission adjustments (debit/credit notes)
CREATE TABLE IF NOT EXISTS affiliate_commission_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES affiliate_commissions(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES diviner_affiliates(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('credit','debit','reversal','refund_recalc')),
  amount_cents INTEGER NOT NULL, -- positive = credit to affiliate, negative = debit
  reason TEXT NOT NULL,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add refund fields to commissions
ALTER TABLE affiliate_commissions ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE affiliate_commissions ADD COLUMN IF NOT EXISTS refund_amount_cents INTEGER DEFAULT 0;

-- RLS
ALTER TABLE affiliate_commission_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='affiliate_commission_rules' AND policyname='acr_readable') THEN
    CREATE POLICY "acr_readable" ON affiliate_commission_rules FOR SELECT USING (TRUE);
  END IF;
END $$;
ALTER TABLE affiliate_commission_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='affiliate_commission_history' AND policyname='ach_readable') THEN
    CREATE POLICY "ach_readable" ON affiliate_commission_history FOR SELECT USING (TRUE);
  END IF;
END $$;
ALTER TABLE affiliate_commission_adjustments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='affiliate_commission_adjustments' AND policyname='aca_readable') THEN
    CREATE POLICY "aca_readable" ON affiliate_commission_adjustments FOR SELECT USING (TRUE);
  END IF;
END $$;

-- updated_at trigger for commission_rules
CREATE OR REPLACE FUNCTION update_acr_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_acr_updated_at ON affiliate_commission_rules;
CREATE TRIGGER trg_acr_updated_at BEFORE UPDATE ON affiliate_commission_rules FOR EACH ROW EXECUTE FUNCTION update_acr_updated_at();
