-- Migration 034: Holy Books + Doctrine Links CMS + Sunday Service book_name
-- 2026-04-06

-- ── Holy Books ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS holy_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image_url text,
  file_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE holy_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can read holy_books"
  ON holy_books FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role full access holy_books"
  ON holy_books
  USING (true)
  WITH CHECK (true);

-- ── Doctrine Links ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctrine_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  url text NOT NULL,
  link_type text NOT NULL DEFAULT 'study',
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE doctrine_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can read doctrine_links"
  ON doctrine_links FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role full access doctrine_links"
  ON doctrine_links
  USING (true)
  WITH CHECK (true);

-- ── Sunday Service: add book_name column ──────────────────────────────────────
ALTER TABLE sunday_service_sessions ADD COLUMN IF NOT EXISTS book_name text;
