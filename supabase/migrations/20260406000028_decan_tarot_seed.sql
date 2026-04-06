-- ============================================================
-- Module 10: Decan-to-Tarot mapping seed
-- Module 11: ms_email_log table for idempotent lifecycle emails
-- ============================================================

-- ── Decan Tarot Seed ─────────────────────────────────────────────────────────
-- Updates the 36 standard decan rows with their canonical tarot card reference.
-- Only updates where tarot_card_ref IS NULL so re-running is safe (idempotent).

UPDATE decans SET tarot_card_ref = 'Two of Wands'      WHERE decan_number = 1  AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Three of Wands'    WHERE decan_number = 2  AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Four of Wands'     WHERE decan_number = 3  AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Five of Pentacles' WHERE decan_number = 4  AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Six of Pentacles'  WHERE decan_number = 5  AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Seven of Pentacles' WHERE decan_number = 6 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Eight of Swords'   WHERE decan_number = 7  AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Nine of Swords'    WHERE decan_number = 8  AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Ten of Swords'     WHERE decan_number = 9  AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Two of Cups'       WHERE decan_number = 10 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Three of Cups'     WHERE decan_number = 11 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Four of Cups'      WHERE decan_number = 12 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Five of Wands'     WHERE decan_number = 13 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Six of Wands'      WHERE decan_number = 14 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Seven of Wands'    WHERE decan_number = 15 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Eight of Pentacles' WHERE decan_number = 16 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Nine of Pentacles' WHERE decan_number = 17 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Ten of Pentacles'  WHERE decan_number = 18 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Two of Swords'     WHERE decan_number = 19 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Three of Swords'   WHERE decan_number = 20 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Four of Swords'    WHERE decan_number = 21 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Five of Cups'      WHERE decan_number = 22 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Six of Cups'       WHERE decan_number = 23 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Seven of Cups'     WHERE decan_number = 24 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Eight of Wands'    WHERE decan_number = 25 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Nine of Wands'     WHERE decan_number = 26 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Ten of Wands'      WHERE decan_number = 27 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Two of Pentacles'  WHERE decan_number = 28 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Three of Pentacles' WHERE decan_number = 29 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Four of Pentacles' WHERE decan_number = 30 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Five of Swords'    WHERE decan_number = 31 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Six of Swords'     WHERE decan_number = 32 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Seven of Swords'   WHERE decan_number = 33 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Eight of Cups'     WHERE decan_number = 34 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Nine of Cups'      WHERE decan_number = 35 AND tarot_card_ref IS NULL;
UPDATE decans SET tarot_card_ref = 'Ten of Cups'       WHERE decan_number = 36 AND tarot_card_ref IS NULL;

-- ── ms_email_log ─────────────────────────────────────────────────────────────
-- Prevents duplicate lifecycle email sends. One row per (student, email_type, decan).
-- The UNIQUE constraint enforces exactly-once delivery at the DB layer.

CREATE TABLE IF NOT EXISTS ms_email_log (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID         NOT NULL,
  email_type   VARCHAR(50)  NOT NULL,
  decan_id     UUID,
  sent_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (student_id, email_type, decan_id)
);

CREATE INDEX IF NOT EXISTS idx_ms_email_log_student ON ms_email_log (student_id);

ALTER TABLE ms_email_log ENABLE ROW LEVEL SECURITY;

-- Service role has full access; no end-user access needed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ms_email_log'
      AND policyname = 'service_role_ms_email_log'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "service_role_ms_email_log"
        ON ms_email_log
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $p$;
  END IF;
END $$;
