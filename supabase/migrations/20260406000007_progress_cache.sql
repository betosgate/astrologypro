-- ============================================================
-- Training Progress Cache
-- Pre-computed per-user progress with auto-recalculate triggers
-- build: 2026-04-06
-- ============================================================

-- 1. User-Category Progress Cache
CREATE TABLE IF NOT EXISTS user_category_progress (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL,
  category_id           UUID NOT NULL REFERENCES training_categories(id) ON DELETE CASCADE,
  program_id            UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  total_lessons         INTEGER NOT NULL DEFAULT 0,
  completed_lessons     INTEGER NOT NULL DEFAULT 0,
  progress_pct          NUMERIC(5,2) NOT NULL DEFAULT 0,
  started_at            TIMESTAMPTZ,
  last_activity_at      TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  next_lesson_id        UUID REFERENCES training_lessons(id) ON DELETE SET NULL,
  next_lesson_title     TEXT,
  next_lesson_priority  INTEGER,
  calculated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_ucp_user         ON user_category_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ucp_category     ON user_category_progress(category_id);
CREATE INDEX IF NOT EXISTS idx_ucp_user_program ON user_category_progress(user_id, program_id);

-- 2. User-Program Progress Cache
CREATE TABLE IF NOT EXISTS user_program_progress (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL,
  program_id            UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  total_lessons         INTEGER NOT NULL DEFAULT 0,
  completed_lessons     INTEGER NOT NULL DEFAULT 0,
  total_categories      INTEGER NOT NULL DEFAULT 0,
  completed_categories  INTEGER NOT NULL DEFAULT 0,
  progress_pct          NUMERIC(5,2) NOT NULL DEFAULT 0,
  started_at            TIMESTAMPTZ,
  last_activity_at      TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  next_lesson_id        UUID REFERENCES training_lessons(id) ON DELETE SET NULL,
  next_lesson_title     TEXT,
  next_category_id      UUID REFERENCES training_categories(id) ON DELETE SET NULL,
  next_category_name    TEXT,
  calculated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);
CREATE INDEX IF NOT EXISTS idx_upp_user    ON user_program_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_upp_program ON user_program_progress(program_id);

-- ============================================================
-- Function: recalculate_user_category_progress
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_user_category_progress(
  p_user_id     UUID,
  p_category_id UUID
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_program_id           UUID;
  v_total_lessons        INTEGER;
  v_completed_lessons    INTEGER;
  v_progress_pct         NUMERIC(5,2);
  v_started_at           TIMESTAMPTZ;
  v_last_activity_at     TIMESTAMPTZ;
  v_completed_at         TIMESTAMPTZ;
  v_next_lesson_id       UUID;
  v_next_lesson_title    TEXT;
  v_next_lesson_priority INTEGER;
BEGIN
  SELECT training_id INTO v_program_id
  FROM training_categories WHERE id = p_category_id;
  IF v_program_id IS NULL THEN RETURN; END IF;

  SELECT COUNT(*) INTO v_total_lessons
  FROM training_lessons
  WHERE category_id = p_category_id AND is_active = true;

  SELECT COUNT(*) INTO v_completed_lessons
  FROM lesson_completions lc
  JOIN training_lessons l ON l.id = lc.lesson_id
  WHERE lc.user_id = p_user_id
    AND l.category_id = p_category_id
    AND l.is_active = true;

  IF v_total_lessons > 0 THEN
    v_progress_pct := ROUND((v_completed_lessons::NUMERIC / v_total_lessons) * 100, 2);
  ELSE
    v_progress_pct := 0;
  END IF;

  SELECT MIN(lp.started_at), MAX(lp.last_active_at)
  INTO v_started_at, v_last_activity_at
  FROM lesson_progress lp
  JOIN training_lessons l ON l.id = lp.lesson_id
  WHERE lp.user_id = p_user_id AND l.category_id = p_category_id;

  SELECT completed_at INTO v_completed_at
  FROM category_completions
  WHERE user_id = p_user_id AND category_id = p_category_id;

  SELECT l.id, l.title, l.priority
  INTO v_next_lesson_id, v_next_lesson_title, v_next_lesson_priority
  FROM training_lessons l
  WHERE l.category_id = p_category_id
    AND l.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM lesson_completions lc
      WHERE lc.user_id = p_user_id AND lc.lesson_id = l.id
    )
  ORDER BY l.priority ASC, l.id ASC
  LIMIT 1;

  INSERT INTO user_category_progress (
    user_id, category_id, program_id,
    total_lessons, completed_lessons, progress_pct,
    started_at, last_activity_at, completed_at,
    next_lesson_id, next_lesson_title, next_lesson_priority,
    calculated_at
  ) VALUES (
    p_user_id, p_category_id, v_program_id,
    v_total_lessons, v_completed_lessons, v_progress_pct,
    v_started_at, v_last_activity_at, v_completed_at,
    v_next_lesson_id, v_next_lesson_title, v_next_lesson_priority,
    NOW()
  )
  ON CONFLICT (user_id, category_id) DO UPDATE SET
    program_id           = EXCLUDED.program_id,
    total_lessons        = EXCLUDED.total_lessons,
    completed_lessons    = EXCLUDED.completed_lessons,
    progress_pct         = EXCLUDED.progress_pct,
    started_at           = COALESCE(user_category_progress.started_at, EXCLUDED.started_at),
    last_activity_at     = EXCLUDED.last_activity_at,
    completed_at         = EXCLUDED.completed_at,
    next_lesson_id       = EXCLUDED.next_lesson_id,
    next_lesson_title    = EXCLUDED.next_lesson_title,
    next_lesson_priority = EXCLUDED.next_lesson_priority,
    calculated_at        = NOW();
END;
$$;

-- ============================================================
-- Function: recalculate_user_program_progress
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_user_program_progress(
  p_user_id    UUID,
  p_program_id UUID
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_lessons        INTEGER;
  v_completed_lessons    INTEGER;
  v_total_categories     INTEGER;
  v_completed_categories INTEGER;
  v_progress_pct         NUMERIC(5,2);
  v_started_at           TIMESTAMPTZ;
  v_last_activity_at     TIMESTAMPTZ;
  v_completed_at         TIMESTAMPTZ;
  v_next_lesson_id       UUID;
  v_next_lesson_title    TEXT;
  v_next_category_id     UUID;
  v_next_category_name   TEXT;
BEGIN
  SELECT COUNT(*) INTO v_total_categories
  FROM training_categories
  WHERE training_id = p_program_id AND is_active = true;

  SELECT
    COALESCE(SUM(ucp.total_lessons), 0),
    COALESCE(SUM(ucp.completed_lessons), 0),
    COUNT(*) FILTER (WHERE ucp.progress_pct >= 100)
  INTO v_total_lessons, v_completed_lessons, v_completed_categories
  FROM user_category_progress ucp
  JOIN training_categories tc ON tc.id = ucp.category_id
  WHERE ucp.user_id = p_user_id
    AND ucp.program_id = p_program_id
    AND tc.is_active = true;

  IF v_total_lessons > 0 THEN
    v_progress_pct := ROUND((v_completed_lessons::NUMERIC / v_total_lessons) * 100, 2);
  ELSE
    v_progress_pct := 0;
  END IF;

  SELECT MIN(started_at), MAX(last_activity_at)
  INTO v_started_at, v_last_activity_at
  FROM user_category_progress
  WHERE user_id = p_user_id AND program_id = p_program_id;

  IF v_total_categories > 0 AND v_completed_categories >= v_total_categories THEN
    SELECT MAX(completed_at) INTO v_completed_at
    FROM user_category_progress
    WHERE user_id = p_user_id AND program_id = p_program_id;
  END IF;

  SELECT tc.id, tc.name
  INTO v_next_category_id, v_next_category_name
  FROM training_categories tc
  LEFT JOIN user_category_progress ucp
    ON ucp.category_id = tc.id AND ucp.user_id = p_user_id
  WHERE tc.training_id = p_program_id
    AND tc.is_active = true
    AND (ucp.progress_pct IS NULL OR ucp.progress_pct < 100)
  ORDER BY tc.priority ASC, tc.id ASC
  LIMIT 1;

  IF v_next_category_id IS NOT NULL THEN
    SELECT ucp.next_lesson_id, ucp.next_lesson_title
    INTO v_next_lesson_id, v_next_lesson_title
    FROM user_category_progress ucp
    WHERE ucp.user_id = p_user_id AND ucp.category_id = v_next_category_id;

    IF v_next_lesson_id IS NULL THEN
      SELECT l.id, l.title INTO v_next_lesson_id, v_next_lesson_title
      FROM training_lessons l
      WHERE l.category_id = v_next_category_id AND l.is_active = true
      ORDER BY l.priority ASC, l.id ASC LIMIT 1;
    END IF;
  END IF;

  INSERT INTO user_program_progress (
    user_id, program_id,
    total_lessons, completed_lessons,
    total_categories, completed_categories,
    progress_pct, started_at, last_activity_at, completed_at,
    next_lesson_id, next_lesson_title,
    next_category_id, next_category_name,
    calculated_at
  ) VALUES (
    p_user_id, p_program_id,
    v_total_lessons, v_completed_lessons,
    v_total_categories, v_completed_categories,
    v_progress_pct, v_started_at, v_last_activity_at, v_completed_at,
    v_next_lesson_id, v_next_lesson_title,
    v_next_category_id, v_next_category_name,
    NOW()
  )
  ON CONFLICT (user_id, program_id) DO UPDATE SET
    total_lessons        = EXCLUDED.total_lessons,
    completed_lessons    = EXCLUDED.completed_lessons,
    total_categories     = EXCLUDED.total_categories,
    completed_categories = EXCLUDED.completed_categories,
    progress_pct         = EXCLUDED.progress_pct,
    started_at           = COALESCE(user_program_progress.started_at, EXCLUDED.started_at),
    last_activity_at     = EXCLUDED.last_activity_at,
    completed_at         = EXCLUDED.completed_at,
    next_lesson_id       = EXCLUDED.next_lesson_id,
    next_lesson_title    = EXCLUDED.next_lesson_title,
    next_category_id     = EXCLUDED.next_category_id,
    next_category_name   = EXCLUDED.next_category_name,
    calculated_at        = NOW();
END;
$$;

-- ============================================================
-- Function: recalculate_all_progress_for_category
-- Called when lessons change — recalculates ALL affected users
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_all_progress_for_category(p_category_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user     RECORD;
  v_prog_id  UUID;
BEGIN
  SELECT training_id INTO v_prog_id FROM training_categories WHERE id = p_category_id;

  FOR v_user IN
    SELECT DISTINCT user_id FROM lesson_progress lp
    JOIN training_lessons l ON l.id = lp.lesson_id WHERE l.category_id = p_category_id
    UNION
    SELECT DISTINCT user_id FROM lesson_completions lc
    JOIN training_lessons l ON l.id = lc.lesson_id WHERE l.category_id = p_category_id
    UNION
    SELECT DISTINCT user_id FROM user_category_progress WHERE category_id = p_category_id
  LOOP
    PERFORM recalculate_user_category_progress(v_user.user_id, p_category_id);
    IF v_prog_id IS NOT NULL THEN
      PERFORM recalculate_user_program_progress(v_user.user_id, v_prog_id);
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- Function: recalculate_all_progress_for_program
-- Called when categories change
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_all_progress_for_program(p_program_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN
    SELECT DISTINCT user_id FROM user_program_progress WHERE program_id = p_program_id
    UNION
    SELECT DISTINCT user_id FROM program_enrollments WHERE program_id = p_program_id
  LOOP
    PERFORM recalculate_user_program_progress(v_user.user_id, p_program_id);
  END LOOP;
END;
$$;

-- ============================================================
-- TRIGGER 1: lesson_completions → immediate recalculate
-- ============================================================
CREATE OR REPLACE FUNCTION trg_lesson_completion_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cat_id  UUID;
  v_prog_id UUID;
BEGIN
  SELECT category_id INTO v_cat_id FROM training_lessons WHERE id = NEW.lesson_id;
  IF v_cat_id IS NOT NULL THEN
    PERFORM recalculate_user_category_progress(NEW.user_id, v_cat_id);
    SELECT training_id INTO v_prog_id FROM training_categories WHERE id = v_cat_id;
    IF v_prog_id IS NOT NULL THEN
      PERFORM recalculate_user_program_progress(NEW.user_id, v_prog_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_lesson_completion ON lesson_completions;
CREATE TRIGGER after_lesson_completion
  AFTER INSERT OR UPDATE ON lesson_completions
  FOR EACH ROW EXECUTE FUNCTION trg_lesson_completion_progress();

-- ============================================================
-- TRIGGER 2: training_lessons change → recalculate all users
-- ============================================================
CREATE OR REPLACE FUNCTION trg_lesson_change_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cat_id UUID;
BEGIN
  v_cat_id := COALESCE(
    CASE WHEN TG_OP = 'DELETE' THEN OLD.category_id ELSE NEW.category_id END,
    NULL
  );
  IF v_cat_id IS NOT NULL THEN
    PERFORM recalculate_all_progress_for_category(v_cat_id);
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id
     AND OLD.category_id IS NOT NULL THEN
    PERFORM recalculate_all_progress_for_category(OLD.category_id);
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_lesson_change ON training_lessons;
CREATE TRIGGER after_lesson_change
  AFTER INSERT OR UPDATE OR DELETE ON training_lessons
  FOR EACH ROW EXECUTE FUNCTION trg_lesson_change_progress();

-- ============================================================
-- TRIGGER 3: training_categories change → recalculate program
-- ============================================================
CREATE OR REPLACE FUNCTION trg_category_change_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prog_id UUID;
BEGIN
  v_prog_id := COALESCE(
    CASE WHEN TG_OP = 'DELETE' THEN OLD.training_id ELSE NEW.training_id END,
    NULL
  );
  IF v_prog_id IS NOT NULL THEN
    PERFORM recalculate_all_progress_for_program(v_prog_id);
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_category_change ON training_categories;
CREATE TRIGGER after_category_change
  AFTER INSERT OR UPDATE OR DELETE ON training_categories
  FOR EACH ROW EXECUTE FUNCTION trg_category_change_progress();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE user_category_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_program_progress  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_ucp_select"  ON user_category_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "service_ucp_all" ON user_category_progress FOR ALL    TO service_role  USING (true) WITH CHECK (true);

CREATE POLICY "own_upp_select"  ON user_program_progress  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "service_upp_all" ON user_program_progress  FOR ALL    TO service_role  USING (true) WITH CHECK (true);
