-- ============================================================
-- E5-S3 Decan System
-- ============================================================

-- 36 Decans reference table (admin-managed, seeded below)
CREATE TABLE IF NOT EXISTS decans (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  decan_number  INTEGER NOT NULL UNIQUE CHECK (decan_number BETWEEN 1 AND 36),
  sign          TEXT    NOT NULL,
  planet        TEXT    NOT NULL,   -- traditional ruling planet
  title         TEXT    NOT NULL,   -- human label, e.g. "Aries I"
  start_month   INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  start_day     INTEGER NOT NULL CHECK (start_day BETWEEN 1 AND 31),
  end_month     INTEGER NOT NULL CHECK (end_month BETWEEN 1 AND 12),
  end_day       INTEGER NOT NULL CHECK (end_day BETWEEN 1 AND 31),
  description   TEXT,               -- Beto fills in thematic meaning
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE decans ENABLE ROW LEVEL SECURITY;

-- Students and admins can read decans
CREATE POLICY "authenticated users read decans"
  ON decans FOR SELECT TO authenticated USING (true);

CREATE POLICY "service role full access decans"
  ON decans FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Student progress per decan
CREATE TABLE IF NOT EXISTS student_decan_progress (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID    NOT NULL REFERENCES mystery_school_students (id) ON DELETE CASCADE,
  decan_id      UUID    NOT NULL REFERENCES decans (id) ON DELETE CASCADE,
  status        TEXT    NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'upcoming', 'active', 'completed', 'missed')),
  ritual_done   BOOLEAN NOT NULL DEFAULT false,
  scry_done     BOOLEAN NOT NULL DEFAULT false,
  journal_done  BOOLEAN NOT NULL DEFAULT false,
  unlocked_at   TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  missed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, decan_id)
);

ALTER TABLE student_decan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own decan progress"
  ON student_decan_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mystery_school_students mss
      WHERE mss.id = student_id AND mss.user_id = auth.uid()
    )
  );

CREATE POLICY "student updates own decan progress"
  ON student_decan_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mystery_school_students mss
      WHERE mss.id = student_id AND mss.user_id = auth.uid()
    )
  );

CREATE POLICY "service role full access decan progress"
  ON student_decan_progress FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_student_decan_progress_student ON student_decan_progress (student_id);
CREATE INDEX idx_student_decan_progress_status ON student_decan_progress (status);

-- ============================================================
-- E5-S4 Ritual performer
-- ============================================================

CREATE TABLE IF NOT EXISTS decan_rituals (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  decan_id    UUID    NOT NULL REFERENCES decans (id) ON DELETE CASCADE,
  step_order  INTEGER NOT NULL,
  step_type   TEXT    NOT NULL DEFAULT 'instruction'
    CHECK (step_type IN ('invocation', 'gate', 'instruction', 'affirmation', 'closing')),
  content     TEXT    NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (decan_id, step_order)
);

ALTER TABLE decan_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students read decan rituals"
  ON decan_rituals FOR SELECT TO authenticated USING (true);

CREATE POLICY "service role full access decan rituals"
  ON decan_rituals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- E5-S5 Journaling
-- ============================================================

CREATE TABLE IF NOT EXISTS scry_journals (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID    NOT NULL REFERENCES mystery_school_students (id) ON DELETE CASCADE,
  decan_id     UUID    NOT NULL REFERENCES decans (id) ON DELETE CASCADE,
  content      TEXT    NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, decan_id)  -- one entry per decan
);

ALTER TABLE scry_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own scry journals"
  ON scry_journals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM mystery_school_students mss WHERE mss.id = student_id AND mss.user_id = auth.uid())
  );

CREATE POLICY "student inserts own scry journal"
  ON scry_journals FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM mystery_school_students mss WHERE mss.id = student_id AND mss.user_id = auth.uid())
  );

CREATE POLICY "service role full access scry journals"
  ON scry_journals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS mundane_journals (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID    NOT NULL REFERENCES mystery_school_students (id) ON DELETE CASCADE,
  decan_id     UUID    NOT NULL REFERENCES decans (id) ON DELETE CASCADE,
  content      TEXT    NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, decan_id)  -- one entry per decan
);

