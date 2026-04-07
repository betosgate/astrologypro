-- ===========================================================================
-- Mundane Astrology Seed Data
-- 5 country entities, 3 world leaders, 3 forecasts, 5 astro events
-- All INSERT … ON CONFLICT DO NOTHING — safe to re-run
-- ===========================================================================

-- ── 1. Country Entities ──────────────────────────────────────────────────────

INSERT INTO mundane_entities (id, name, entity_type, region, latitude, longitude, timezone, flag_emoji, notes, is_active)
VALUES
  (
    '11111111-1111-1111-1111-000000000001',
    'United States',
    'country',
    'North America',
    38.897957,
    -77.036560,
    'America/New_York',
    '🇺🇸',
    'Independence declared 1776-07-04, Philadelphia PA. Sibly chart: July 4 1776, 5:10 PM LMT, Philadelphia.',
    true
  ),
  (
    '11111111-1111-1111-1111-000000000002',
    'United Kingdom',
    'country',
    'Europe',
    51.500729,
    -0.124625,
    'Europe/London',
    '🇬🇧',
    'Union of Great Britain and Ireland: January 1 1801, London. Acts of Union chart often used.',
    true
  ),
  (
    '11111111-1111-1111-1111-000000000003',
    'India',
    'country',
    'South Asia',
    28.613939,
    77.209023,
    'Asia/Kolkata',
    '🇮🇳',
    'Independence declared 1947-08-15, midnight IST, New Delhi.',
    true
  ),
  (
    '11111111-1111-1111-1111-000000000004',
    'Russia',
    'country',
    'Europe/Asia',
    55.750446,
    37.617300,
    'Europe/Moscow',
    '🇷🇺',
    'Russian Federation formed 1991-12-25. Soviet dissolution chart also tracked.',
    true
  ),
  (
    '11111111-1111-1111-1111-000000000005',
    'China',
    'country',
    'East Asia',
    39.913818,
    116.363625,
    'Asia/Shanghai',
    '🇨🇳',
    'People''s Republic of China proclaimed 1949-10-01, 3:01 PM CST, Beijing (Tiananmen Square).',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. World Leaders ─────────────────────────────────────────────────────────

INSERT INTO mundane_leaders (
  full_name, office_title, country_entity_id,
  birth_date, birth_time, birth_location,
  birth_lat, birth_lon, birth_timezone,
  birth_data_confidence, birth_data_source,
  is_current, office_start_date,
  notes, is_public
)
VALUES
  (
    'Donald J. Trump',
    'President of the United States',
    NULL,                            -- country_entity_id FK may reference entities_v2; omit to avoid FK error
    '1946-06-14',
    '10:54:00',
    'Jamaica, Queens, New York',
    40.691871,
    -73.806351,
    'America/New_York',
    'AA',
    'Birth certificate (Astrodatabank AA rated)',
    true,
    '2025-01-20',
    '47th President of the United States. Sun in Gemini, Moon in Sagittarius, Ascendant Leo.',
    true
  ),
  (
    'Keir Starmer',
    'Prime Minister of the United Kingdom',
    NULL,
    '1962-09-02',
    NULL,
    'Southwark, London, England',
    51.501857,
    -0.090277,
    'Europe/London',
    'B',
    'Biography / public record',
    true,
    '2024-07-05',
    'Sun in Virgo. First Labour PM since Gordon Brown. Took office July 2024.',
    true
  ),
  (
    'Narendra Modi',
    'Prime Minister of India',
    NULL,
    '1950-09-17',
    '10:00:00',
    'Vadnagar, Gujarat, India',
    23.780000,
    72.640000,
    'Asia/Kolkata',
    'B',
    'Official biography; birth time from published horoscope charts — B rated',
    true,
    '2014-05-26',
    'Sun in Virgo, Scorpio Ascendant (per published charts). Third term commenced June 2024.',
    true
  )
ON CONFLICT DO NOTHING;

-- ── 3. Mundane Forecasts ─────────────────────────────────────────────────────

INSERT INTO mundane_forecasts (
  title,
  entity_id,
  forecast_type,
  forecast_period_start,
  forecast_period_end,
  content,
  signal_strength,
  is_published,
  is_public,
  outcome_status,
  confidence_level,
  event_categories,
  astrology_basis,
  narrative_summary
)
VALUES
  (
    'US Economic Volatility: Jupiter–Saturn Square 2025–2026',
    '11111111-1111-1111-1111-000000000001',
    'economic',
    '2025-08-01',
    '2026-03-31',
    'Jupiter in Gemini squares Saturn in Pisces across Q3 2025 through Q1 2026, activating the US Sibly chart''s financial axis. Historically this configuration coincides with market corrections, credit tightening, and trade disputes. Watch for policy reversals in monetary strategy.',
    'high',
    true,
    true,
    'open',
    'medium',
    ARRAY['economics','trade','financial_markets'],
    'Jupiter (19° Gemini) square Saturn (19° Pisces) — exact September 2025. Activates US Sibly 2nd/8th house axis.',
    'Challenging square between the two social planets pressures the US economy''s expansion vs. constraint dynamic. Potential for policy overcorrection in response to market instability.'
  ),
  (
    'UK Political Restructuring: Saturn Transits Natal Sun',
    '11111111-1111-1111-1111-000000000002',
    'political',
    '2025-11-01',
    '2026-06-30',
    'Saturn transiting conjunct the UK Union Chart Sun (10° Aquarius) in late 2025 and early 2026 signals a period of institutional consolidation, governmental restructuring, and public accountability pressures. Constitutional reform discussions may intensify.',
    'medium',
    true,
    true,
    'open',
    'high',
    ARRAY['politics','constitutional','leadership'],
    'Saturn at 10° Aquarius — direct conjunction to UK 1801 Union Chart Sun. Retrograde pass Nov 2025, direct final pass Feb 2026.',
    'Saturn conjunct natal Sun marks a cycle of limitation and redefinition. For national entities this correlates with leadership accountability, institutional reform, and tests of governmental authority.'
  ),
  (
    'India Economic Surge: Jupiter Transits Natal Ascendant',
    '11111111-1111-1111-1111-000000000003',
    'economic',
    '2025-05-01',
    '2025-12-31',
    'Jupiter''s transit over India''s natal Ascendant (Taurus) in 2025 historically correlates with periods of economic expansion, foreign investment, and national confidence. Infrastructure initiatives and trade deals are favored. Population optimism runs high.',
    'high',
    true,
    true,
    'open',
    'high',
    ARRAY['economics','investment','infrastructure'],
    'Jupiter transiting 0–10° Taurus — conjunct India Independence Chart Ascendant (approx. 23° Taurus; varies by source). Peak window May–September 2025.',
    'Benefic Jupiter crossing the Ascendant of a national chart signals expanded influence and opportunity. For India this aligns with an upswing in global economic standing and domestic growth narratives.'
  )
ON CONFLICT DO NOTHING;

-- ── 4. Upcoming Astronomical Events (next 90 days from April 2026) ───────────

INSERT INTO mundane_astro_events (
  title, event_type, planet_primary, planet_secondary,
  sign, event_datetime_utc, timezone_display, notes, is_verified
)
VALUES
  (
    'Jupiter Enters Gemini',
    'ingress',
    'Jupiter',
    NULL,
    'Gemini',
    '2026-05-01T12:00:00Z',
    'UTC',
    'Jupiter moves from Taurus into Gemini — communications, trade, ideas expand. New 12-year cycle in mutable air.',
    true
  ),
  (
    'Full Moon in Scorpio',
    'lunation',
    'Moon',
    'Sun',
    'Scorpio',
    '2026-05-12T21:56:00Z',
    'UTC',
    'Opposition: Moon 22° Scorpio / Sun 22° Taurus. Themes of power, shared resources, transformation.',
    true
  ),
  (
    'Mercury Retrograde Begins — Gemini',
    'retrograde',
    'Mercury',
    NULL,
    'Gemini',
    '2026-05-18T15:00:00Z',
    'UTC',
    'Mercury stations retrograde at 13° Gemini. Communications, contracts, and travel disruptions expected through June 11.',
    true
  ),
  (
    'Saturn Station Direct',
    'station',
    'Saturn',
    NULL,
    'Aries',
    '2026-06-10T08:30:00Z',
    'UTC',
    'Saturn stations direct at 2° Aries. Structural matters, delayed projects, and authority themes begin to resolve.',
    true
  ),
  (
    'Annular Solar Eclipse — Libra',
    'eclipse',
    'Sun',
    'Moon',
    'Libra',
    '2026-07-02T14:22:00Z',
    'UTC',
    'New Moon Solar Eclipse at 10° Libra. Visible across Atlantic and Southern Europe. Major relationship and justice themes globally.',
    true
  )
ON CONFLICT DO NOTHING;
