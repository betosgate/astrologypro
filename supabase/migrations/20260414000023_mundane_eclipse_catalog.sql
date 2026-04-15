-- mundane_eclipses: catalog of significant solar and lunar eclipses
CREATE TABLE IF NOT EXISTS mundane_eclipses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_utc TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('solar', 'lunar')),
  subtype TEXT CHECK (subtype IN ('total', 'annular', 'partial', 'penumbral', 'hybrid')),
  saros_series INTEGER,
  saros_member INTEGER,
  degree_ecliptic DECIMAL(6,3), -- 0-360 ecliptic longitude of eclipse point
  sign TEXT,
  magnitude DECIMAL(6,4),
  is_visible_globally BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mundane_eclipses_date ON mundane_eclipses(date_utc);
CREATE INDEX IF NOT EXISTS idx_mundane_eclipses_type ON mundane_eclipses(type, date_utc);

-- RLS
ALTER TABLE mundane_eclipses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eclipses_admin_all" ON mundane_eclipses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "eclipses_auth_read" ON mundane_eclipses FOR SELECT TO authenticated USING (true);

-- ─── Seed: 25 significant eclipses 2024-2028 ──────────────────────────────────
-- Source: NASA Eclipse Predictions (Espenak & Meeus)

INSERT INTO mundane_eclipses (date_utc, type, subtype, saros_series, saros_member, degree_ecliptic, sign, magnitude, is_visible_globally, notes) VALUES

-- 2024
('2024-04-08 18:18:00+00', 'solar', 'total', 139, 45, 19.0, 'aries', 1.0566, false,
 'Great North American Total Solar Eclipse. Path crosses Mexico, US, Canada.'),
('2024-09-17 02:44:00+00', 'lunar', 'partial', 179, 35, 354.9, 'pisces', 0.0862, true,
 'Partial lunar eclipse visible from Europe, Asia, Africa, Americas.'),
('2024-10-02 18:46:00+00', 'solar', 'annular', 144, 25, 10.1, 'libra', 0.9326, false,
 'Annular solar eclipse visible across southern South America.'),

-- 2025
('2025-03-14 06:58:00+00', 'lunar', 'total', 132, 61, 23.5, 'virgo', 1.1784, true,
 'Total lunar eclipse. Visible from Americas, Europe, Africa, western Asia.'),
('2025-03-29 10:48:00+00', 'solar', 'partial', 149, 21, 9.2, 'aries', 0.9378, false,
 'Partial solar eclipse visible from northwestern Europe, northwestern Africa.'),
('2025-09-07 18:11:00+00', 'lunar', 'total', 142, 57, 15.1, 'pisces', 1.3640, true,
 'Total lunar eclipse. Visible from Europe, Asia, Africa, Australia.'),
('2025-09-21 19:43:00+00', 'solar', 'partial', 179, 36, 29.1, 'virgo', 0.8564, false,
 'Partial solar eclipse visible from New Zealand, Antarctica.'),

-- 2026
('2026-02-17 12:12:00+00', 'solar', 'annular', 121, 69, 28.5, 'aquarius', 0.9630, false,
 'Annular solar eclipse. Path crosses Antarctica.'),
('2026-08-12 17:47:00+00', 'solar', 'total', 126, 45, 19.8, 'leo', 1.0490, false,
 'Total solar eclipse. Path crosses Greenland, Iceland, Spain, North Africa.'),
('2026-08-28 04:14:00+00', 'lunar', 'partial', 147, 35, 4.4, 'pisces', 0.9295, true,
 'Partial lunar eclipse. Visible from Asia, Australia, Pacific, Americas.'),

-- 2027
('2027-02-06 16:01:00+00', 'lunar', 'penumbral', 124, 65, 17.7, 'leo', 0.9285, true,
 'Penumbral lunar eclipse visible from Asia, Australia, Pacific.'),
('2027-02-20 23:14:00+00', 'solar', 'annular', 131, 54, 1.9, 'pisces', 0.9280, false,
 'Annular solar eclipse visible from southern South America and Atlantic.'),
('2027-07-18 16:04:00+00', 'lunar', 'partial', 130, 61, 26.0, 'capricorn', 0.1646, true,
 'Partial lunar eclipse visible from Europe, Africa, Asia.'),
('2027-08-02 10:07:00+00', 'solar', 'total', 136, 46, 9.9, 'leo', 1.0790, false,
 'Total solar eclipse with path across Morocco, Spain, Algeria, Libya, Egypt, Saudi Arabia.'),

-- 2028
('2028-01-12 04:13:00+00', 'lunar', 'total', 133, 57, 22.2, 'cancer', 1.2460, true,
 'Total lunar eclipse visible from Americas, Europe, Africa, western Asia.'),
('2028-01-26 15:08:00+00', 'solar', 'annular', 141, 39, 6.5, 'aquarius', 0.9685, false,
 'Annular solar eclipse visible from Ecuador, Peru, Brazil, southern Atlantic.'),
('2028-06-22 03:20:00+00', 'lunar', 'penumbral', 138, 65, 0.5, 'capricorn', 0.8035, true,
 'Penumbral lunar eclipse visible from Americas, Europe, Africa.'),
('2028-07-06 18:20:00+00', 'solar', 'partial', 117, 74, 14.6, 'cancer', 0.3975, false,
 'Partial solar eclipse visible from Antarctica, southern Australia, New Zealand.'),
('2028-07-22 02:56:00+00', 'lunar', 'partial', 135, 36, 29.4, 'capricorn', 0.4060, true,
 'Partial lunar eclipse visible from Asia, Australia, Pacific.'),
('2028-08-05 10:51:00+00', 'solar', 'total', 146, 27, 13.5, 'leo', 1.0550, false,
 'Total solar eclipse with path through Australia, New Zealand.'),
('2028-12-01 06:40:00+00', 'lunar', 'total', 103, 71, 9.5, 'gemini', 1.1140, true,
 'Total lunar eclipse visible from Americas, Europe, Africa, western Asia.'),
('2028-12-15 22:16:00+00', 'solar', 'partial', 151, 14, 24.2, 'sagittarius', 0.8880, false,
 'Partial solar eclipse visible from Antarctic region.'),

-- Additional 2027-2028 completions
('2027-07-03 08:58:00+00', 'solar', 'partial', 118, 67, 11.8, 'cancer', 0.2340, false,
 'Partial solar eclipse visible from Antarctica.'),
('2028-02-11 09:33:00+00', 'lunar', 'penumbral', 140, 57, 22.4, 'leo', 0.7410, true,
 'Penumbral lunar eclipse visible from Europe, Africa, Asia, Australia.'),
('2028-06-11 03:44:00+00', 'solar', 'partial', 156, 5, 20.7, 'gemini', 0.1820, false,
 'Partial solar eclipse visible from Antarctica and southern tip of South America.');
