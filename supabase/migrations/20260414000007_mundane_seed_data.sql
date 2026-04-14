-- ============================================================================
-- Mundane Astrology — Comprehensive Seed Data
-- Populates: mundane_entities, mundane_entity_charts, mundane_leaders,
--            mundane_events, mundane_astro_events, mundane_forecasts,
--            mundane_research_projects, mundane_project_notes
-- Idempotent — safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;

  -- entity IDs
  v_usa UUID := 'e1000000-0000-0000-0000-000000000001';
  v_uk  UUID := 'e1000000-0000-0000-0000-000000000002';
  v_ind UUID := 'e1000000-0000-0000-0000-000000000003';
  v_eur UUID := 'e1000000-0000-0000-0000-000000000004';
  v_chn UUID := 'e1000000-0000-0000-0000-000000000005';
  v_rus UUID := 'e1000000-0000-0000-0000-000000000006';
  v_isr UUID := 'e1000000-0000-0000-0000-000000000007';
  v_bra UUID := 'e1000000-0000-0000-0000-000000000008';

  -- leader IDs
  v_l1  UUID := 'f1000000-0000-0000-0000-000000000001';
  v_l2  UUID := 'f1000000-0000-0000-0000-000000000002';
  v_l3  UUID := 'f1000000-0000-0000-0000-000000000003';
  v_l4  UUID := 'f1000000-0000-0000-0000-000000000004';

  -- forecast IDs
  v_fc1 UUID := 'c1000000-0000-0000-0000-000000000001';
  v_fc2 UUID := 'c1000000-0000-0000-0000-000000000002';
  v_fc3 UUID := 'c1000000-0000-0000-0000-000000000003';

  -- research project IDs
  v_rp1 UUID := 'd1000000-0000-0000-0000-000000000001';
  v_rp2 UUID := 'd1000000-0000-0000-0000-000000000002';

