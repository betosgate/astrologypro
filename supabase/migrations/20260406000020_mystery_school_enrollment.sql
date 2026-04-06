-- Extend mystery_school_students to act as the authoritative enrollment record.
-- These columns support the full enrollment lifecycle: seasonal entry, subscription
-- tracking, status, pause/resume/cancel, and progress milestones.
-- Migration is additive — all new columns use IF NOT EXISTS or have safe defaults.

ALTER TABLE mystery_school_students
  ADD COLUMN IF NOT EXISTS entry_quarter       VARCHAR(20),  -- 'spring'|'summer'|'autumn'|'winter'
  ADD COLUMN IF NOT EXISTS entry_year          INTEGER,
  ADD COLUMN IF NOT EXISTS enrollment_date     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS one_time_fee_paid   BOOLEAN    NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS one_time_fee_amount NUMERIC(10,2)       DEFAULT 97.00,
  ADD COLUMN IF NOT EXISTS status              VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS paused_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS quarters_completed  INTEGER    NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_quarters     INTEGER    NOT NULL DEFAULT 5;

-- Constrain the status enum at the DB level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mystery_school_students_status_check'
  ) THEN
    ALTER TABLE mystery_school_students
      ADD CONSTRAINT mystery_school_students_status_check
      CHECK (status IN ('active', 'paused', 'cancelled', 'expired'));
  END IF;
END $$;

-- Constrain the entry_quarter enum at the DB level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mystery_school_students_entry_quarter_check'
  ) THEN
    ALTER TABLE mystery_school_students
      ADD CONSTRAINT mystery_school_students_entry_quarter_check
      CHECK (entry_quarter IN ('spring', 'summer', 'autumn', 'winter'));
  END IF;
END $$;

-- Index to look up a student by their Stripe subscription (webhook needs this)
CREATE INDEX IF NOT EXISTS idx_mss_stripe_subscription_id
  ON mystery_school_students (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Index to query by status (admin dashboards, access guard)
CREATE INDEX IF NOT EXISTS idx_mss_status
  ON mystery_school_students (status);

-- Index by entry quarter + year for cohort reporting
CREATE INDEX IF NOT EXISTS idx_mss_entry_cohort
  ON mystery_school_students (entry_quarter, entry_year)
  WHERE entry_quarter IS NOT NULL;
