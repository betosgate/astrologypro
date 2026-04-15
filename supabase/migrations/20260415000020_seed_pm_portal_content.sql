-- Seed PM community portal content for all empty/thin pages
-- Tables seeded: sunday_service_sessions, broadcasting, holy_books,
--                doctrine_links, calendar_events (refresh with future-dated rows),
--                ingress_charts (sample published charts)

-- ─── 1. Sunday Service sessions ──────────────────────────────────────────────
-- Archive (past recordings) + one upcoming live session

INSERT INTO sunday_service_sessions (id, title, description, video_url, thumbnail_url, recorded_at, is_live, live_starts_at, book_name, created_at, updated_at)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'The Opening of the Eye — Leo Season Service',
    'In this Sunday Service, Eddie Paredes walks the community through the spiritual significance of Leo Season and what the Lion''s energy means for our collective path. We explore the Sun''s exaltation, the creative fire of the 5th house, and the call to lead with the heart. Sacred reading from the Book of Light.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    NULL,
    NOW() - INTERVAL '28 days',
    false,
    NULL,
    'The Book of Light',
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Saturn''s Lessons — Karmic Wisdom for the Community',
    'Saturn, the great teacher, speaks through structure, discipline, and necessary limitation. This service explores Saturn''s transit through Pisces and how it challenges each of us to build spiritual integrity. Includes a communal prayer, planetary invocation, and reading from the Sacred Decans of Aquarius.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    NULL,
    NOW() - INTERVAL '21 days',
    false,
    NULL,
    'The Sacred Decans',
    NOW() - INTERVAL '21 days',
    NOW() - INTERVAL '21 days'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Full Moon in Capricorn — Releasing What No Longer Serves',
    'The Capricorn Full Moon illuminates our relationship with achievement, ambition, and the systems we have built around our identity. This service is a guided release ceremony, helping members surrender what the ego has held too tightly. We close with a communal blessing and affirmation of abundance.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    NULL,
    NOW() - INTERVAL '14 days',
    false,
    NULL,
    'Book of Cosmic Cycles',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days'
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Virgo Season Gateway — Precision, Devotion, and Sacred Service',
    'Virgo season calls us into devotion and right-relationship with the details of our lives. Eddie explores the 6th house archetypes — health, ritual, service, and the sacred in the mundane. We read from the Hermetic texts on Mercury and discuss the role of the analyst-healer in our community.',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    NULL,
    NOW() - INTERVAL '7 days',
    false,
    NULL,
    'Hermetic Wisdom Vol. 1',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'Live Sunday Service — The Libra Ingress',
    'Join us live this Sunday as we enter Libra Season. We will open with a communal invocation to Venus, explore the themes of harmony, justice, and right relationship, and examine what the Libra ingress chart reveals about the weeks ahead. Members are encouraged to have a candle lit and a cup of water nearby.',
    '',
    NULL,
    NOW() + INTERVAL '4 days',
    true,
    NOW() + INTERVAL '4 days',
    'The Book of Venus',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Broadcasts ────────────────────────────────────────────────────────────
-- Live Now, Upcoming, and On Demand entries for the Broadcasts & Live Events page