BEGIN

  -- Resolve a user to attach seed data to (first admin user, or any user)
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found — skipping mundane seed.';
    RETURN;
  END IF;

  -- =========================================================================
  -- 1. MUNDANE ENTITIES
  -- =========================================================================
  INSERT INTO mundane_entities (id, name, entity_type, region, latitude, longitude, timezone, flag_emoji, notes, is_active, created_by)
  VALUES
    (v_usa, 'United States', 'country', 'North America', 38.8951, -77.0364, 'America/New_York', '🇺🇸',
     'Independence declared 4 July 1776. Multiple chart candidates exist (Sibly, Gemini rising, etc.)', true, v_user_id),
    (v_uk,  'United Kingdom', 'country', 'Europe', 51.5074, -0.1278, 'Europe/London', '🇬🇧',
     'Acts of Union 1707 and 1801. Tudor–Stuart–Georgian cycles studied by mundane astrologers.', true, v_user_id),
    (v_ind, 'India', 'country', 'Asia', 28.6139, 77.2090, 'Asia/Kolkata', '🇮🇳',
     'Independence 15 August 1947 at 00:00 IST. Vedic mundane analysis heavily researched.', true, v_user_id),
    (v_eur, 'European Union', 'institution', 'Europe', 50.8503, 4.3517, 'Europe/Brussels', '🇪🇺',
     'Maastricht Treaty signed 7 Feb 1992. Effective 1 Nov 1993.', true, v_user_id),
    (v_chn, 'China', 'country', 'Asia', 39.9042, 116.4074, 'Asia/Shanghai', '🇨🇳',
     'PRC founded 1 October 1949, 15:01 Beijing. Major chart for all modern Chinese cycle analysis.', true, v_user_id),
    (v_rus, 'Russia', 'country', 'Europe', 55.7558, 37.6173, 'Europe/Moscow', '🇷🇺',
     'Russian Federation declared 12 June 1990. Soviet dissolution 25 Dec 1991 also tracked.', true, v_user_id),
    (v_isr, 'Israel', 'country', 'Middle East', 31.7683, 35.2137, 'Asia/Jerusalem', '🇮🇱',
     'Independence declared 14 May 1948, 16:00 Tel Aviv. Pluto return period active 2022–2028.', true, v_user_id),
    (v_bra, 'Brazil', 'country', 'South America', -15.7942, -47.8825, 'America/Sao_Paulo', '🇧🇷',
     'Republic proclaimed 15 November 1889. Current chart uses 5:11 PM LMT.', true, v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 2. MUNDANE ENTITY CHARTS
  -- =========================================================================
  INSERT INTO mundane_entity_charts (id, entity_id, chart_title, chart_type, event_date, event_time, timezone, notes, is_primary, created_by)
  VALUES
    -- USA — Sibly chart (traditional)
    ('ec100000-0000-0000-0000-000000000001', v_usa,
     'Sibly Chart (Independence)', 'independence', '1776-07-04', '17:10:00', 'America/New_York',
     'Most widely used. Sagittarius rising, Moon in Aquarius. Source: Ebenezer Sibly 1787.', true, v_user_id),
    -- USA — Gemini Rising alternative
    ('ec100000-0000-0000-0000-000000000002', v_usa,
     'Gemini Rising (Rudhyar)', 'independence', '1776-07-04', '09:36:00', 'America/New_York',
     'Rudhyar rectified to Gemini rising. Used by some Western mundane astrologers.', false, v_user_id),
    -- UK — Acts of Union
    ('ec100000-0000-0000-0000-000000000003', v_uk,
     'Acts of Union 1801', 'independence', '1801-01-01', '00:00:00', 'Europe/London',
     'Union of Great Britain and Ireland. Most commonly used UK chart.', true, v_user_id),
    -- India — Independence
    ('ec100000-0000-0000-0000-000000000004', v_ind,
     'Indian Independence', 'independence', '1947-08-15', '00:00:00', 'Asia/Kolkata',
     'Midnight chart, New Delhi. Standard for both Western and Vedic mundane analysis.', true, v_user_id),
    -- China — PRC founding
    ('ec100000-0000-0000-0000-000000000005', v_chn,
     'PRC Founding', 'independence', '1949-10-01', '15:01:00', 'Asia/Shanghai',
     'Proclaimed by Mao Zedong in Beijing. Libra rising chart.', true, v_user_id),
    -- Russia — Federation
    ('ec100000-0000-0000-0000-000000000006', v_rus,
     'Russian Federation Declaration', 'independence', '1990-06-12', '00:00:00', 'Europe/Moscow',
     'Declaration of sovereignty from the USSR. Used alongside Soviet dissolution chart.', true, v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 2b. MUNDANE ENTITIES V2 (mundane_leaders FK references this table)
  -- =========================================================================
  INSERT INTO mundane_entities_v2 (id, name, entity_type, region, birth_location, birth_lat, birth_lon, birth_timezone,
    country_code, tags, is_public, is_active, owner_user_id)
  VALUES
    (v_usa, 'United States', 'country', 'North America', 'Philadelphia, Pennsylvania, USA', 38.8951, -77.0364, 'America/New_York',
     'US', ARRAY['western_mundane', 'nato'], true, true, v_user_id),
    (v_uk,  'United Kingdom', 'country', 'Europe', 'London, England, UK', 51.5074, -0.1278, 'Europe/London',
     'GB', ARRAY['western_mundane', 'nato'], true, true, v_user_id),
    (v_ind, 'India', 'country', 'Asia', 'New Delhi, India', 28.6139, 77.2090, 'Asia/Kolkata',
     'IN', ARRAY['vedic_mundane', 'brics'], true, true, v_user_id),
    (v_eur, 'European Union', 'institution', 'Europe', 'Brussels, Belgium', 50.8503, 4.3517, 'Europe/Brussels',
     'EU', ARRAY['western_mundane', 'institution'], true, true, v_user_id),
    (v_chn, 'China', 'country', 'Asia', 'Beijing, China', 39.9042, 116.4074, 'Asia/Shanghai',
     'CN', ARRAY['western_mundane', 'brics'], true, true, v_user_id),
    (v_rus, 'Russia', 'country', 'Europe', 'Moscow, Russia', 55.7558, 37.6173, 'Europe/Moscow',
     'RU', ARRAY['western_mundane', 'brics'], true, true, v_user_id),
    (v_isr, 'Israel', 'country', 'Middle East', 'Tel Aviv, Israel', 31.7683, 35.2137, 'Asia/Jerusalem',
     'IL', ARRAY['western_mundane', 'middle_east'], true, true, v_user_id),
    (v_bra, 'Brazil', 'country', 'South America', 'Brasília, Brazil', -15.7942, -47.8825, 'America/Sao_Paulo',
     'BR', ARRAY['western_mundane', 'brics'], true, true, v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 3. MUNDANE LEADERS
  -- =========================================================================
  INSERT INTO mundane_leaders (id, full_name, office_title, country_entity_id, office_start_date, is_current,
    birth_date, birth_location, birth_data_confidence, notes, tags, is_public, created_by)
  VALUES
    (v_l1, 'Joe Biden', 'President', v_usa, '2021-01-20', false,
     '1942-11-20', 'Scranton, Pennsylvania, USA', 'A',
     'Sun in Scorpio. Served 2021–2025. Notable Neptune transits during tenure.', ARRAY['political', 'usa'], true, v_user_id),
    (v_l2, 'Donald Trump', 'President', v_usa, '2025-01-20', true,
     '1946-06-14', 'Queens, New York, USA', 'AA',
     'Sun in Gemini, Moon in Sagittarius, Leo rising. Second term began Jan 2025.', ARRAY['political', 'usa'], true, v_user_id),
    (v_l3, 'Narendra Modi', 'Prime Minister', v_ind, '2014-05-26', true,
     '1950-09-17', 'Vadnagar, Gujarat, India', 'B',
     'Sun in Virgo. Birth time debated. Major Jupiter return cycles align with election wins.', ARRAY['political', 'india', 'vedic'], true, v_user_id),
    (v_l4, 'Xi Jinping', 'General Secretary', v_chn, '2012-11-15', true,
     '1953-06-15', 'Beijing, China', 'B',
     'Sun in Gemini. Consolidated power under Saturn in Capricorn. Third term 2022.', ARRAY['political', 'china'], true, v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 4. MUNDANE EVENTS (historical + forecast)
  -- =========================================================================
  INSERT INTO mundane_events (id, title, event_type, description, event_date, location, primary_entity_id,
    astrological_factors, is_forecast, forecast_confidence, outcome_verified, source, tags, is_public, created_by)
  VALUES
    -- Historical events
    ('e2100000-0000-0000-0000-000000000001',
     'US Presidential Inauguration 2025', 'historical',
     'Donald Trump sworn in as 47th President of the United States.',
     '2025-01-20', 'Washington DC, USA', v_usa,
     '{"key_transits": ["Pluto in Aquarius conjunct US Pluto return zone", "Saturn conjunct natal Saturn"], "eclipse_proximity": "South Node eclipse within 6 degrees"}'::jsonb,
     false, null, true, 'Official record', ARRAY['election', 'usa', 'inauguration'], true, v_user_id),

    ('e2100000-0000-0000-0000-000000000002',
     'UK General Election 2024', 'historical',
     'Labour Party wins landslide majority under Keir Starmer. Conservative 14-year rule ends.',
     '2024-07-04', 'London, UK', v_uk,
     '{"key_transits": ["Jupiter trine UK Sun", "Saturn opposing UK Moon"], "chart_note": "Election falls on US Independence Day"}'::jsonb,
     false, null, true, 'BBC News', ARRAY['election', 'uk', 'political'], true, v_user_id),

    ('e2100000-0000-0000-0000-000000000003',
     'India General Election 2024', 'historical',
     'BJP returns to power, third consecutive term for Modi but with reduced majority.',
     '2024-06-04', 'New Delhi, India', v_ind,
     '{"key_transits": ["Rahu in Pisces transiting Indian Moon", "Jupiter in Aries activating lagna"], "vedic_factors": {"tithi": "Ekadashi", "nakshatra": "Rohini"}}'::jsonb,
     false, null, true, 'Election Commission of India', ARRAY['election', 'india', 'vedic'], true, v_user_id),

    -- Upcoming forecast events
    ('e2100000-0000-0000-0000-000000000004',
     'Pluto Full Ingress into Aquarius — Global Shift Window', 'forecast',
     'Pluto fully enters Aquarius after its final retrograde back to Capricorn. Marks the beginning of a 20-year Aquarian cycle for global power structures, AI governance, and social reorganization.',
     '2024-11-19', 'Global', null,
     '{"key_transits": ["Pluto 0° Aquarius", "Last Pluto-Capricorn retrograde completed"], "cycle_context": "First time since 1778–1798 (American and French Revolutions)"}'::jsonb,
     false, null, true, 'Swiss Ephemeris', ARRAY['outer_planet', 'pluto', 'aquarius', 'cycle'], true, v_user_id),

    ('e2100000-0000-0000-0000-000000000005',
     'Total Solar Eclipse — August 2027', 'forecast',
     'Total solar eclipse visible across Middle East and South Asia. Eclipse path activates sensitive degrees in charts of Israel, Iran, and India.',
     '2027-08-02', 'Middle East / South Asia', null,
     '{"saros_series": "136", "path": "Morocco → Egypt → Saudi Arabia → India", "activated_charts": ["Israel natal Sun area", "India natal Moon within 3 degrees"]}'::jsonb,
     true, 'high', null, 'NASA Eclipse Portal', ARRAY['eclipse', 'solar', 'middle_east', 'india'], true, v_user_id),

    ('e2100000-0000-0000-0000-000000000006',
     'Saturn enters Aries 2025', 'historical',
     'Saturn ingresses into Aries — begins a 2.5-year transit affecting leadership, conflict, and identity for Aries-heavy national charts.',
     '2025-05-24', 'Global', null,
     '{"key_transits": ["Saturn 0° Aries", "Activates Libra axis countries"], "last_occurrence": "1996–1999"}'::jsonb,
     false, null, true, 'Swiss Ephemeris', ARRAY['saturn', 'ingress', 'aries'], true, v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 5. MUNDANE ASTRO EVENTS (astronomical event calendar)
  -- =========================================================================
  INSERT INTO mundane_astro_events (id, title, event_type, planet_primary, planet_secondary, sign, event_datetime_utc, notes, is_verified)
  VALUES
    ('ae100000-0000-0000-0000-000000000001',
     'Jupiter enters Gemini', 'ingress', 'Jupiter', null, 'Gemini',
     '2024-05-25 18:12:00+00', 'Jupiter crosses 0° Gemini. Boosts communication, trade, AI, media for 12 months.', true),

    ('ae100000-0000-0000-0000-000000000002',
     'Saturn enters Aries', 'ingress', 'Saturn', null, 'Aries',
     '2025-05-24 09:02:00+00', 'Saturn leaves Pisces, enters Aries. Structured discipline meets assertive beginnings. Leadership stress.', true),

    ('ae100000-0000-0000-0000-000000000003',
     'Total Solar Eclipse — Aries', 'eclipse', 'Sun', null, 'Aries',
     '2024-04-08 18:18:00+00', 'Total solar eclipse at 19°24'' Aries. Saros 139. Path across North America.', true),

    ('ae100000-0000-0000-0000-000000000004',
     'Annular Solar Eclipse — Libra', 'eclipse', 'Sun', null, 'Libra',
     '2024-10-02 18:46:00+00', 'Annular eclipse at 10°04'' Libra. Visible from South America.', true),

    ('ae100000-0000-0000-0000-000000000005',
     'Pluto direct station — Aquarius', 'station', 'Pluto', null, 'Aquarius',
     '2024-10-11 22:34:00+00', 'Pluto turns direct at 29°38'' Capricorn after retrograde. Final Capricorn station before full Aquarius ingress.', true),

    ('ae100000-0000-0000-0000-000000000006',
     'Jupiter–Uranus Conjunction', 'conjunction', 'Jupiter', 'Uranus', 'Taurus',
     '2024-04-20 17:27:00+00', 'Jupiter conjunct Uranus at 21°49'' Taurus. Major economic breakthrough / disruption cycle. Last occurrence 2011.', true),

    ('ae100000-0000-0000-0000-000000000007',
     'Jupiter enters Cancer', 'ingress', 'Jupiter', null, 'Cancer',
     '2025-06-09 06:02:00+00', 'Jupiter in Cancer — exaltation. Expansion of home, family, food, real estate, national sentiment globally.', true),

    ('ae100000-0000-0000-0000-000000000008',
     'Saturn Retrograde — Aries', 'retrograde', 'Saturn', null, 'Aries',
     '2025-07-13 04:43:00+00', 'Saturn stations retrograde at 4°41'' Aries. Re-examines new structures and leadership decisions begun at ingress.', true),

    ('ae100000-0000-0000-0000-000000000009',
     'Total Solar Eclipse — Virgo 2026', 'eclipse', 'Sun', null, 'Virgo',
     '2026-08-12 17:47:00+00', 'Total solar eclipse at 19°52'' Virgo. Saros 126. Major path through Russia, Central Asia, China.', true),

    ('ae100000-0000-0000-0000-000000000010',
     'Total Solar Eclipse — Aquarius 2027', 'eclipse', 'Sun', null, 'Aquarius',
     '2027-02-06 16:00:00+00', 'Annular eclipse at 17°42'' Aquarius. South America path.', true),

    ('ae100000-0000-0000-0000-000000000011',
     'Total Solar Eclipse — Leo 2027', 'eclipse', 'Sun', null, 'Leo',
     '2027-08-02 10:07:00+00', 'Total solar eclipse at 9°32'' Leo. Path across Middle East and South Asia. High activation for conflict-zone charts.', true),

    ('ae100000-0000-0000-0000-000000000012',
     'Neptune enters Aries', 'ingress', 'Neptune', null, 'Aries',
     '2025-03-30 11:53:00+00', 'Neptune ingresses into Aries for the first time since 1861–1875. Dissolution of old identity structures, spiritual nationalism.', true),

    ('ae100000-0000-0000-0000-000000000013',
     'Uranus enters Gemini', 'ingress', 'Uranus', null, 'Gemini',
     '2025-07-07 01:20:00+00', 'Uranus enters Gemini. Revolutionary changes in communication, AI, transportation, information flow. Last: 1941–1949 (WW2 era).', true)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 6. MUNDANE FORECASTS
  -- =========================================================================
  INSERT INTO mundane_forecasts (id, title, entity_id, forecast_type, forecast_period_start, forecast_period_end,
    content, astrology_basis, narrative_summary, event_categories, confidence_level, signal_strength,
    outcome_status, is_public, is_published, created_by)
  VALUES
    (v_fc1,
     'US Political Volatility Window — Late 2025',
     v_usa, 'political', '2025-09-01', '2025-12-31',
     'Saturn in Aries squares the US natal Sun in Cancer (Sibly chart). Simultaneously, Uranus in Gemini opposes US natal Sagittarius placements. This window carries significant constitutional and institutional stress — leadership authority is challenged, public anger intensifies. Historical analog: 1930–1932 (Saturn last square, Great Depression political crisis).',
     'Saturn square US natal Sun (Cancer 13°); Uranus opposing US Sagittarius stellium; Nodal axis activating US natal Neptune.',
     'High institutional stress. Expect significant political confrontations, legal challenges to executive authority, and public unrest events in this window.',
     ARRAY['political', 'constitutional', 'elections'],
     'high', 'high', 'open', true, true, v_user_id),

    (v_fc2,
     'India–China Tensions Escalation Risk Q3 2025',
     v_ind, 'political', '2025-07-01', '2025-09-30',
     'Mars transiting Virgo will activate the India–China composite stress axis in July 2025. Saturn''s retrograde in Aries squares both national charts in the same window. Eclipses of 2025 activate sensitive degrees in both charts simultaneously — a dangerous configuration not seen since the 1962 border war period.',
     'Mars conjunct India natal Mercury; Saturn square India natal Mars; Eclipse axis activating China PRC chart ASC/DSC.',
     'Elevated risk of border tension, diplomatic breakdown, or military posturing between India and China in this window.',
     ARRAY['conflict', 'diplomatic', 'political'],
     'medium', 'high', 'open', true, true, v_user_id),

    (v_fc3,
     'European Economic Stress — Saturn Ingress Impact 2025',
     v_eur, 'economic', '2025-05-01', '2025-12-31',
     'Saturn entering Aries in May 2025 opposes the EU natal chart''s Libra stellium (Maastricht chart). This initiates a 2-year contraction and restructuring phase for European institutions. Austerity pressures return. Southern European members under greatest strain. Jupiter in Cancer from June partially offsets with food/agricultural sector strength.',
     'Saturn in Aries opposite EU natal Libra stellium; Neptune in Aries square EU natal Pluto; Jupiter exaltation in Cancer supports agriculture.',
     'Expect institutional reform demands, economic contraction signals, and political pressure on the EU''s foundational agreements throughout 2025.',
     ARRAY['economic', 'institutional'],
     'high', 'medium', 'open', true, true, v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 7. MUNDANE RESEARCH PROJECTS
  -- =========================================================================
  INSERT INTO mundane_research_projects (id, title, description, project_type, status, entity_ids, leader_ids, is_public, created_by)
  VALUES
    (v_rp1,
     '2025–2026 Eclipse Activation Study',
     'Tracking all solar and lunar eclipses from 2025–2027 against major national charts. Focus on Middle East, South Asia, and North America. Recording which eclipse degrees hit sensitive natal points and correlating with actual events.',
     'country_forecast', 'active',
     ARRAY[v_usa, v_ind, v_isr, v_uk],
     ARRAY[v_l2, v_l3],
     true, v_user_id),

    (v_rp2,
     'Pluto in Aquarius — 20-Year Cycle Analysis',
     'Comprehensive study of the Pluto-in-Aquarius transit (2023–2044). Comparing with previous Aquarius cycle (1778–1798: American Revolution, French Revolution, Industrial beginning). Tracking AI governance, social contract ruptures, technological power shifts.',
     'retrospective', 'active',
     ARRAY[v_usa, v_uk, v_eur, v_chn],
     ARRAY[]::UUID[],
     true, v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 8. RESEARCH PROJECT NOTES
  -- =========================================================================
  INSERT INTO mundane_project_notes (id, project_id, title, body, note_type, created_by)
  VALUES
    ('b2100000-0000-0000-0000-000000000001',
     v_rp1,
     'April 2024 Eclipse — North America Path',
     'The 8 April 2024 total solar eclipse at 19°24'' Aries crossed directly over several US Midwest cities. The Sibly chart has natal Chiron at 20° Aries. Historical pattern: eclipses within 2 degrees of natal Chiron in a national chart correlate with healthcare crises or collective wound events within 6 months. Noting for outcome verification.',
     'observation', v_user_id),

    ('b2100000-0000-0000-0000-000000000002',
     v_rp1,
     'Hypothesis: 2027 Leo Eclipse activates Israel chart',
     'The August 2027 total solar eclipse at 9°32'' Leo falls within 3 degrees of Israel''s natal Sun (derived from the 14 May 1948, 16:00 Tel Aviv chart). Historical analog: the 1999 total solar eclipse at 18° Leo coincided with heightened regional tension within 9 months. This 2027 activation warrants close monitoring from 2026 onward.',
     'hypothesis', v_user_id),

    ('b2100000-0000-0000-0000-000000000003',
     v_rp2,
     'Pluto Aquarius vs. 1778–1798 Comparison',
     'In the previous Pluto-in-Aquarius transit: 1776 — American Declaration of Independence; 1789 — French Revolution; 1793 — Reign of Terror; 1799 — Napoleon seizes power. Current parallel themes: 2024 — AI governance debates; 2024–2025 — democratic backsliding across multiple states; 2025 — Uranus in Gemini supercharges information disruption. The speed of change appears compressed vs. the 18th century cycle.',
     'conclusion', v_user_id)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Mundane seed data applied successfully for user %', v_user_id;

END $$;
