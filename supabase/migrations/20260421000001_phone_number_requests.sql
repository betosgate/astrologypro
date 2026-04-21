-- ═══════════════════════════════════════════════════════════════════
-- Migration: 20260421000001_phone_number_requests
-- Purpose: Add Chime phone number pool + diviner-initiated phone number
--          requests so diviners can request a number from admin and
--          admin can assign one from the pool.
--
-- Additive only — no columns dropped. Backward-compatible with existing
-- diviners.chime_phone_number usage.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. chime_phone_numbers (the pool) ───────────────────────────────
CREATE TABLE IF NOT EXISTS chime_phone_numbers (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number          VARCHAR(20) NOT NULL UNIQUE,
  phone_arn             TEXT,                    -- AWS Chime SMA ARN (optional; may be filled by admin)
  status                VARCHAR(20) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'assigned')),
  assigned_diviner_id   UUID        REFERENCES diviners(id) ON DELETE SET NULL,
  assigned_at           TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A pool row cannot claim assignment without a diviner and vice versa.
  CONSTRAINT chk_chime_phone_numbers_assignment_consistent
    CHECK (
      (status = 'assigned' AND assigned_diviner_id IS NOT NULL AND assigned_at IS NOT NULL)
      OR
      (status = 'available' AND assigned_diviner_id IS NULL AND assigned_at IS NULL)
    )
);

-- One diviner can only hold at most one pool row at a time.
CREATE UNIQUE INDEX IF NOT EXISTS ux_chime_phone_numbers_one_per_diviner
  ON chime_phone_numbers (assigned_diviner_id)
  WHERE assigned_diviner_id IS NOT NULL;

-- Fast admin dropdown: list available numbers.
CREATE INDEX IF NOT EXISTS idx_chime_phone_numbers_status
  ON chime_phone_numbers (status);


-- ─── 2. phone_number_requests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phone_number_requests (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id                 UUID        NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  status                     VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'assigned', 'rejected')),
  assigned_phone_number_id   UUID        REFERENCES chime_phone_numbers(id) ON DELETE SET NULL,
  assigned_by_admin_id       UUID        REFERENCES admin_users(id)         ON DELETE SET NULL,
  assigned_at                TIMESTAMPTZ,
  rejected_at                TIMESTAMPTZ,
  rejected_reason            TEXT,
  note                       TEXT,       -- optional note from diviner when requesting
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_phone_number_requests_assignment
    CHECK (
      (status = 'assigned' AND assigned_phone_number_id IS NOT NULL AND assigned_at IS NOT NULL)
      OR
      (status <> 'assigned')
    ),
  CONSTRAINT chk_phone_number_requests_rejection
    CHECK (
      (status = 'rejected' AND rejected_at IS NOT NULL)
      OR
      (status <> 'rejected')
    )
);

-- Hard guarantee: a diviner can have at most ONE pending request at a time.
CREATE UNIQUE INDEX IF NOT EXISTS ux_phone_number_requests_one_pending_per_diviner
  ON phone_number_requests (diviner_id)
  WHERE status = 'pending';

-- Common admin list query: pending first, then by age.
CREATE INDEX IF NOT EXISTS idx_phone_number_requests_status_created
  ON phone_number_requests (status, created_at DESC);

-- Lookup by diviner (used by Phone tab "my status" query).
CREATE INDEX IF NOT EXISTS idx_phone_number_requests_diviner
  ON phone_number_requests (diviner_id, created_at DESC);


-- ─── 3. updated_at triggers ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chime_phone_numbers_updated_at ON chime_phone_numbers;
CREATE TRIGGER trg_chime_phone_numbers_updated_at
  BEFORE UPDATE ON chime_phone_numbers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_phone_number_requests_updated_at ON phone_number_requests;
CREATE TRIGGER trg_phone_number_requests_updated_at
  BEFORE UPDATE ON phone_number_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();


-- ─── 4. Backfill: seed pool from existing diviners.chime_phone_number ─
-- For every diviner who already has a Chime number assigned directly on
-- the diviners row, insert a pool row marked as 'assigned' so the pool
-- becomes the single source of truth. ON CONFLICT: if a number somehow
-- already exists in the pool, leave it alone.
INSERT INTO chime_phone_numbers (phone_number, phone_arn, status, assigned_diviner_id, assigned_at, notes)
SELECT
  d.chime_phone_number,
  d.chime_sma_phone_arn,
  'assigned',
  d.id,
  COALESCE(d.updated_at, now()),
  'Backfilled from diviners.chime_phone_number on 2026-04-21'
FROM diviners d
WHERE d.chime_phone_number IS NOT NULL
  AND d.chime_phone_number <> ''
ON CONFLICT (phone_number) DO NOTHING;


-- ─── 5. RLS policies ─────────────────────────────────────────────────
ALTER TABLE chime_phone_numbers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_number_requests   ENABLE ROW LEVEL SECURITY;

-- chime_phone_numbers: admin full access; diviner can read ONLY their own
-- assigned row (so the diviner UI can show the number that was assigned
-- to them — nothing else).
DROP POLICY IF EXISTS chime_phone_numbers_admin_all ON chime_phone_numbers;
CREATE POLICY chime_phone_numbers_admin_all ON chime_phone_numbers
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS chime_phone_numbers_diviner_read_own ON chime_phone_numbers;
CREATE POLICY chime_phone_numbers_diviner_read_own ON chime_phone_numbers
  FOR SELECT
  USING (
    assigned_diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  );

-- phone_number_requests: admin full access.
DROP POLICY IF EXISTS phone_number_requests_admin_all ON phone_number_requests;
CREATE POLICY phone_number_requests_admin_all ON phone_number_requests
  FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- phone_number_requests: diviner can read their own rows.
DROP POLICY IF EXISTS phone_number_requests_diviner_read ON phone_number_requests;
CREATE POLICY phone_number_requests_diviner_read ON phone_number_requests
  FOR SELECT
  USING (
    diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
  );

-- phone_number_requests: diviner can insert a row for themselves as
-- 'pending' only. All status transitions are admin-only. The partial
-- unique index ux_phone_number_requests_one_pending_per_diviner enforces
-- one-open-request-per-diviner at the DB level in addition to API checks.
DROP POLICY IF EXISTS phone_number_requests_diviner_insert ON phone_number_requests;
CREATE POLICY phone_number_requests_diviner_insert ON phone_number_requests
  FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND assigned_phone_number_id IS NULL
    AND assigned_by_admin_id IS NULL
    AND assigned_at IS NULL
    AND rejected_at IS NULL
    AND diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
  );


-- ─── 6. Comments for future maintainers ──────────────────────────────
COMMENT ON TABLE  chime_phone_numbers                     IS 'Pool of AWS Chime phone numbers. Source of truth for which numbers exist and who they are assigned to.';
COMMENT ON COLUMN chime_phone_numbers.status              IS 'available = free for admin to assign; assigned = currently held by a diviner';
COMMENT ON TABLE  phone_number_requests                   IS 'Diviner-initiated requests for a dedicated Chime number. Admin assigns from chime_phone_numbers pool.';
COMMENT ON COLUMN phone_number_requests.status            IS 'pending → assigned | rejected. Only one pending row per diviner (enforced by partial unique index).';
