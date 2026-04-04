-- Admin content tables: training, packages, webinars, tarot, ritual, wheel signs
-- All tables have RLS: public read, service_role write

-- ──────────────────────────────────────────
-- TRAINING MANAGEMENT
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  priority    INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_lessons (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID        REFERENCES training_categories(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  description   TEXT,
  video_url     TEXT,
  pdf_url       TEXT,
  content       TEXT,
  duration_mins INTEGER,
  priority      INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_quizzes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   UUID        REFERENCES training_lessons(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  questions   JSONB       NOT NULL DEFAULT '[]',  -- [{question, options:[{text,correct}]}]
  pass_score  INTEGER     NOT NULL DEFAULT 70,    -- percent
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- PACKAGES (bundles of services / training)
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS packages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  features    JSONB       NOT NULL DEFAULT '[]',  -- list of feature strings
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- WEBINARS
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webinars (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  host_name     TEXT,
  scheduled_at  TIMESTAMPTZ,
  duration_mins INTEGER     NOT NULL DEFAULT 60,
  join_url      TEXT,
  recording_url TEXT,
  is_free       BOOLEAN     NOT NULL DEFAULT true,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- TAROT SPREADS + CARDS
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tarot_spreads (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  card_count  INTEGER     NOT NULL DEFAULT 3,
  layout_json JSONB,      -- positional layout data
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  priority    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tarot_cards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  spread_id       UUID        REFERENCES tarot_spreads(id) ON DELETE SET NULL,
  name            TEXT        NOT NULL,
  arcana          TEXT        CHECK (arcana IN ('major', 'minor')),
  suit            TEXT,       -- for minor arcana
  number          INTEGER,
  upright_meaning TEXT,
  reversed_meaning TEXT,
  image_url       TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- RITUAL INVOCATIONS
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ritual_invocations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  description  TEXT,
  instructions TEXT,
  priority     INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- WHEEL SIGNS (zodiac signs with date ranges)
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wheel_signs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  start_date   DATE        NOT NULL,
  end_date     DATE        NOT NULL,
  theme_image  TEXT,
  icon_image   TEXT,
  priority     INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- ASTRO DECAN INFO (zodiac decan metadata)
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS astro_decan_info (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sign_id      UUID        REFERENCES wheel_signs(id) ON DELETE SET NULL,
  sign_name    TEXT        NOT NULL,
  planet       TEXT,
  tarot_name   TEXT,
  greek_daemon TEXT,
  decan        INTEGER     CHECK (decan IN (1, 2, 3)),
  description  TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- RLS: Public read, service_role write for all
-- ──────────────────────────────────────────

ALTER TABLE training_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_quizzes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_spreads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_cards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_invocations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_signs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE astro_decan_info      ENABLE ROW LEVEL SECURITY;

-- Public read
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'training_categories','training_lessons','training_quizzes',
    'packages','webinars',
    'tarot_spreads','tarot_cards',
    'ritual_invocations','wheel_signs','astro_decan_info'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "public_read_%1$s" ON %1$s FOR SELECT TO anon, authenticated USING (true)', t
    );
    EXECUTE format(
      'CREATE POLICY "service_role_write_%1$s" ON %1$s FOR ALL TO service_role USING (true) WITH CHECK (true)', t
    );
  END LOOP;
END $$;
