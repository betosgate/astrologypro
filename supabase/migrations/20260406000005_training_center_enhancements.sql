-- Lesson assets table (multiple PDFs, docs, images per lesson)
CREATE TABLE IF NOT EXISTS lesson_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('pdf', 'doc', 'image', 'link', 'other')),
  url TEXT NOT NULL,
  file_size_bytes BIGINT,
  is_downloadable BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lesson_assets_lesson ON lesson_assets(lesson_id, priority);

-- Lesson videos table (multiple videos per lesson)
CREATE TABLE IF NOT EXISTS lesson_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  title VARCHAR(200),
  video_url TEXT NOT NULL,
  duration_mins INTEGER,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_lesson ON lesson_videos(lesson_id, priority);

-- Quiz questions (multiple per lesson)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson ON quiz_questions(lesson_id, priority);

-- Quiz attempts by trainees
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_lesson ON quiz_attempts(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

-- Lesson completion tracking (extend if table doesn't exist)
CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user ON lesson_completions(user_id);

-- Category completion view helper
CREATE TABLE IF NOT EXISTS category_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_category_completions_user ON category_completions(user_id);

-- RLS: service_role full access; authenticated users manage their own rows
ALTER TABLE lesson_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_completions ENABLE ROW LEVEL SECURITY;

-- lesson_assets and lesson_videos: public read (content is lesson material)
CREATE POLICY "public_read_lesson_assets" ON lesson_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_role_lesson_assets" ON lesson_assets FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read_lesson_videos" ON lesson_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_role_lesson_videos" ON lesson_videos FOR ALL TO service_role USING (true) WITH CHECK (true);

-- quiz_questions: authenticated read (options only — correct_answer filtered in API layer)
CREATE POLICY "public_read_quiz_questions" ON quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_role_quiz_questions" ON quiz_questions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- quiz_attempts: users own their rows
CREATE POLICY "own_quiz_attempts_select" ON quiz_attempts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_quiz_attempts_insert" ON quiz_attempts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_role_quiz_attempts" ON quiz_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- lesson_completions: users own their rows
CREATE POLICY "own_lesson_completions_select" ON lesson_completions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_lesson_completions_insert" ON lesson_completions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_role_lesson_completions" ON lesson_completions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- category_completions: users own their rows
CREATE POLICY "own_category_completions_select" ON category_completions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_category_completions_insert" ON category_completions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_role_category_completions" ON category_completions FOR ALL TO service_role USING (true) WITH CHECK (true);
