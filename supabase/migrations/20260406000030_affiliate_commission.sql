-- Commission rules: % or fixed amount per diviner
CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('percentage', 'fixed')),
  rate numeric(10,4) NOT NULL, -- percentage (0-100) or fixed amount in cents
  currency text NOT NULL DEFAULT 'usd',
  applies_to text NOT NULL DEFAULT 'all', -- 'all', 'booking', 'subscription'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Commission ledger: immutable finance-style entries
CREATE TABLE IF NOT EXISTS commission_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_user_id uuid NOT NULL REFERENCES auth.users(id),
  affiliate_user_id uuid NOT NULL REFERENCES auth.users(id),
  booking_id uuid REFERENCES bookings(id),
  order_amount_cents bigint NOT NULL,
  commission_amount_cents bigint NOT NULL,
  commission_rule_id uuid REFERENCES commission_rules(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','payable','paid','rejected','reversed')),
  description text,
  period_start date,
  period_end date,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payout records: diviner records external payouts to affiliates
CREATE TABLE IF NOT EXISTS affiliate_payout_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_user_id uuid NOT NULL REFERENCES auth.users(id),
  affiliate_user_id uuid NOT NULL REFERENCES auth.users(id),
  amount_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  payout_method text, -- 'paypal', 'bank_transfer', 'check', 'cash', 'other'
  reference_number text,
  notes text,
  status text NOT NULL DEFAULT 'recorded' CHECK (status IN ('draft','recorded','verified','failed','reversed','cancelled')),
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Link ledger entries to payouts (many-to-many)
CREATE TABLE IF NOT EXISTS affiliate_payout_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_record_id uuid NOT NULL REFERENCES affiliate_payout_records(id) ON DELETE CASCADE,
  ledger_entry_id uuid NOT NULL REFERENCES commission_ledger_entries(id),
  amount_cents bigint NOT NULL,
  UNIQUE(payout_record_id, ledger_entry_id)
);

-- Audit log for commission actions
CREATE TABLE IF NOT EXISTS affiliate_commission_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX ON commission_ledger_entries(diviner_user_id, status, created_at DESC);
CREATE INDEX ON commission_ledger_entries(affiliate_user_id, status, created_at DESC);
CREATE INDEX ON affiliate_payout_records(diviner_user_id, created_at DESC);
CREATE INDEX ON affiliate_payout_records(affiliate_user_id, created_at DESC);

-- RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payout_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payout_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commission_audit ENABLE ROW LEVEL SECURITY;

-- Diviners see their own commission rules
CREATE POLICY "diviner_own_rules" ON commission_rules FOR ALL USING (auth.uid() = diviner_user_id);
CREATE POLICY "service_role_rules" ON commission_rules FOR ALL TO service_role USING (true);

-- Diviner sees ledger entries they own; affiliate sees their own
CREATE POLICY "diviner_ledger" ON commission_ledger_entries FOR SELECT USING (auth.uid() = diviner_user_id);
CREATE POLICY "affiliate_ledger" ON commission_ledger_entries FOR SELECT USING (auth.uid() = affiliate_user_id);
CREATE POLICY "service_role_ledger" ON commission_ledger_entries FOR ALL TO service_role USING (true);

-- Diviner manages payouts
CREATE POLICY "diviner_payouts" ON affiliate_payout_records FOR ALL USING (auth.uid() = diviner_user_id);
CREATE POLICY "affiliate_view_payouts" ON affiliate_payout_records FOR SELECT USING (auth.uid() = affiliate_user_id);
CREATE POLICY "service_role_payouts" ON affiliate_payout_records FOR ALL TO service_role USING (true);

-- Payout allocations inherit from payout records
CREATE POLICY "service_role_allocations" ON affiliate_payout_allocations FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_audit" ON affiliate_commission_audit FOR ALL TO service_role USING (true);