ALTER TABLE mundane_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own mundane journals"
  ON mundane_journals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM mystery_school_students mss WHERE mss.id = student_id AND mss.user_id = auth.uid())
  );

CREATE POLICY "student inserts own mundane journal"
  ON mundane_journals FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM mystery_school_students mss WHERE mss.id = student_id AND mss.user_id = auth.uid())
  );

CREATE POLICY "service role full access mundane journals"
  ON mundane_journals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- Seed: 36 Decans
-- ============================================================
INSERT INTO decans (decan_number, sign, planet, title, start_month, start_day, end_month, end_day) VALUES
  (1,  'Aries',       'Mars',    'Aries I',        3,  21, 3,  30),
  (2,  'Aries',       'Sun',     'Aries II',       3,  31, 4,  9),
  (3,  'Aries',       'Venus',   'Aries III',      4,  10, 4,  19),
  (4,  'Taurus',      'Mercury', 'Taurus I',       4,  20, 4,  29),
  (5,  'Taurus',      'Moon',    'Taurus II',      4,  30, 5,  9),
  (6,  'Taurus',      'Saturn',  'Taurus III',     5,  10, 5,  19),
  (7,  'Gemini',      'Jupiter', 'Gemini I',       5,  20, 5,  29),
  (8,  'Gemini',      'Mars',    'Gemini II',      5,  30, 6,  8),
  (9,  'Gemini',      'Sun',     'Gemini III',     6,  9,  6,  20),
  (10, 'Cancer',      'Venus',   'Cancer I',       6,  21, 7,  1),
  (11, 'Cancer',      'Mercury', 'Cancer II',      7,  2,  7,  11),
  (12, 'Cancer',      'Moon',    'Cancer III',     7,  12, 7,  22),
  (13, 'Leo',         'Saturn',  'Leo I',          7,  23, 8,  1),
  (14, 'Leo',         'Jupiter', 'Leo II',         8,  2,  8,  11),
  (15, 'Leo',         'Mars',    'Leo III',        8,  12, 8,  22),
  (16, 'Virgo',       'Sun',     'Virgo I',        8,  23, 9,  1),
  (17, 'Virgo',       'Venus',   'Virgo II',       9,  2,  9,  11),
  (18, 'Virgo',       'Mercury', 'Virgo III',      9,  12, 9,  22),
  (19, 'Libra',       'Moon',    'Libra I',        9,  23, 10, 2),
  (20, 'Libra',       'Saturn',  'Libra II',       10, 3,  10, 12),
  (21, 'Libra',       'Jupiter', 'Libra III',      10, 13, 10, 22),
  (22, 'Scorpio',     'Mars',    'Scorpio I',      10, 23, 11, 1),
  (23, 'Scorpio',     'Sun',     'Scorpio II',     11, 2,  11, 11),
  (24, 'Scorpio',     'Venus',   'Scorpio III',    11, 12, 11, 21),
  (25, 'Sagittarius', 'Mercury', 'Sagittarius I',  11, 22, 12, 1),
  (26, 'Sagittarius', 'Moon',    'Sagittarius II', 12, 2,  12, 11),
  (27, 'Sagittarius', 'Saturn',  'Sagittarius III',12, 12, 12, 21),
  (28, 'Capricorn',   'Jupiter', 'Capricorn I',    12, 22, 12, 31),
  (29, 'Capricorn',   'Mars',    'Capricorn II',   1,  1,  1,  9),
  (30, 'Capricorn',   'Sun',     'Capricorn III',  1,  10, 1,  19),
  (31, 'Aquarius',    'Venus',   'Aquarius I',     1,  20, 1,  29),
  (32, 'Aquarius',    'Mercury', 'Aquarius II',    1,  30, 2,  8),
  (33, 'Aquarius',    'Moon',    'Aquarius III',   2,  9,  2,  18),
  (34, 'Pisces',      'Saturn',  'Pisces I',       2,  19, 2,  28),
  (35, 'Pisces',      'Jupiter', 'Pisces II',      3,  1,  3,  10),
  (36, 'Pisces',      'Mars',    'Pisces III',     3,  11, 3,  20)
ON CONFLICT (decan_number) DO NOTHING;