INSERT INTO broadcasting (id, title, short_description, description, status, priority, created_at, updated_at)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'Monthly Member Update — Cosmic Weather Briefing',
    'A monthly briefing on the major planetary transits and what they mean for Perennial Mandalism members this month.',
    'Join Eddie Paredes live for the monthly cosmic weather report. We cover every major planetary transit happening this month, what they mean collectively, and how to work with the energy consciously. Q&A is open in the last 15 minutes. All members are welcome regardless of astrology knowledge level.',
    'active',
    1,
    NOW(),
    NOW()
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'New Moon in Libra — Intention Setting Ceremony',
    'A guided community ceremony for the New Moon in Libra. Set your intentions for balance, beauty, and right relationship.',
    'Every New Moon, we gather as a community to set our intentions in alignment with the lunar cycle. This month, the New Moon falls in Libra — the sign of harmony, partnership, justice, and the arts. We will open with a Venus invocation, guide you through a written intention exercise, and close with a group blessing. Have your journal and a pen ready.',
    'active',
    2,
    NOW(),
    NOW()
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Replay: The Decans of Aries — Deep Study',
    'A recorded deep-dive into the three decans of Aries, their ruling planets, mythological figures, and tarot correspondences.',
    'This is a recorded replay of our deep study session on the three decans of Aries. Eddie walks through Aries I (Mars, ruled by the 2 of Wands), Aries II (Sun, the 3 of Wands), and Aries III (Venus, the 4 of Wands). We examine each decan''s traditional daemon, tarot card, and how these energies show up in natal charts and in the world.',
    'active',
    3,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    'Replay: Introduction to Mundane Astrology',
    'Learn how to apply astrology to world events — nations, markets, and collective cycles. A beginner-friendly introduction.',
    'Mundane astrology is the study of astrology as it applies to the world at large — nations, economies, natural disasters, political cycles, and collective consciousness. This replay is an introductory session for members who are new to mundane practice. We cover what natal charts for nations look like, how to read an ingress chart, and what major planetary transits have historically signaled.',
    'active',
    4,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    'Replay: Ritual for the Jupiter–Saturn Cycle',
    'A guided ritual for navigating the 20-year Jupiter–Saturn cycle and understanding where we are in the great social-political reset.',
    'Jupiter and Saturn meet in conjunction every 20 years, marking the beginning of a new social and cultural era. This recorded ritual and teaching helps members understand what the current Jupiter–Saturn cycle means for society and for their personal lives. The ritual includes a Jupiter invocation, a Saturn boundary-setting ceremony, and a closing meditation for long-term vision.',
    'active',
    5,
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '35 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Holy Books ────────────────────────────────────────────────────────────
-- Sacred texts available in the Library page under Holy Books section

