-- ============================================================
-- Migration: 20260407000059_missing_seeds.sql
-- Purpose  : Fix diviner_plans price bug + seed wheel_signs,
--            spiritual_wisdom, and packages.
-- ============================================================

-- ──────────────────────────────────────────
-- 1. Fix diviner_plans price_cents bug
--    All 3 plans were incorrectly seeded at 9900.
-- ──────────────────────────────────────────

UPDATE diviner_plans SET price_cents = 0    WHERE slug = 'starter';
UPDATE diviner_plans SET price_cents = 4900 WHERE slug = 'professional';
UPDATE diviner_plans SET price_cents = 9900 WHERE slug = 'elite';


-- ──────────────────────────────────────────
-- 2. Seed wheel_signs (12 zodiac signs)
--    Schema: id, title, start_date, end_date, theme_image,
--            icon_image, priority, is_active, created_at, updated_at
--    No unique constraint on title — use WHERE NOT EXISTS guard.
--    Dates use a fixed non-leap year (2000) as placeholders;
--    the application is expected to match by month/day only.
-- ──────────────────────────────────────────

INSERT INTO wheel_signs (title, start_date, end_date, priority, is_active)
SELECT * FROM (VALUES
  ('Aries',       DATE '2000-03-21', DATE '2000-04-19',  1, true),
  ('Taurus',      DATE '2000-04-20', DATE '2000-05-20',  2, true),
  ('Gemini',      DATE '2000-05-21', DATE '2000-06-20',  3, true),
  ('Cancer',      DATE '2000-06-21', DATE '2000-07-22',  4, true),
  ('Leo',         DATE '2000-07-23', DATE '2000-08-22',  5, true),
  ('Virgo',       DATE '2000-08-23', DATE '2000-09-22',  6, true),
  ('Libra',       DATE '2000-09-23', DATE '2000-10-22',  7, true),
  ('Scorpio',     DATE '2000-10-23', DATE '2000-11-21',  8, true),
  ('Sagittarius', DATE '2000-11-22', DATE '2000-12-21',  9, true),
  ('Capricorn',   DATE '2000-12-22', DATE '2001-01-19', 10, true),
  ('Aquarius',    DATE '2001-01-20', DATE '2001-02-18', 11, true),
  ('Pisces',      DATE '2001-02-19', DATE '2001-03-20', 12, true)
) AS v(title, start_date, end_date, priority, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM wheel_signs WHERE wheel_signs.title = v.title
);


-- ──────────────────────────────────────────
-- 3. Seed spiritual_wisdom (6 items)
--    Schema: id, title, descriptive_title, content, image_url,
--            youtube_url, type ('text'|'youtube'), priority,
--            is_active, created_at, updated_at
--    Mapping requested types → allowed DB values:
--      video     → 'youtube'
--      article   → 'text'
--      meditation → 'text'
--      quote     → 'text'
-- ──────────────────────────────────────────

