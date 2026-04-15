CREATE TABLE IF NOT EXISTS diviner_finance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  monthly_revenue_goal_cents INTEGER NOT NULL DEFAULT 500000,
  tax_reserve_percent DECIMAL(5,2) NOT NULL DEFAULT 25.00,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(diviner_id)
);

ALTER TABLE diviner_finance_goals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diviner_finance_goals'
      AND policyname = 'fg_diviner'
  ) THEN
    CREATE POLICY "fg_diviner" ON diviner_finance_goals FOR ALL
      USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'diviner_finance_goals'
      AND policyname = 'fg_service_role'
  ) THEN
    CREATE POLICY "fg_service_role" ON diviner_finance_goals FOR ALL TO service_role USING (true);
  END IF;
END $$;