INSERT INTO holy_books (id, title, description, cover_image_url, file_url, sort_order, is_active, created_at, updated_at)
VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'The Book of Light — Foundational Teachings of the School',
    'The core foundational text of the School of Our Divine Infinite Being. This book covers the school''s philosophy, the nature of the divine, the structure of the cosmos, and the role of each soul in the unfolding of creation. Required reading for all Perennial Mandalism members.',
    NULL,
    NULL,
    1,
    true,
    NOW(),
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'The Sacred Decans — A Study of the 36 Houses of Heaven',
    'A comprehensive guide to the 36 decans of the zodiac, their ruling spirits, mythological correspondences, tarot connections, and practical applications in chart reading and ritual work. The central curriculum text of the Mystery School.',
    NULL,
    NULL,
    2,
    true,
    NOW(),
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Book of Cosmic Cycles — Planetary Rhythms and Sacred Time',
    'An exploration of the major planetary cycles — Jupiter–Saturn, Saturn return, nodal cycles, and the outer planet transits — and how they create the rhythm of individual and collective evolution. Includes seasonal ceremonies aligned to each major cycle.',
    NULL,
    NULL,
    3,
    true,
    NOW(),
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Hermetic Wisdom Volume I — The Seven Principles',
    'An introduction to the seven Hermetic principles that underlie Western esoteric philosophy: Mentalism, Correspondence, Vibration, Polarity, Rhythm, Cause and Effect, and Gender. Each principle is explored through an astrological lens and applied to daily spiritual practice.',
    NULL,
    NULL,
    4,
    true,
    NOW(),
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'The Book of Venus — Love, Beauty, and Sacred Relationship',
    'A spiritual study of Venus — her mythology, her cycle, her role in the natal chart, and her expression through the decans she rules. Includes rituals for attracting love, healing relational wounds, and cultivating beauty as a spiritual practice.',
    NULL,
    NULL,
    5,
    true,
    NOW(),
    NOW()
  ),
  (
    'c1000000-0000-0000-0000-000000000006',
    'Alchemy of the Soul — Transformation Through the Elements',
    'A deep study of Fire, Earth, Air, and Water as spiritual forces — how they manifest in the natal chart, in seasonal cycles, and in personal transformation. Includes elemental meditations, rituals, and exercises for bringing the four elements into balance.',
    NULL,
    NULL,
    6,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 4. Doctrine Links ────────────────────────────────────────────────────────
-- External resource links for the Library's Doctrine & Creed section

INSERT INTO doctrine_links (id, label, description, url, link_type, icon, sort_order, is_active, created_at, updated_at)
VALUES
  (
    'd1000000-0000-0000-0000-000000000001',
    'The Hermetic Order — Official Teaching Archive',
    'The primary online archive for Hermetic texts, commentaries, and lecture recordings aligned with the Western esoteric tradition.',
    'https://www.sacred-texts.com/eso/',
    'external',
    'scroll',
    1,
    true,
    NOW(),
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'Astrology King — Planetary Transit Reference',
    'A comprehensive reference for understanding current and upcoming planetary transits, with detailed interpretations for every major aspect.',
    'https://astrologyking.com',
    'external',
    'star',
    2,
    true,
    NOW(),
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000003',
    'The Tarot Heritage — Historical Card Meanings',
    'An academic resource exploring the historical origins of tarot cards, their symbolism, and their connection to Western esoteric philosophy and the Kabbalah.',
    'https://www.tarot-heritage.com',
    'external',
    'layers',
    3,
    true,
    NOW(),
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000004',
    'School Reading List — Recommended Books',
    'The official recommended reading list for Perennial Mandalism and Mystery School students, curated by Eddie Paredes.',
    'https://astrologypro.com/resources/reading-list',
    'internal',
    'book-open',
    4,
    true,
    NOW(),
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000005',
    'Swiss Ephemeris — Planetary Position Data',
    'The gold-standard ephemeris data source used by professional astrologers worldwide. Look up planetary positions for any date in history.',
    'https://www.astro.com/swisseph/',
    'external',
    'orbit',
    5,
    true,
    NOW(),
    NOW()
  ),
  (
    'd1000000-0000-0000-0000-000000000006',
    'The Egyptian Decans — Historical Sources',
    'A scholarly compilation of historical sources on the Egyptian decan system, including the Nut ceiling at Dendera, the Rhind Mathematical Papyrus, and classical references to the 36 decans.',
    'https://www.sacred-texts.com/egy/',
    'external',
    'eye',
    6,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 5. Calendar Events (refresh with future-dated events) ───────────────────
-- Wipe the old single past-dated event and insert a set of upcoming + past events
-- display_for values seen in page code: 'members', 'all'

DELETE FROM calendar_events
WHERE id = 'ce000000-0000-0000-0000-000000000001';

INSERT INTO calendar_events (id, title, description, category, start_at, end_at, display_for, priority, is_active, created_at, updated_at)
VALUES
  -- Upcoming events (visible in the "Upcoming Events" and "Events" pages)
  (
    'ce000000-0000-0000-0000-000000000010',
    'Sunday Service — The Libra Ingress',
    'Our weekly gathering to mark the Sun''s entry into Libra. We will explore the Libra archetype, the Venus-ruled signs, and what this season means for our personal and collective path. All members welcome. Have a candle and journal ready.',
    'sunday_service',
    NOW() + INTERVAL '4 days',
    NOW() + INTERVAL '4 days' + INTERVAL '2 hours',
    'members',
    1,
    true,
    NOW(),
    NOW()
  ),
  (
    'ce000000-0000-0000-0000-000000000011',
    'New Moon in Libra — Intention Ceremony',
    'A communal New Moon intention-setting ceremony for the community. We will open with a Venus invocation and guide each member through a written intention exercise for balance, beauty, and right relationship. Have your journal and a pen ready.',
    'ceremony',
    NOW() + INTERVAL '8 days',
    NOW() + INTERVAL '8 days' + INTERVAL '90 minutes',
    'members',
    2,
    true,
    NOW(),
    NOW()
  ),
  (
    'ce000000-0000-0000-0000-000000000012',
    'Monthly Member Q&A with Eddie Paredes',
    'An open Q&A session with the Head Master. Members can submit questions about their charts, their decan studies, or the teachings. Questions are addressed live. Attendance is limited — register early.',
    'workshop',
    NOW() + INTERVAL '12 days',
    NOW() + INTERVAL '12 days' + INTERVAL '75 minutes',
    'members',
    3,
    true,
    NOW(),
    NOW()
  ),
  (
    'ce000000-0000-0000-0000-000000000013',
    'Sunday Service — Navigating the Outer Planet Transits',
    'This week''s service focuses on the slow-moving outer planets — Uranus, Neptune, and Pluto — and the long-term generational shifts they signal. A special focus on what Pluto in Aquarius means for the next 20 years.',
    'sunday_service',
    NOW() + INTERVAL '11 days',
    NOW() + INTERVAL '11 days' + INTERVAL '2 hours',
    'members',
    4,
    true,
    NOW(),
    NOW()
  ),
  (
    'ce000000-0000-0000-0000-000000000014',
    'Full Moon Ceremony in Aries — Releasing the Old Self',
    'The Aries Full Moon calls us to release what has been holding us back from courageous action. This ceremony includes a fire-elemental ritual, a Mars invocation, and a communal declaration of intention for the months ahead.',
    'ceremony',
    NOW() + INTERVAL '22 days',
    NOW() + INTERVAL '22 days' + INTERVAL '90 minutes',
    'members',
    5,
    true,
    NOW(),
    NOW()
  ),
  (
    'ce000000-0000-0000-0000-000000000015',
    'Decan Study Group — Libra Decans I, II, III',
    'A group study session focused on the three decans of Libra: Libra I (Moon, the 2 of Swords), Libra II (Saturn, the 3 of Swords), and Libra III (Jupiter, the 4 of Swords). We examine their symbolism, mythological figures, and chart applications.',
    'workshop',
    NOW() + INTERVAL '18 days',
    NOW() + INTERVAL '18 days' + INTERVAL '90 minutes',
    'members',
    6,
    true,
    NOW(),
    NOW()
  ),
  -- Past events (show in "Past Sessions" section)
  (
    'ce000000-0000-0000-0000-000000000020',
    'Sunday Service — Leo Season Opening',
    'We marked the beginning of Leo Season with a Sun invocation, a reading from the Book of Light on the creative fire of the 5th house, and a community sharing of intentions for creative self-expression.',
    'sunday_service',
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days' + INTERVAL '2 hours',
    'members',
    10,
    true,
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days'
  ),
  (
    'ce000000-0000-0000-0000-000000000021',
    'Virgo New Moon — Purification Ceremony',
    'The Virgo New Moon ceremony focused on purification, sacred service, and the refinement of daily routine. Members performed a cleansing ritual and set intentions for health, order, and devotion.',
    'ceremony',
    NOW() - INTERVAL '21 days',
    NOW() - INTERVAL '21 days' + INTERVAL '90 minutes',
    'members',
    11,
    true,
    NOW() - INTERVAL '21 days',
    NOW() - INTERVAL '21 days'
  ),
  (
    'ce000000-0000-0000-0000-000000000022',
    'Monthly Orientation — Welcome New Members',
    'The monthly orientation session for new Perennial Mandalism members joining the community. Covers the school philosophy, how to navigate the portal, and what to expect in the first month of membership.',
    'orientation',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days' + INTERVAL '60 minutes',
    'members',
    12,
    true,
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ─── 6. Ingress Charts (sample published charts for Community Ingress page) ──

INSERT INTO ingress_charts (
  id, title, ingress_type, importance, short_description, effective_time_period,
  event_time_period, event_timestamp, validity_start, validity_end,
  location_name, location_lat, location_lon, location_timezone,
  system_interpretation, chart_data, sector_analysis, tags, sector_focus,
  is_social_advo, is_published, author_name, author_email, created_at, updated_at
)
VALUES
  (
    '10af8ce3-31fb-4fbb-8467-01476f9b9b1f',
    'Sun Ingress Libra 2026',
    'solar_ingress',
    'high',
    'The Sun enters Libra marking the Autumnal Equinox. A chart for balance, justice, and relationship themes for the season ahead.',
    'September 22 – October 23, 2026',
    'September 22, 2026 at 09:05 UTC',
    NOW() + INTERVAL '5 days',
    (NOW() + INTERVAL '5 days')::date,
    (NOW() + INTERVAL '35 days')::date,
    'Washington, D.C., USA',
    38.9072,
    -77.0369,
    'America/New_York',
    '{"summary": "The Libra ingress chart shows the Moon in Capricorn applying to Saturn — a serious tone for the season with emphasis on structural reform and institutional accountability. Venus, dignified as ruler of the chart, is in Scorpio, suggesting that beneath the surface of diplomatic relations lies intense negotiation and hidden agendas.", "theme": "Balance, Diplomacy, Reform"}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    ARRAY['solar_ingress', 'libra', 'autumn', 'equinox'],
    ARRAY['politics', 'diplomacy', 'economy'],
    false,
    true,
    'Eddie Paredes',
    'eddie@astrologypro.com',
    NOW(),
    NOW()
  ),
  (
    '208c4a12-6237-4168-b5c0-889a5bd1cb77',
    'Saturn Ingress Aries 2026',
    'planetary_ingress',
    'critical',
    'Saturn enters Aries for the first time since 1999 — a generational shift bringing major structural changes to identity, leadership, and pioneering action.',
    'May 2026 – April 2028',
    'May 2026',
    NOW() - INTERVAL '60 days',
    (NOW() - INTERVAL '60 days')::date,
    (NOW() + INTERVAL '700 days')::date,
    'Global',
    0.0,
    0.0,
    'UTC',
    '{"summary": "Saturn in Aries brings a 2.5-year period of testing initiative, courage, and the structures built around individual agency. The last time Saturn transited Aries (1996–1999) saw major geopolitical restructuring, the rise of internet-era competition, and a re-evaluation of masculine identity. This transit will challenge all areas associated with Mars — military structures, sports, entrepreneurship, and pioneering leadership.", "theme": "Discipline, Initiative, Structural Courage"}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    ARRAY['saturn', 'aries', 'planetary_ingress', 'generational'],
    ARRAY['politics', 'military', 'business', 'culture'],
    false,
    true,
    'Eddie Paredes',
    'eddie@astrologypro.com',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),
  (
    '2ca901c7-6cb9-4015-b8ea-201efac333ad',
    'Mercury Ingress Scorpio 2026',
    'planetary_ingress',
    'moderate',
    'Mercury enters Scorpio bringing deep, investigative communication — secrets surface, research deepens, and psychological honesty is demanded.',
    'October 8 – October 29, 2026',
    'October 8, 2026',
    NOW() + INTERVAL '20 days',
    (NOW() + INTERVAL '20 days')::date,
    (NOW() + INTERVAL '41 days')::date,
    'Global',
    0.0,
    0.0,
    'UTC',
    '{"summary": "Mercury in Scorpio sharpens the mind toward investigation, psychology, and hidden truths. Communication becomes more strategic and less surface-level. This is an excellent period for research, therapy, contract negotiation, and uncovering information that was previously hidden. Watch for intensity in public discourse and revelations in media.", "theme": "Investigation, Depth, Psychological Clarity"}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    ARRAY['mercury', 'scorpio', 'planetary_ingress'],
    ARRAY['media', 'psychology', 'finance', 'communications'],
    false,
    true,
    'Eddie Paredes',
    'eddie@astrologypro.com',
    NOW(),
    NOW()
  ),
  (
    '109dd041-1e89-4545-8236-e93ba8fc2230',
    'Venus Ingress Scorpio 2026',
    'planetary_ingress',
    'moderate',
    'Venus enters Scorpio bringing intense, transformative themes in love, beauty, and finance. Depth over surface, loyalty over charm.',
    'October 13 – November 7, 2026',
    'October 13, 2026',
    NOW() + INTERVAL '25 days',
    (NOW() + INTERVAL '25 days')::date,
    (NOW() + INTERVAL '48 days')::date,
    'Global',
    0.0,
    0.0,
    'UTC',
    '{"summary": "Venus in Scorpio intensifies all matters of the heart, finances, and shared resources. Relationships are tested for depth and loyalty — superficiality falls away. Financial markets may show volatility as hidden information surfaces. Art and culture take on darker, more psychological themes.", "theme": "Depth, Transformation, Loyalty"}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    ARRAY['venus', 'scorpio', 'planetary_ingress'],
    ARRAY['relationships', 'finance', 'culture', 'art'],
    false,
    true,
    'Eddie Paredes',
    'eddie@astrologypro.com',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
