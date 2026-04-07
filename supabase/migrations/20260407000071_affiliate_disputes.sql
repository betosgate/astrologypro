-- Migration: affiliate_commission_disputes
-- Allows affiliates to raise disputes on individual commission records.

CREATE TABLE IF NOT EXISTS affiliate_commission_disputes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id   UUID        NOT NULL REFERENCES affiliate_commissions(id) ON DELETE CASCADE,
  affiliate_id    UUID        NOT NULL REFERENCES diviner_affiliates(id),
  raised_by       UUID        NOT NULL REFERENCES auth.users(id),
  status          TEXT        NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open','under_review','resolved','rejected')),
  reason          TEXT        NOT NULL,
  resolution_notes TEXT,
  resolved_by     UUID        REFERENCES auth.users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE affiliate_commission_disputes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'affiliate_commission_disputes'
      AND policyname = 'affiliates_own_disputes'
  ) THEN
    CREATE POLICY "affiliates_own_disputes"
      ON affiliate_commission_disputes
      FOR ALL
      USING (raised_by = auth.uid());
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_affiliate_disputes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_affiliate_disputes_updated_at ON affiliate_commission_disputes;
CREATE TRIGGER trg_affiliate_disputes_updated_at
  BEFORE UPDATE ON affiliate_commission_disputes
  FOR EACH ROW EXECUTE FUNCTION update_affiliate_disputes_updated_at();
