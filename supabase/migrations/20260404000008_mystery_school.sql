-- Mystery School students (enrollment detail, separate from community_members)
CREATE TABLE IF NOT EXISTS mystery_school_students (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  community_member_id UUID   REFERENCES community_members (id) ON DELETE SET NULL,
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  start_quarter  TEXT        NOT NULL DEFAULT 'next'
    CHECK (start_quarter IN ('spring', 'summer', 'autumn', 'winter', 'next')),
  training_status TEXT       NOT NULL DEFAULT 'foundation'
    CHECK (training_status IN ('foundation', 'decans', 'graduated')),
  graduated_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE mystery_school_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own record"
  ON mystery_school_students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service role full access mystery students"
  ON mystery_school_students FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Foundation 12-week content (admin-managed)
CREATE TABLE IF NOT EXISTS mystery_school_foundation_weeks (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number  INTEGER NOT NULL UNIQUE CHECK (week_number BETWEEN 1 AND 12),
  title        TEXT    NOT NULL,
  content      TEXT,            -- Reading / instruction text (markdown)
  audio_url    TEXT,            -- Beto's audio introduction
  beto_photo_url TEXT,          -- Photo shown next to audio player
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mystery_school_foundation_weeks ENABLE ROW LEVEL SECURITY;

-- Active mystery school students can read published weeks
CREATE POLICY "mystery school students read weeks"
  ON mystery_school_foundation_weeks FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.membership_type = 'mystery_school'
        AND cm.membership_status = 'active'
    )
  );

CREATE POLICY "service role full access foundation weeks"
  ON mystery_school_foundation_weeks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Student progress per week
CREATE TABLE IF NOT EXISTS student_foundation_progress (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID    NOT NULL REFERENCES mystery_school_students (id) ON DELETE CASCADE,
  week_number  INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, week_number)
);

ALTER TABLE student_foundation_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own foundation progress"
  ON student_foundation_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mystery_school_students mss
      WHERE mss.id = student_id AND mss.user_id = auth.uid()
    )
  );

CREATE POLICY "student inserts own foundation progress"
  ON student_foundation_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mystery_school_students mss
      WHERE mss.id = student_id AND mss.user_id = auth.uid()
    )
  );

CREATE POLICY "service role full access student progress"
  ON student_foundation_progress FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_student_foundation_progress_student ON student_foundation_progress (student_id);

-- Seed 12 placeholder weeks (admin fills in real content)
INSERT INTO mystery_school_foundation_weeks (week_number, title, is_published)
VALUES
  (1,  'Week 1 — Introduction to the Mystery School', false),
  (2,  'Week 2 — The Nature of the Tao', false),
  (3,  'Week 3 — The Gospel of Thomas: Hidden Teachings', false),
  (4,  'Week 4 — The Bhagavad Gita: Dharma and Action', false),
  (5,  'Week 5 — Planetary Archetypes', false),
  (6,  'Week 6 — The Zodiac Wheel', false),
  (7,  'Week 7 — The Seven Sacred Planets', false),
  (8,  'Week 8 — Decans: The 36 Faces', false),
  (9,  'Week 9 — Scrying and Inner Vision', false),
  (10, 'Week 10 — Mundane Impact Journaling', false),
  (11, 'Week 11 — The Five-Fold Creed in Practice', false),
  (12, 'Week 12 — Preparing for the Decan Year', false)
ON CONFLICT (week_number) DO NOTHING;
