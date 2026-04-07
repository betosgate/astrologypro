-- Gap closure: affiliate_commission_disputes, affiliate_commission_history
-- Required by /api/admin/commissions/[commissionId] (history) and
-- /api/admin/affiliates/[id]/disputes (disputes)

-- Commission history: tracks every status transition on affiliate_commissions
CREATE TABLE IF NOT EXISTS affiliate_commission_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id UUID NOT NULL REFERENCES affiliate_commissions(id) ON DELETE CASCADE,
  old_status  TEXT NOT NULL,
  new_status  TEXT NOT NULL,
  changed_by  UUID REFERENCES auth.users(id),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aff_comm_history_commission ON affiliate_commission_history(commission_id, created_at);

-- Disputes table: affiliates/admins can raise disputes on commissions
CREATE TABLE IF NOT EXISTS affiliate_commission_disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id    UUID REFERENCES affiliate_commissions(id) ON DELETE SET NULL,
  affiliate_id     UUID NOT NULL REFERENCES diviner_affiliates(id) ON DELETE CASCADE,
  raised_by        UUID REFERENCES auth.users(id),
  status           TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','under_review','resolved','dismissed')),
  reason           TEXT NOT NULL,
  resolution_notes TEXT,
  resolved_by      UUID REFERENCES auth.users(id),
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aff_disputes_affiliate ON affiliate_commission_disputes(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_aff_disputes_commission ON affiliate_commission_disputes(commission_id);

-- updated_at trigger for disputes
DROP TRIGGER IF EXISTS trg_aff_disputes_updated ON affiliate_commission_disputes;
CREATE TRIGGER trg_aff_disputes_updated
  BEFORE UPDATE ON affiliate_commission_disputes
  FOR EACH ROW EXECUTE FUNCTION aff_updated_at();

-- RLS
ALTER TABLE affiliate_commission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commission_disputes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'affiliate_commission_history'
      AND policyname = 'svc_aff_comm_history'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "svc_aff_comm_history"
        ON affiliate_commission_history FOR ALL TO service_role USING (true)
    $p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'affiliate_commission_disputes'
      AND policyname = 'svc_aff_disputes'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "svc_aff_disputes"
        ON affiliate_commission_disputes FOR ALL TO service_role USING (true)
    $p$;
  END IF;
END $$;