INSERT INTO spiritual_wisdom (title, descriptive_title, content, image_url, youtube_url, type, priority, is_active)
SELECT * FROM (VALUES
  (
    'The Power of Saturn Returns',
    'How Saturn''s return shapes your life path',
    NULL,
    'https://placeholder.astrologypro.com/wisdom/1.jpg',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    1,
    true
  ),
  (
    'Understanding Your Moon Sign',
    'The emotional core beneath your Sun sign',
    'Your Moon sign reveals your instinctive emotional nature, your subconscious patterns, and what you need to feel safe and nurtured. While the Sun sign represents your conscious identity, the Moon governs the inner world — your reactions, habits, and deepest comforts. Explore how your natal Moon placement shapes your relationships and daily emotional rhythms.',
    'https://placeholder.astrologypro.com/wisdom/2.jpg',
    NULL,
    'text',
    2,
    true
  ),
  (
    'Morning Ritual for Cosmic Alignment',
    'A daily meditation practice tuned to planetary hours',
    'Begin each morning by sitting quietly for five minutes, setting an intention aligned with the ruling planet of the current day. Visualise the planetary energy flowing through your body, grounding you in purpose and clarity before the day unfolds. This simple ritual reconnects you to the larger cosmic rhythm guiding your path.',
    'https://placeholder.astrologypro.com/wisdom/3.jpg',
    NULL,
    'text',
    3,
    true
  ),
  (
    'The Fool''s Journey Through Life',
    'How the Major Arcana maps your spiritual evolution',
    'The 22 Major Arcana cards of the Tarot trace the Fool''s Journey — an archetypal path of spiritual awakening from naïve beginnings (The Fool, 0) to integrated wholeness (The World, XXI). Each card represents a stage of inner development: confronting The Tower, finding grace in The Star, embracing The Hermit''s wisdom. Reading your natal chart alongside the Major Arcana reveals where you currently stand on your personal journey.',
    'https://placeholder.astrologypro.com/wisdom/4.jpg',
    NULL,
    'text',
    4,
    true
  ),
  (
    'New Moon Intentions Setting',
    'Harness lunar cycles to manifest your goals',
    NULL,
    'https://placeholder.astrologypro.com/wisdom/5.jpg',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    5,
    true
  ),
  (
    'Decan Wisdom: Your Planetary Ruler',
    'Unlock the sub-ruler that adds depth to your Sun sign',
    'Each zodiac sign is divided into three 10-degree decans, each governed by a secondary planetary ruler. This sub-ruler modifies your Sun sign expression in subtle but significant ways — a third-decan Scorpio ruled by the Moon feels emotions very differently from a first-decan Scorpio ruled by Mars. Understanding your decan opens a richer layer of self-knowledge beyond the standard 12-sign framework.',
    'https://placeholder.astrologypro.com/wisdom/6.jpg',
    NULL,
    'text',
    6,
    true
  )
) AS v(title, descriptive_title, content, image_url, youtube_url, type, priority, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM spiritual_wisdom WHERE spiritual_wisdom.title = v.title
);


-- ──────────────────────────────────────────
-- 4. Seed packages (5 service bundles)
--    Schema: id, name, description, price (DECIMAL 10,2),
--            features (JSONB), is_active, created_at, updated_at
-- ──────────────────────────────────────────

INSERT INTO packages (name, description, price, features, is_active)
SELECT * FROM (VALUES
  (
    'Birth Chart + Forecast Bundle',
    'A comprehensive natal chart reading paired with a personalised 3-month transit forecast. Understand your core blueprint and what the cosmos has in store for the months ahead.',
    197.00,
    '["Natal chart reading (60 min)","3-month transit forecast report","PDF chart wheel delivered by email","One follow-up question via email"]'::jsonb,
    true
  ),
  (
    'New Moon Ritual Bundle',
    'Monthly new moon reading plus a downloadable ritual guide PDF to help you set intentions in alignment with the lunar cycle.',
    97.00,
    '["Monthly new moon astrology reading (30 min)","Ritual guide PDF download","Personalised intention-setting prompts","Access to members'' new moon circle recording"]'::jsonb,
    true
  ),
  (
    'Tarot Year Ahead Bundle',
    'A full Celtic Cross spread for your current situation, followed by a 12-month card draw charting the themes of each month in the year ahead, with a written guide.',
    147.00,
    '["Celtic Cross tarot spread (45 min)","12-month one-card draw for each month","Written interpretation guide (PDF)","Recorded session replay"]'::jsonb,
    true
  ),
  (
    'Saturn Return Intensive',
    'Three in-depth 60-minute sessions guiding you through your Saturn Return, with a written report and ongoing email support to help you navigate this pivotal life transition.',
    297.00,
    '["3 x 60-minute Saturn Return sessions","Written Saturn Return report (PDF)","Email support between sessions (30 days)","Recommended reading list","Recorded session replays"]'::jsonb,
    true
  ),
  (
    'Awakening Package',
    'An introductory bundle for new clients: a birth chart overview reading combined with a personalised tarot spread to reveal the energies currently surrounding your path.',
    97.00,
    '["Intro birth chart reading (45 min)","Personalised 5-card tarot spread","Session notes summary (PDF)","10% discount on next booking"]'::jsonb,
    true
  )
) AS v(name, description, price, features, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM packages WHERE packages.name = v.name
);
