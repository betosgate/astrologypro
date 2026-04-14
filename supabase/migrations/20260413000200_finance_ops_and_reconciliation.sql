ALTER TABLE public.revenue_ledger_entries
  ADD COLUMN IF NOT EXISTS settlement_status text NOT NULL DEFAULT 'approved'
    CHECK (settlement_status IN ('pending', 'approved', 'held', 'paid', 'reversed', 'disputed')),
  ADD COLUMN IF NOT EXISTS settlement_note text,
  ADD COLUMN IF NOT EXISTS settlement_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS settled_at timestamptz,
  ADD COLUMN IF NOT EXISTS settled_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS refunded_gross_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_platform_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_affiliate_commission_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_diviner_net_amount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_refund_at timestamptz;

CREATE INDEX IF NOT EXISTS revenue_ledger_settlement_status_idx
  ON public.revenue_ledger_entries(settlement_status, recognized_at DESC);

CREATE TABLE IF NOT EXISTS public.finance_operation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_ledger_entry_id uuid REFERENCES public.revenue_ledger_entries(id) ON DELETE CASCADE,
  diviner_id uuid REFERENCES public.diviners(id) ON DELETE SET NULL,
  order_reference text,
  note_type text NOT NULL DEFAULT 'general'
    CHECK (note_type IN ('payout_hold', 'refund_investigation', 'manual_adjustment', 'affiliate_dispute', 'general')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved')),
  note text NOT NULL,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS finance_operation_notes_ledger_idx
  ON public.finance_operation_notes(revenue_ledger_entry_id, created_at DESC);

CREATE INDEX IF NOT EXISTS finance_operation_notes_diviner_idx
  ON public.finance_operation_notes(diviner_id, created_at DESC);

ALTER TABLE public.finance_operation_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_operation_notes'
      AND policyname = 'service_role_all_finance_operation_notes'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_all_finance_operation_notes"
      ON public.finance_operation_notes
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role')
    $policy$;
  END IF;
END $$;

ALTER TABLE public.refund_events
  ADD COLUMN IF NOT EXISTS revenue_ledger_entry_id uuid REFERENCES public.revenue_ledger_entries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS refund_events_revenue_ledger_idx
  ON public.refund_events(revenue_ledger_entry_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_finance_operation_notes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_finance_operation_notes_updated_at ON public.finance_operation_notes;
CREATE TRIGGER trg_finance_operation_notes_updated_at
BEFORE UPDATE ON public.finance_operation_notes
FOR EACH ROW
EXECUTE FUNCTION public.touch_finance_operation_notes_updated_at();
