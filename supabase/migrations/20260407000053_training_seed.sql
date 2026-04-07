-- Migration: Seed training programs, categories, lessons, quizzes, and quiz_questions
-- Uses ON CONFLICT DO NOTHING throughout; safe to re-run

-- ═══════════════════════════════════════════════════════════════
-- PROGRAM 1: Foundations of Astrology
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_prog1       UUID;
  v_cat1_1      UUID;
  v_cat1_2      UUID;
  v_cat1_3      UUID;
  v_lesson1_1_1 UUID;
  v_lesson1_1_2 UUID;
  v_lesson1_1_3 UUID;
  v_lesson1_1_4 UUID;
  v_lesson1_2_1 UUID;
  v_lesson1_2_2 UUID;
  v_lesson1_2_3 UUID;
  v_lesson1_3_1 UUID;
  v_lesson1_3_2 UUID;
  v_lesson1_3_3 UUID;
BEGIN

  -- ── Program ──────────────────────────────────────────────────
  INSERT INTO training_programs (name, description, priority, is_active)
  VALUES (
    'Foundations of Astrology',
    'A comprehensive introduction to the language of astrology — from the birth chart and planets to transits and progressions. Ideal for beginners building a solid interpretive foundation.',
    1, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_prog1;

  IF v_prog1 IS NULL THEN
    SELECT id INTO v_prog1 FROM training_programs WHERE name = 'Foundations of Astrology';
  END IF;

  -- ── Category 1: Introduction to the Birth Chart ───────────────
  INSERT INTO training_categories (name, description, priority, is_active, training_id)
  VALUES ('Introduction to the Birth Chart',
    'Learn the fundamental building blocks of natal astrology: the chart wheel, its planets, signs, and houses, and how they combine to form a complete symbolic picture of a person.',
    1, true, v_prog1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat1_1;

  IF v_cat1_1 IS NULL THEN
    SELECT id INTO v_cat1_1 FROM training_categories
    WHERE name = 'Introduction to the Birth Chart' AND training_id = v_prog1;
  END IF;

  -- Lesson 1-1-1
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_1,
    'What is a Birth Chart?',
    'An orientation to the natal horoscope — what it is, what it shows, and how to begin reading it.',
    'https://placeholder.astrologypro.com/videos/lesson-what-is-a-birth-chart.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-what-is-a-birth-chart.pdf',
    E'## What is a Birth Chart?\n\nA birth chart — also called a natal chart or horoscope — is a circular map of the sky at the exact moment and location of your birth. It is not a prediction but a symbolic portrait: a language of archetypes that describes the energies, tendencies, and potentials you arrived with.\n\nThe chart is divided into **twelve houses**, each governing a domain of life such as identity, resources, communication, or career. Across these houses move the **ten classical planets** (including the Sun and Moon), each representing a distinct psychological function — will, emotion, intellect, love, drive, and more.\n\nThe **zodiac signs** colour how each planet expresses itself, much like a costume shapes a character''s manner. Mars in Aries acts differently from Mars in Libra, even though both represent drive and action.\n\nFinally, the **aspects** — angular relationships between planets — reveal how these energies cooperate, challenge, or amplify one another.\n\nTogether, planets, signs, houses, and aspects form a living symbolic system. Reading a chart is an act of synthesis: holding many parts in mind at once and letting a coherent picture emerge. This course will teach you to do exactly that, one layer at a time.',
    15, 1, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_1_1;

  IF v_lesson1_1_1 IS NULL THEN
    SELECT id INTO v_lesson1_1_1 FROM training_lessons
    WHERE title = 'What is a Birth Chart?' AND category_id = v_cat1_1;
  END IF;

  -- Lesson 1-1-2
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_1,
    'The Planets and Their Meanings',
    'A tour of the ten astrological planets — from the Sun to Pluto — and the psychological functions each one represents.',
    'https://placeholder.astrologypro.com/videos/lesson-the-planets-and-their-meanings.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-the-planets-and-their-meanings.pdf',
    E'## The Planets and Their Meanings\n\nIn astrology, the word *planet* includes the Sun and Moon alongside the classical and outer planets. Each body symbolises a specific psychological drive or function operating within the psyche.\n\n**The Sun** — core identity, conscious will, the self we are becoming. **The Moon** — emotional body, instincts, memory, and the need for safety. **Mercury** — mind, language, perception, and the way we process information. **Venus** — values, pleasure, beauty, and relational style. **Mars** — drive, desire, assertion, and how we take action.\n\n**Jupiter** — expansion, wisdom, faith, and the search for meaning. **Saturn** — structure, discipline, limitation, and the lessons earned through effort. **Uranus** — disruption, innovation, liberation, and sudden change. **Neptune** — dissolution, imagination, spiritual longing, and the transcendence of boundaries. **Pluto** — transformation, power, depth, and the death-rebirth cycle.\n\nWhen reading a chart, always ask: *what is this planet''s job, and how is it expressing that job through the sign and house it occupies?* The planet is the *what*; the sign is the *how*; the house is the *where*. Mastering this three-layer question is the key to fluid interpretation.',
    20, 2, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_1_2;

  IF v_lesson1_1_2 IS NULL THEN
    SELECT id INTO v_lesson1_1_2 FROM training_lessons
    WHERE title = 'The Planets and Their Meanings' AND category_id = v_cat1_1;
  END IF;

  -- Lesson 1-1-3
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_1,
    'The 12 Zodiac Signs',
    'An archetype-by-archetype study of the twelve signs — their element, modality, ruling planet, keywords, and shadow expressions.',
    'https://placeholder.astrologypro.com/videos/lesson-the-12-zodiac-signs.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-the-12-zodiac-signs.pdf',
    E'## The 12 Zodiac Signs\n\nThe zodiac is a belt of twelve equal segments — each 30° of arc — through which the planets appear to move from Earth''s perspective. Each sign carries a distinct archetypal flavour shaped by its **element** (Fire, Earth, Air, Water) and **modality** (Cardinal, Fixed, Mutable).\n\n**Aries** (Cardinal Fire) — initiative, courage, impulse. **Taurus** (Fixed Earth) — patience, sensuality, steadiness. **Gemini** (Mutable Air) — curiosity, adaptability, communication. **Cancer** (Cardinal Water) — nurture, memory, emotional depth. **Leo** (Fixed Fire) — creativity, pride, warmth. **Virgo** (Mutable Earth) — analysis, discernment, service.\n\n**Libra** (Cardinal Air) — balance, beauty, relational harmony. **Scorpio** (Fixed Water) — intensity, transformation, depth. **Sagittarius** (Mutable Fire) — philosophy, adventure, expansion. **Capricorn** (Cardinal Earth) — ambition, discipline, mastery. **Aquarius** (Fixed Air) — innovation, idealism, community. **Pisces** (Mutable Water) — compassion, imagination, dissolution.\n\nEvery sign has a gift and a shadow. Aries'' courage can become recklessness; Virgo''s discernment can curdle into criticism. Learning the full range of each archetype — not just its highest expression — gives your readings depth and compassion.',
    25, 3, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_1_3;

  IF v_lesson1_1_3 IS NULL THEN
    SELECT id INTO v_lesson1_1_3 FROM training_lessons
    WHERE title = 'The 12 Zodiac Signs' AND category_id = v_cat1_1;
  END IF;

  -- Lesson 1-1-4
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_1,
    'The 12 Houses',
    'An exploration of the twelve astrological houses — the domains of life experience they govern and how to interpret planets placed within them.',
    'https://placeholder.astrologypro.com/videos/lesson-the-12-houses.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-the-12-houses.pdf',
    E'## The 12 Houses\n\nIf the planets are *what* and the signs are *how*, the houses answer *where* — which area of life is activated. The twelve houses divide the birth chart into twelve domains of lived experience, beginning with the **Ascendant** on the eastern horizon.\n\n**1st House** — self, body, first impressions. **2nd** — resources, values, material security. **3rd** — communication, siblings, local movement. **4th** — home, roots, the private self. **5th** — creativity, romance, joy, children. **6th** — daily work, health, service routines.\n\n**7th House** — partnerships, marriage, open enemies. **8th** — shared resources, death, transformation, taboo. **9th** — philosophy, travel, higher education, belief. **10th** — career, public reputation, authority. **11th** — community, friendships, collective ideals. **12th** — the unconscious, solitude, hidden matters, spiritual retreat.\n\nA planet in a house focuses its energy on that life domain. Venus in the 7th shines in partnership; Saturn in the 2nd teaches hard lessons about material security. The **house cusps** — especially the four angular cusps (1st, 4th, 7th, 10th) — are particularly sensitive points, acting as thresholds where energy enters each quadrant of life.',
    20, 4, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_1_4;

  IF v_lesson1_1_4 IS NULL THEN
    SELECT id INTO v_lesson1_1_4 FROM training_lessons
    WHERE title = 'The 12 Houses' AND category_id = v_cat1_1;
  END IF;

  -- Quiz for Lesson 1-1-1 (birth chart basics)
  INSERT INTO training_quizzes (lesson_id, title, questions, pass_score, is_active)
  VALUES (
    v_lesson1_1_1,
    'Birth Chart Basics Quiz',
    '[
      {"question":"What does a birth chart represent?","options":[{"text":"A map of the sky at your moment of birth","correct":true},{"text":"A forecast of future events","correct":false},{"text":"A personality test based on sun signs","correct":false},{"text":"A fixed description of your destiny","correct":false}]},
      {"question":"Which three layers combine to describe a planet''s full expression?","options":[{"text":"Planet, sign, and house","correct":true},{"text":"Planet, element, and modality","correct":false},{"text":"Sign, aspect, and house","correct":false},{"text":"Ruler, decan, and degree","correct":false}]},
      {"question":"What do the twelve houses represent?","options":[{"text":"Domains of lived experience and life areas","correct":true},{"text":"The twelve months of the year","correct":false},{"text":"The twelve planets in the solar system","correct":false},{"text":"Twelve personality archetypes","correct":false}]},
      {"question":"What are aspects in a birth chart?","options":[{"text":"Angular relationships between planets","correct":true},{"text":"The signs on each house cusp","correct":false},{"text":"The speed at which planets move","correct":false},{"text":"The colour associations of each sign","correct":false}]},
      {"question":"Which point on the chart marks the eastern horizon at birth?","options":[{"text":"The Ascendant","correct":true},{"text":"The Midheaven","correct":false},{"text":"The Descendant","correct":false},{"text":"The IC","correct":false}]}
    ]'::jsonb,
    70, true
  )
  ON CONFLICT DO NOTHING;

  -- quiz_questions for Lesson 1-1-1
  INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority)
  VALUES
    (v_lesson1_1_1, 'What does a birth chart represent?',
     '["A map of the sky at your moment of birth","A forecast of future events","A personality test based on sun signs","A fixed description of your destiny"]'::jsonb,
     0, 'A birth chart is a snapshot of the sky — planets, signs, and houses — at the exact moment and location of birth. It is descriptive, not predictive.', 1),
    (v_lesson1_1_1, 'Which three layers combine to describe a planet''s full expression?',
     '["Planet, sign, and house","Planet, element, and modality","Sign, aspect, and house","Ruler, decan, and degree"]'::jsonb,
     0, 'The planet is the what (function), the sign is the how (style), and the house is the where (life domain). These three together form a complete interpretive statement.', 2),
    (v_lesson1_1_1, 'What do the twelve houses represent?',
     '["Domains of lived experience and life areas","The twelve months of the year","The twelve planets in the solar system","Twelve personality archetypes"]'::jsonb,
     0, 'Houses map the chart onto areas of everyday life — identity, resources, relationships, career, and so on.', 3),
    (v_lesson1_1_1, 'What are aspects in a birth chart?',
     '["Angular relationships between planets","The signs on each house cusp","The speed at which planets move","The colour associations of each sign"]'::jsonb,
     0, 'Aspects are measured angles between two planets (e.g., 90° = square, 120° = trine). They describe how two planetary energies interact.', 4),
    (v_lesson1_1_1, 'Which point on the chart marks the eastern horizon at birth?',
     '["The Ascendant","The Midheaven","The Descendant","The IC"]'::jsonb,
     0, 'The Ascendant (Rising Sign) is the degree of the zodiac rising on the eastern horizon at the moment of birth. It colours the outer personality and physical presence.', 5)
  ON CONFLICT DO NOTHING;

  -- Quiz for Lesson 1-1-3 (zodiac signs)
  INSERT INTO training_quizzes (lesson_id, title, questions, pass_score, is_active)
  VALUES (
    v_lesson1_1_3,
    'Zodiac Signs Quiz',
    '[
      {"question":"Which element is associated with Scorpio?","options":[{"text":"Water","correct":true},{"text":"Fire","correct":false},{"text":"Earth","correct":false},{"text":"Air","correct":false}]},
      {"question":"Which modality initiates a new season?","options":[{"text":"Cardinal","correct":true},{"text":"Fixed","correct":false},{"text":"Mutable","correct":false},{"text":"Angular","correct":false}]},
      {"question":"Taurus belongs to which element and modality combination?","options":[{"text":"Fixed Earth","correct":true},{"text":"Cardinal Earth","correct":false},{"text":"Mutable Earth","correct":false},{"text":"Fixed Water","correct":false}]},
      {"question":"Which sign is known for its focus on balance, beauty, and relational harmony?","options":[{"text":"Libra","correct":true},{"text":"Taurus","correct":false},{"text":"Pisces","correct":false},{"text":"Gemini","correct":false}]},
      {"question":"Mutable signs are associated with which phase of a season?","options":[{"text":"The end — transitions and change","correct":true},{"text":"The beginning — initiation","correct":false},{"text":"The middle — consolidation","correct":false},{"text":"The peak — maximum expression","correct":false}]}
    ]'::jsonb,
    70, true
  )
  ON CONFLICT DO NOTHING;

  -- quiz_questions for Lesson 1-1-3
  INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority)
  VALUES
    (v_lesson1_1_3, 'Which element is associated with Scorpio?',
     '["Water","Fire","Earth","Air"]'::jsonb,
     0, 'Scorpio is Fixed Water — emotionally intense, deeply feeling, and concerned with transformation and hidden depths.', 1),
    (v_lesson1_1_3, 'Which modality initiates a new season?',
     '["Cardinal","Fixed","Mutable","Angular"]'::jsonb,
     0, 'Cardinal signs (Aries, Cancer, Libra, Capricorn) begin each of the four seasons and carry an initiating, action-oriented quality.', 2),
    (v_lesson1_1_3, 'Taurus belongs to which element and modality combination?',
     '["Fixed Earth","Cardinal Earth","Mutable Earth","Fixed Water"]'::jsonb,
     0, 'Taurus is Fixed Earth — patient, sensual, steady, and resistant to change. It builds and holds form.', 3),
    (v_lesson1_1_3, 'Which sign is known for its focus on balance, beauty, and relational harmony?',
     '["Libra","Taurus","Pisces","Gemini"]'::jsonb,
     0, 'Libra (Cardinal Air) is the sign of the scales — seeking fairness, aesthetic harmony, and cooperative relationship.', 4),
    (v_lesson1_1_3, 'Mutable signs are associated with which phase of a season?',
     '["The end — transitions and change","The beginning — initiation","The middle — consolidation","The peak — maximum expression"]'::jsonb,
     0, 'Mutable signs (Gemini, Virgo, Sagittarius, Pisces) fall at the close of each season, carrying adaptability and the capacity to release.', 5)
  ON CONFLICT DO NOTHING;

  -- ── Category 2: Planetary Aspects ────────────────────────────
  INSERT INTO training_categories (name, description, priority, is_active, training_id)
  VALUES ('Planetary Aspects',
    'Understand how planets relate to each other through angular geometry — the major aspects, how to spot them in a chart, and the complex patterns they form.',
    2, true, v_prog1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat1_2;

  IF v_cat1_2 IS NULL THEN
    SELECT id INTO v_cat1_2 FROM training_categories
    WHERE name = 'Planetary Aspects' AND training_id = v_prog1;
  END IF;

  -- Lesson 1-2-1
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_2,
    'Major Aspects: Conjunction, Opposition, Trine, Square, Sextile',
    'A thorough study of the five major aspects — their degree values, orbs, and the quality of relationship each one creates between planets.',
    'https://placeholder.astrologypro.com/videos/lesson-major-aspects-conjunction-opposition-trine-square-sextile.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-major-aspects-conjunction-opposition-trine-square-sextile.pdf',
    E'## Major Aspects\n\nAspects are measured angles between two planets. The five major aspects each carry a distinct quality of relationship, ranging from unity to friction.\n\n**Conjunction (0°)** — planets occupy the same degree. Their energies merge and amplify each other; the effect is powerful but can be one-note, as the two functions become inseparable.\n\n**Opposition (180°)** — planets face each other across the chart axis. This aspect creates polarity, projection, and the call to integration. What we project onto others often lives in an opposition.\n\n**Trine (120°)** — planets share the same element. Energy flows easily; the two functions support and reinforce each other. Trines are gifts, though their ease can tip into complacency.\n\n**Square (90°)** — planets are 90° apart, often in incompatible elements. This is the aspect of friction, challenge, and action. Squares demand that two conflicting drives find a creative resolution — and they are among the most productive aspects in a chart.\n\n**Sextile (60°)** — planets are two signs apart, usually in compatible but different elements. Sextiles offer opportunities that require a little effort to activate — they do not land in your lap the way a trine might.\n\nEach aspect allows an **orb** — a tolerance for imprecision. Traditional orbs: conjunction/opposition (8°), trine/square (7°), sextile (5°). Tighter orbs are stronger.',
    30, 1, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_2_1;

  IF v_lesson1_2_1 IS NULL THEN
    SELECT id INTO v_lesson1_2_1 FROM training_lessons
    WHERE title = 'Major Aspects: Conjunction, Opposition, Trine, Square, Sextile' AND category_id = v_cat1_2;
  END IF;

  -- Lesson 1-2-2
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_2,
    'How to Read Aspects in a Chart',
    'A practical methodology for identifying, weighing, and interpreting aspects within a natal chart — from spotting the aspect grid to synthesising multiple contacts.',
    'https://placeholder.astrologypro.com/videos/lesson-how-to-read-aspects-in-a-chart.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-how-to-read-aspects-in-a-chart.pdf',
    E'## How to Read Aspects in a Chart\n\nReading aspects is a skill of prioritisation and synthesis. A typical birth chart contains dozens of measurable angles — your task is to identify the most important ones and interpret them in context.\n\n**Step 1 — Use the aspect grid.** Most chart software provides a grid showing every planetary pair and the aspect between them. Start here to get an inventory.\n\n**Step 2 — Prioritise by orb.** Tighter aspects carry more weight. An exact conjunction (0° orb) will dominate the chart experience; a sextile at 4° orb is a background texture.\n\n**Step 3 — Weight the planets involved.** Aspects to the Sun, Moon, Ascendant ruler, and chart ruler are more personally significant than aspects between slow outer planets.\n\n**Step 4 — Note the aspect type.** Is this a flowing trine or a pressurised square? A conjunction that fuses or an opposition that polarises?\n\n**Step 5 — Read the pair in context.** A Mars-Saturn square is not simply "blocked action" — it is an invitation to build disciplined drive. Always name both planets, both signs, both houses, and the aspect type together.\n\n**Step 6 — Synthesise.** Multiple planets aspecting the same point (e.g., a planet receiving both a trine and a square) describe a more complex lived experience. Let contradictions coexist rather than flattening them.',
    25, 2, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_2_2;

  IF v_lesson1_2_2 IS NULL THEN
    SELECT id INTO v_lesson1_2_2 FROM training_lessons
    WHERE title = 'How to Read Aspects in a Chart' AND category_id = v_cat1_2;
  END IF;

  -- Lesson 1-2-3
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_2,
    'Aspect Patterns: Grand Trine, T-Square, Yod',
    'An exploration of the major multi-planet configurations — what they look like in a chart, what they mean, and how to work with their concentrated energy.',
    'https://placeholder.astrologypro.com/videos/lesson-aspect-patterns-grand-trine-t-square-yod.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-aspect-patterns-grand-trine-t-square-yod.pdf',
    E'## Aspect Patterns\n\nWhen three or more planets form interlocking aspects, they create a recognisable geometric shape called an **aspect pattern**. These configurations concentrate energy and often define a person''s most prominent psychological themes.\n\n**Grand Trine** — three planets roughly 120° apart, forming an equilateral triangle within one element. This pattern creates a closed loop of easy, self-reinforcing energy. Grand Trines in Fire suggest natural creative flow; in Earth, material ease; in Air, intellectual fluency; in Water, emotional depth. The shadow is self-sufficiency that resists growth and challenge.\n\n**T-Square** — two planets in opposition with a third squaring both, forming a T-shape. The apex planet (at the corner of the T) bears the tension of the opposition and is the most stressed point in the pattern. T-Squares are engines of achievement — the friction they generate demands resolution through focused effort, often in the life area described by the apex planet''s house.\n\n**Yod (Finger of God)** — two planets in sextile, both quincunx (150°) a third. The apex of the Yod is the focal point: the planet that receives two 150° angles feels perpetually out of alignment, as if it belongs to a different story than the rest of the chart. Yods describe a life theme of adjustment, redirection, and fate-like turning points.\n\nAspect patterns must always be read within the full chart context — sign, house, and natal strength all modify the pattern''s expression.',
    35, 3, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_2_3;

  IF v_lesson1_2_3 IS NULL THEN
    SELECT id INTO v_lesson1_2_3 FROM training_lessons
    WHERE title = 'Aspect Patterns: Grand Trine, T-Square, Yod' AND category_id = v_cat1_2;
  END IF;

  -- Quiz for Lesson 1-2-1
  INSERT INTO training_quizzes (lesson_id, title, questions, pass_score, is_active)
  VALUES (
    v_lesson1_2_1,
    'Major Aspects Quiz',
    '[
      {"question":"What angle defines a trine aspect?","options":[{"text":"120°","correct":true},{"text":"90°","correct":false},{"text":"60°","correct":false},{"text":"180°","correct":false}]},
      {"question":"Which aspect is considered most harmonious due to shared element?","options":[{"text":"Trine","correct":true},{"text":"Sextile","correct":false},{"text":"Square","correct":false},{"text":"Opposition","correct":false}]},
      {"question":"A square aspect creates which type of dynamic?","options":[{"text":"Friction and challenge that demands resolution","correct":true},{"text":"Easy, supportive energy flow","correct":false},{"text":"Polarity and projection","correct":false},{"text":"Merged, unified energy","correct":false}]},
      {"question":"What is the traditional orb allowed for a conjunction?","options":[{"text":"8°","correct":true},{"text":"5°","correct":false},{"text":"3°","correct":false},{"text":"10°","correct":false}]},
      {"question":"Which aspect occurs when two planets are 60° apart?","options":[{"text":"Sextile","correct":true},{"text":"Trine","correct":false},{"text":"Square","correct":false},{"text":"Semisquare","correct":false}]}
    ]'::jsonb,
    70, true
  )
  ON CONFLICT DO NOTHING;

  -- quiz_questions for Lesson 1-2-1
  INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority)
  VALUES
    (v_lesson1_2_1, 'What angle defines a trine aspect?',
     '["120°","90°","60°","180°"]'::jsonb,
     0, 'The trine is 120° — planets share the same element and their energies flow easily together.', 1),
    (v_lesson1_2_1, 'Which aspect is considered most harmonious due to shared element?',
     '["Trine","Sextile","Square","Opposition"]'::jsonb,
     0, 'The trine connects planets in the same element (e.g., Fire–Fire), producing natural resonance and ease.', 2),
    (v_lesson1_2_1, 'A square aspect creates which type of dynamic?',
     '["Friction and challenge that demands resolution","Easy, supportive energy flow","Polarity and projection","Merged, unified energy"]'::jsonb,
     0, 'Squares (90°) create tension between incompatible drives. This friction is productive when channelled into deliberate effort.', 3),
    (v_lesson1_2_1, 'What is the traditional orb allowed for a conjunction?',
     '["8°","5°","3°","10°"]'::jsonb,
     0, 'Conjunctions and oppositions traditionally allow up to 8° orb. Tighter orbs are more potent.', 4),
    (v_lesson1_2_1, 'Which aspect occurs when two planets are 60° apart?',
     '["Sextile","Trine","Square","Semisquare"]'::jsonb,
     0, 'The sextile is 60° — a mild harmonious aspect offering opportunity that rewards activation.', 5)
  ON CONFLICT DO NOTHING;

  -- ── Category 3: Transits and Progressions ────────────────────
  INSERT INTO training_categories (name, description, priority, is_active, training_id)
  VALUES ('Transits and Progressions',
    'Learn how astrology operates over time — tracking current planetary movements and symbolic progressions to understand life cycles and developmental themes.',
    3, true, v_prog1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat1_3;

  IF v_cat1_3 IS NULL THEN
    SELECT id INTO v_cat1_3 FROM training_categories
    WHERE name = 'Transits and Progressions' AND training_id = v_prog1;
  END IF;

  -- Lesson 1-3-1
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_3,
    'Understanding Transits',
    'An introduction to planetary transits — how the current sky interacts with the natal chart to time events and developmental openings.',
    'https://placeholder.astrologypro.com/videos/lesson-understanding-transits.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-understanding-transits.pdf',
    E'## Understanding Transits\n\nA **transit** occurs when a planet moving through the sky today makes an aspect to a planet in your natal chart. Transits are the primary timing tool in astrology — they describe when the archetypal energies of the sky activate specific natal themes.\n\nNot all transits are equal. The **outer planets** — Jupiter, Saturn, Uranus, Neptune, and Pluto — move slowly and produce the most significant life events when they transit personal planets (Sun, Moon, Mercury, Venus, Mars) or the angles (Ascendant, Midheaven). A Saturn square to your natal Sun may last several months; a Pluto conjunction can span years.\n\nThe **inner planets** — Sun, Mercury, Venus, Mars — move quickly and produce shorter, lighter activations. A Venus transit over your natal Moon might bring a pleasant day; a Mars transit over natal Saturn might produce a day of frustration or focused effort.\n\nWhen reading transits, always ask: *which natal planet is being activated, and what is that planet''s condition in the natal chart?* A well-placed Venus will respond differently to a Pluto transit than a stressed Venus. The natal chart is always the foundation; the transit is the weather passing through it.',
    20, 1, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_3_1;

  IF v_lesson1_3_1 IS NULL THEN
    SELECT id INTO v_lesson1_3_1 FROM training_lessons
    WHERE title = 'Understanding Transits' AND category_id = v_cat1_3;
  END IF;

  -- Lesson 1-3-2
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_3,
    'Major Life Transits: Saturn Return, Jupiter Return',
    'A focused study of the two most widely known cyclical transits — the Saturn Return and Jupiter Return — and what they signify in a life.',
    'https://placeholder.astrologypro.com/videos/lesson-major-life-transits-saturn-return-jupiter-return.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-major-life-transits-saturn-return-jupiter-return.pdf',
    E'## Major Life Transits: Saturn Return and Jupiter Return\n\nCertain transits recur on predictable cycles and mark recognisable developmental milestones across all lives.\n\n**The Saturn Return (approximately age 29–30, 58–60, 87–89)** occurs when transiting Saturn returns to the exact degree it occupied at birth — roughly every 29.5 years. The first Saturn Return is the most widely discussed: it marks the end of extended youth and the beginning of genuine adult responsibility. Saturn asks you to take stock, let go of what has been borrowed, and build something real. The years leading into and following the Saturn Return are typically intense — careers shift, relationships transform, identity clarifies.\n\n**The Jupiter Return (approximately every 12 years)** occurs when transiting Jupiter returns to its natal position. Jupiter cycles are more expansive and welcoming than Saturn''s. A Jupiter Return opens a 12-year chapter of development in whatever life domain Jupiter rules in the natal chart. The year of a Jupiter Return tends to bring opportunities, confidence, and forward momentum.\n\nBoth cycles are best understood not as isolated events but as chapters in a larger developmental arc. Track what was happening in the years *surrounding* the return, not just on the exact date. The sky plants seeds over months; the harvest arrives gradually.',
    25, 2, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_3_2;

  IF v_lesson1_3_2 IS NULL THEN
    SELECT id INTO v_lesson1_3_2 FROM training_lessons
    WHERE title = 'Major Life Transits: Saturn Return, Jupiter Return' AND category_id = v_cat1_3;
  END IF;

  -- Lesson 1-3-3
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat1_3,
    'Secondary Progressions',
    'An introduction to secondary progressions — the symbolic timing technique that advances the natal chart one day for each year of life.',
    'https://placeholder.astrologypro.com/videos/lesson-secondary-progressions.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-secondary-progressions.pdf',
    E'## Secondary Progressions\n\nSecondary progressions operate on the principle that *one day after birth equals one year of life*. You advance the natal chart forward one day in the ephemeris for each year lived. If someone is 35 years old, you examine the sky 35 days after their birth to find their progressed chart.\n\nThe **Progressed Sun** moves approximately one degree per year, changing signs roughly every 30 years. A Sun sign change by progression is a significant identity shift — not a change of natal Sun sign, but a new colouring to the person''s self-expression and life focus.\n\nThe **Progressed Moon** moves roughly one degree per month, completing a full cycle through all twelve signs in about 27–29 years. The progressed Moon''s sign and house describe the emotional atmosphere and key concerns of that period. When the progressed Moon crosses the Ascendant or Midheaven, it marks a personally significant turning point.\n\n**Progressed New and Full Moons** — when the progressed Moon aligns with the progressed Sun — mark important chapters. A Progressed New Moon initiates a 29-year cycle of development; the Progressed Full Moon at the halfway point brings culmination and harvest.\n\nProgressions work most powerfully in combination with transits: progressions describe the *interior development* unfolding; transits describe the *external events* that meet it.',
    30, 3, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson1_3_3;

  IF v_lesson1_3_3 IS NULL THEN
    SELECT id INTO v_lesson1_3_3 FROM training_lessons
    WHERE title = 'Secondary Progressions' AND category_id = v_cat1_3;
  END IF;

END $$;


-- ═══════════════════════════════════════════════════════════════
-- PROGRAM 2: Tarot Mastery
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_prog2       UUID;
  v_cat2_1      UUID;
  v_cat2_2      UUID;
  v_cat2_3      UUID;
  v_lesson2_1_1 UUID;
  v_lesson2_1_2 UUID;
  v_lesson2_1_3 UUID;
  v_lesson2_1_4 UUID;
  v_lesson2_2_1 UUID;
  v_lesson2_2_2 UUID;
  v_lesson2_2_3 UUID;
  v_lesson2_2_4 UUID;
  v_lesson2_3_1 UUID;
  v_lesson2_3_2 UUID;
  v_lesson2_3_3 UUID;
BEGIN

  INSERT INTO training_programs (name, description, priority, is_active)
  VALUES (
    'Tarot Mastery',
    'A deep dive into the 78-card tarot deck — from the symbolic journey of the Major Arcana through the suit numerology of the Minor Arcana, court card archetypes, and practical spread work.',
    2, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_prog2;

  IF v_prog2 IS NULL THEN
    SELECT id INTO v_prog2 FROM training_programs WHERE name = 'Tarot Mastery';
  END IF;

  -- ── Category 2-1: Major Arcana Deep Dive ─────────────────────
  INSERT INTO training_categories (name, description, priority, is_active, training_id)
  VALUES ('Major Arcana Deep Dive',
    'A card-by-card exploration of the 22 Major Arcana — the archetypal journey from the Fool''s leap of faith to the World''s integration.',
    1, true, v_prog2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat2_1;

  IF v_cat2_1 IS NULL THEN
    SELECT id INTO v_cat2_1 FROM training_categories
    WHERE name = 'Major Arcana Deep Dive' AND training_id = v_prog2;
  END IF;

  -- Lesson 2-1-1
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_1,
    'The Fool''s Journey — Overview of the Major Arcana',
    'An introduction to the Major Arcana as a continuous narrative — the Fool''s journey through 21 archetypal stations from innocence to integration.',
    'https://placeholder.astrologypro.com/videos/lesson-the-fools-journey-overview-of-the-major-arcana.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-the-fools-journey-overview-of-the-major-arcana.pdf',
    E'## The Fool''s Journey\n\nThe 22 cards of the Major Arcana tell a single mythic story — the journey of a soul (the Fool, card 0) through 21 archetypal experiences toward wholeness (the World, card 21).\n\nThe Fool begins as pure potential: unnumbered, unformed, stepping off a cliff with no fear. Each subsequent card is a teacher the Fool encounters along the path. The Magician teaches will and skill. The High Priestess reveals mystery and the unconscious. The Empress brings abundance; the Emperor imposes structure. The Hierophant transmits tradition; the Lovers ask the Fool to choose.\n\nCards 7–14 represent the Fool''s journey through the outer world: navigating power (the Chariot), finding inner strength, retreating inward (the Hermit), surrendering to fate (the Wheel of Fortune), discovering justice, surrendering the ego (the Hanged Man), and transforming through loss (Death and Temperance).\n\nCards 15–21 represent the deeper initiatory arc: confronting shadow and illusion (the Devil and the Tower), receiving celestial guidance (the Star, Moon, and Sun), completing the cycle (Judgement), and arriving at wholeness (the World).\n\nUnderstanding the Major Arcana as a coherent narrative rather than 22 isolated symbols is the key to reading them with depth and fluency.',
    20, 1, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_1_1;

  IF v_lesson2_1_1 IS NULL THEN
    SELECT id INTO v_lesson2_1_1 FROM training_lessons
    WHERE title = 'The Fool''s Journey — Overview of the Major Arcana' AND category_id = v_cat2_1;
  END IF;

  -- Lesson 2-1-2
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_1,
    'Cards 0–7: The Fool through The Chariot',
    'A detailed study of the first eight cards of the Major Arcana — from the Fool''s beginnings through the Chariot''s hard-won mastery.',
    'https://placeholder.astrologypro.com/videos/lesson-cards-0-7-the-fool-through-the-chariot.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-cards-0-7-the-fool-through-the-chariot.pdf',
    E'## Cards 0–7: The Fool through The Chariot\n\n**0 — The Fool.** Pure potential; the leap into the unknown before experience has formed a personality. Keywords: beginnings, trust, spontaneity, the unformed self.\n\n**I — The Magician.** The Fool''s first encounter with will and agency. The Magician has all four suits on the table and knows how to direct them. Keywords: skill, manifestation, focused intent, resourcefulness.\n\n**II — The High Priestess.** The keeper of hidden knowledge — the intuitive, lunar counterpart to the Magician''s solar will. Keywords: mystery, the unconscious, inner knowing, patience.\n\n**III — The Empress.** Fertile abundance; the body, the earth, creativity as a natural outpouring. Keywords: nurture, creativity, sensuality, the natural world.\n\n**IV — The Emperor.** Structure, authority, the law of form. The Emperor asks the Fool to accept discipline and the reality of limits. Keywords: authority, order, fathering principle, stability.\n\n**V — The Hierophant.** Tradition, collective wisdom, the transmission of teachings. Keywords: convention, spiritual guidance, community, doctrine.\n\n**VI — The Lovers.** The first major choice — not necessarily romantic, but the recognition that commitment to one path means releasing another. Keywords: choice, values, union, alignment.\n\n**VII — The Chariot.** Victory through directed will — not brute force, but the disciplined channelling of opposing energies. Keywords: mastery, forward motion, self-control, triumph.',
    35, 2, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_1_2;

  IF v_lesson2_1_2 IS NULL THEN
    SELECT id INTO v_lesson2_1_2 FROM training_lessons
    WHERE title = 'Cards 0–7: The Fool through The Chariot' AND category_id = v_cat2_1;
  END IF;

  -- Lesson 2-1-3
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_1,
    'Cards 8–14: Strength through Temperance',
    'A study of the middle arc of the Major Arcana — the inward journey through Strength, Hermit, and Wheel of Fortune to the transformative threshold of Death and Temperance.',
    'https://placeholder.astrologypro.com/videos/lesson-cards-8-14-strength-through-temperance.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-cards-8-14-strength-through-temperance.pdf',
    E'## Cards 8–14: Strength through Temperance\n\n**VIII — Strength.** Mastery through gentleness, not domination. The figure tames the lion with open hands. Keywords: inner strength, patience, compassion, courage.\n\n**IX — The Hermit.** Withdrawal from the world to find inner light. The Hermit holds the lantern — wisdom is found in solitude and inward seeking. Keywords: introspection, wisdom, solitude, the inner guide.\n\n**X — The Wheel of Fortune.** The great cycle turns; what was down rises, what was up falls. The Fool learns that change is constant and that timing matters. Keywords: cycles, fate, turning points, impermanence.\n\n**XI — Justice.** Cause and effect, accountability, the natural law of consequences. Keywords: fairness, truth, balance, karmic law.\n\n**XII — The Hanged Man.** Willing surrender, the pause before transformation. The Hanged Man has turned the world upside down and sees it differently. Keywords: suspension, sacrifice, new perspective, letting go.\n\n**XIII — Death.** Not physical death but the irreversible end of a chapter. What cannot be carried forward must be released. Keywords: transformation, endings, release, necessary change.\n\n**XIV — Temperance.** The alchemical mixing of opposites into something new and balanced. Keywords: patience, integration, moderation, the long view.',
    35, 3, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_1_3;

  IF v_lesson2_1_3 IS NULL THEN
    SELECT id INTO v_lesson2_1_3 FROM training_lessons
    WHERE title = 'Cards 8–14: Strength through Temperance' AND category_id = v_cat2_1;
  END IF;

  -- Lesson 2-1-4
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_1,
    'Cards 15–21: The Devil through The World',
    'The final arc of the Major Arcana — descending into shadow, breaking free, receiving light, and arriving at the integrated wholeness of the World card.',
    'https://placeholder.astrologypro.com/videos/lesson-cards-15-21-the-devil-through-the-world.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-cards-15-21-the-devil-through-the-world.pdf',
    E'## Cards 15–21: The Devil through The World\n\n**XV — The Devil.** Bondage to materialism, addiction, or illusion — yet the chains in most decks are loose. The figures could leave if they chose. Keywords: shadow, bondage, materialism, the unconscious pull.\n\n**XVI — The Tower.** Sudden collapse of false structures built on flawed foundations. Painful, but liberating. Keywords: upheaval, revelation, the fall of ego, breakthrough.\n\n**XVII — The Star.** Renewal after the Tower''s destruction — the quiet, generous pouring of hope. Keywords: hope, healing, inspiration, the return of faith.\n\n**XVIII — The Moon.** The realm of dreams, anxiety, and illusion. The Moon illuminates without clarity; things are not what they seem. Keywords: the unconscious, confusion, fear, psychic sensitivity.\n\n**XIX — The Sun.** Clarity, joy, and the radiance of conscious awareness. After the Moon''s ambiguity, the Sun shines without shadow. Keywords: vitality, joy, success, full consciousness.\n\n**XX — Judgement.** A call to awakening — rising to a higher level of consciousness, answering the summons of purpose. Keywords: awakening, evaluation, rebirth, the call to purpose.\n\n**XXI — The World.** Completion of the journey; integration of all parts. The dancer at the centre of the wreath has become whole. Keywords: completion, integration, wholeness, the cycle fulfilled.',
    35, 4, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_1_4;

  IF v_lesson2_1_4 IS NULL THEN
    SELECT id INTO v_lesson2_1_4 FROM training_lessons
    WHERE title = 'Cards 15–21: The Devil through The World' AND category_id = v_cat2_1;
  END IF;

  -- Quiz for Lesson 2-1-2
  INSERT INTO training_quizzes (lesson_id, title, questions, pass_score, is_active)
  VALUES (
    v_lesson2_1_2,
    'Major Arcana Cards 0–7 Quiz',
    '[
      {"question":"Which card is numbered 0 in the Major Arcana?","options":[{"text":"The Fool","correct":true},{"text":"The Magician","correct":false},{"text":"The Hierophant","correct":false},{"text":"The Hermit","correct":false}]},
      {"question":"What does the Magician primarily represent?","options":[{"text":"Focused will, skill, and the power to manifest","correct":true},{"text":"Hidden knowledge and the unconscious","correct":false},{"text":"Tradition and collective wisdom","correct":false},{"text":"Hard-won victory through control","correct":false}]},
      {"question":"Which card is associated with the principle of fertile abundance and the natural world?","options":[{"text":"The Empress","correct":true},{"text":"The High Priestess","correct":false},{"text":"The Moon","correct":false},{"text":"The Star","correct":false}]},
      {"question":"What is the central theme of the Chariot?","options":[{"text":"Victory through directed will and disciplined mastery","correct":true},{"text":"Withdrawal into solitude for inner wisdom","correct":false},{"text":"Surrender to cycles beyond one''s control","correct":false},{"text":"The balancing of opposing forces without action","correct":false}]},
      {"question":"The Lovers card is primarily about which theme?","options":[{"text":"A significant choice that aligns one with personal values","correct":true},{"text":"Romantic partnership only","correct":false},{"text":"The merging of two incompatible forces","correct":false},{"text":"Dependence and attachment","correct":false}]}
    ]'::jsonb,
    70, true
  )
  ON CONFLICT DO NOTHING;

  -- quiz_questions for Lesson 2-1-2
  INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority)
  VALUES
    (v_lesson2_1_2, 'Which card is numbered 0 in the Major Arcana?',
     '["The Fool","The Magician","The Hierophant","The Hermit"]'::jsonb,
     0, 'The Fool is card 0 — unnumbered in the traditional sequence, representing pure potential before experience has formed identity.', 1),
    (v_lesson2_1_2, 'What does the Magician primarily represent?',
     '["Focused will, skill, and the power to manifest","Hidden knowledge and the unconscious","Tradition and collective wisdom","Hard-won victory through control"]'::jsonb,
     0, 'The Magician (I) has all four elemental tools on the table and the will to direct them. He represents conscious agency and the ability to manifest.', 2),
    (v_lesson2_1_2, 'Which card is associated with the principle of fertile abundance and the natural world?',
     '["The Empress","The High Priestess","The Moon","The Star"]'::jsonb,
     0, 'The Empress (III) represents creative fertility, the body, nature, and nurturing abundance — the embodied, generative principle.', 3),
    (v_lesson2_1_2, 'What is the central theme of the Chariot?',
     '["Victory through directed will and disciplined mastery","Withdrawal into solitude for inner wisdom","Surrender to cycles beyond one''s control","The balancing of opposing forces without action"]'::jsonb,
     0, 'The Chariot (VII) represents triumph achieved by holding two opposing forces (its sphinxes) in disciplined alignment and driving them forward.', 4),
    (v_lesson2_1_2, 'The Lovers card is primarily about which theme?',
     '["A significant choice that aligns one with personal values","Romantic partnership only","The merging of two incompatible forces","Dependence and attachment"]'::jsonb,
     0, 'The Lovers (VI) is fundamentally about choice — committing to one path (and releasing another) in alignment with one''s deepest values.', 5)
  ON CONFLICT DO NOTHING;

  -- ── Category 2-2: Minor Arcana and Court Cards ────────────────
  INSERT INTO training_categories (name, description, priority, is_active, training_id)
  VALUES ('Minor Arcana and Court Cards',
    'Master the 56 cards of the Minor Arcana — the four suits, their elemental meanings, numerological progressions, and the sixteen court card archetypes.',
    2, true, v_prog2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat2_2;

  IF v_cat2_2 IS NULL THEN
    SELECT id INTO v_cat2_2 FROM training_categories
    WHERE name = 'Minor Arcana and Court Cards' AND training_id = v_prog2;
  END IF;

  -- Lesson 2-2-1
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_2,
    'The Four Suits and Their Elements',
    'An overview of the Minor Arcana''s four suits — Wands, Cups, Swords, and Pentacles — and the elemental domains each one governs.',
    'https://placeholder.astrologypro.com/videos/lesson-the-four-suits-and-their-elements.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-the-four-suits-and-their-elements.pdf',
    E'## The Four Suits and Their Elements\n\nThe 56 cards of the Minor Arcana are divided into four suits, each aligned with one of the classical elements and governing a distinct domain of human experience.\n\n**Wands (Fire)** — passion, creativity, ambition, and spiritual drive. Wands describe what energises and motivates; they are associated with career in the sense of calling, not just employment. The fire in Wands can inspire or exhaust.\n\n**Cups (Water)** — emotion, relationship, intuition, and the inner life. Cups describe how we feel, how we love, and what we dream. The shadow of Cups is fantasy, emotional flooding, or withdrawal.\n\n**Swords (Air)** — thought, communication, conflict, and truth. Swords cut through illusion but can also wound. They describe the life of the mind, decisions, and the price of clarity.\n\n**Pentacles (Earth)** — the material world: body, money, work, craft, and the physical environment. Pentacles are the most tangible suit — they describe what we build, earn, tend, and inhabit.\n\nEach suit runs from Ace through Ten, with the Ace representing the pure potential of the element and the Ten its fullest expression (or over-expression). The numerological arc from Ace to Ten describes a complete cycle: initiation, development, conflict, resolution.\n\nWhen a reading is dominated by one suit, it signals that a particular dimension of life is especially active.',
    20, 1, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_2_1;

  IF v_lesson2_2_1 IS NULL THEN
    SELECT id INTO v_lesson2_2_1 FROM training_lessons
    WHERE title = 'The Four Suits and Their Elements' AND category_id = v_cat2_2;
  END IF;

  -- Lesson 2-2-2
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_2,
    'Wands and Pentacles',
    'A card-by-card study of the Suit of Wands and the Suit of Pentacles — the fire and earth suits governing passion, creativity, work, and material life.',
    'https://placeholder.astrologypro.com/videos/lesson-wands-and-pentacles.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-wands-and-pentacles.pdf',
    E'## Wands and Pentacles\n\n### Suit of Wands (Ace–Ten)\n\nThe Wands arc moves from pure creative spark (Ace) through the exhilaration of new endeavour (2, 3), early conflict and competition (4, 5), recognition and triumph (6), resilience under pressure (7, 8, 9), and finally the completion and handover of one''s creative legacy (10).\n\nKey cards: **Ace of Wands** — the igniting spark of inspiration or new venture. **Three of Wands** — the confident expansion into new horizons after early foundations are set. **Eight of Wands** — rapid movement, news arriving, swift action. **Ten of Wands** — creative overload, carrying more than is sustainable.\n\n### Suit of Pentacles (Ace–Ten)\n\nThe Pentacles arc moves from the material gift or seed of opportunity (Ace) through careful skill development (3), the paradox of hoarding vs. sharing (4), loss and hardship (5), generosity and charity (6), patient long-term investment (7, 8, 9), and finally the inheritance and security of a well-built life (10).\n\nKey cards: **Ace of Pentacles** — a tangible new opportunity, a seed of material potential. **Three of Pentacles** — collaborative craft, skilled teamwork. **Eight of Pentacles** — diligent mastery, the apprentice at the workbench. **Ten of Pentacles** — generational wealth, legacy, the completed material cycle.',
    30, 2, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_2_2;

  IF v_lesson2_2_2 IS NULL THEN
    SELECT id INTO v_lesson2_2_2 FROM training_lessons
    WHERE title = 'Wands and Pentacles' AND category_id = v_cat2_2;
  END IF;

  -- Lesson 2-2-3
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_2,
    'Cups and Swords',
    'A card-by-card study of the Suit of Cups and the Suit of Swords — the water and air suits governing emotion, relationship, intellect, and conflict.',
    'https://placeholder.astrologypro.com/videos/lesson-cups-and-swords.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-cups-and-swords.pdf',
    E'## Cups and Swords\n\n### Suit of Cups (Ace–Ten)\n\nThe Cups arc moves from the offer of emotional possibility (Ace) through the joy of early love and creative partnership (2, 3), emotional withdrawal or choice (4), loss and grief (5), reunion and nostalgia (6), wishful dreaming (7), moving on (8), contentment (9), and the full family or community of heart (10).\n\nKey cards: **Ace of Cups** — the opening of the heart; an offer of love or creative inspiration. **Three of Cups** — celebration, friendship, creative abundance. **Five of Cups** — grief and loss with hope remaining in the uncherished cups. **Nine of Cups** — the wish card; emotional satisfaction and contentment.\n\n### Suit of Swords (Ace–Ten)\n\nThe Swords arc is the suit of the mind''s journey through conflict and resolution. It begins with pure intellectual potential (Ace), moves through difficult decisions and conflict (2–6), deception and betrayal (7), imprisonment (8), despair (9), and arrives at the painful but necessary ending of a difficult chapter (10).\n\nKey cards: **Ace of Swords** — breakthrough clarity, the sword of truth cutting through illusion. **Four of Swords** — rest, recovery, and mental retreat after conflict. **Eight of Swords** — self-imposed limitation; the blindfold can be removed. **Ten of Swords** — the end of a difficult cycle; painful closure that makes way for new beginnings.',
    30, 3, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_2_3;

  IF v_lesson2_2_3 IS NULL THEN
    SELECT id INTO v_lesson2_2_3 FROM training_lessons
    WHERE title = 'Cups and Swords' AND category_id = v_cat2_2;
  END IF;

  -- Lesson 2-2-4
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_2,
    'Court Cards: Pages, Knights, Queens, Kings',
    'A complete guide to the sixteen court cards — how to read them as people, personality modes, or situational energies in a reading.',
    'https://placeholder.astrologypro.com/videos/lesson-court-cards-pages-knights-queens-kings.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-court-cards-pages-knights-queens-kings.pdf',
    E'## Court Cards: Pages, Knights, Queens, Kings\n\nCourt cards are among the most context-sensitive cards in the deck. They can represent: a specific person in the querent''s life, an aspect of the querent''s own personality, a situational energy the querent is embodying, or a quality being called for.\n\n**Pages** — youthful, curious, learning. They carry the elemental energy of their suit in its most open, receptive form. A Page arriving in a reading can signal new information, a student energy, or the beginning of an elemental journey.\n\n**Knights** — active, driven, sometimes extreme. Knights are in motion — they have taken the element and are riding it hard. The Knight of Wands charges forward with fire; the Knight of Swords rushes toward conflict. Knights bring momentum and can also bring recklessness.\n\n**Queens** — mature, inward mastery of the element. Queens know their suit deeply and embody it with authority from within. The Queen of Cups feels into truth intuitively; the Queen of Pentacles tends her domain with practical wisdom.\n\n**Kings** — outward, authoritative expression of the element. Kings direct and lead in the world. The King of Swords commands through clear judgment; the King of Wands through charismatic vision.\n\nWhen a court card represents a person, look for their elemental type: fire people (Wands), water people (Cups), air people (Swords), earth people (Pentacles).',
    35, 4, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_2_4;

  IF v_lesson2_2_4 IS NULL THEN
    SELECT id INTO v_lesson2_2_4 FROM training_lessons
    WHERE title = 'Court Cards: Pages, Knights, Queens, Kings' AND category_id = v_cat2_2;
  END IF;

  -- ── Category 2-3: Reading Spreads ────────────────────────────
  INSERT INTO training_categories (name, description, priority, is_active, training_id)
  VALUES ('Reading Spreads',
    'Learn how to structure a tarot reading using established spreads — from the simplest one-card pull through the comprehensive Celtic Cross and beyond to custom layouts.',
    3, true, v_prog2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat2_3;

  IF v_cat2_3 IS NULL THEN
    SELECT id INTO v_cat2_3 FROM training_categories
    WHERE name = 'Reading Spreads' AND training_id = v_prog2;
  END IF;

  -- Lesson 2-3-1
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_3,
    'Single Card and Three Card Spreads',
    'Practical guidance on using the one-card daily draw and the foundational three-card spread for past/present/future, situation/action/outcome, and other triad structures.',
    'https://placeholder.astrologypro.com/videos/lesson-single-card-and-three-card-spreads.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-single-card-and-three-card-spreads.pdf',
    E'## Single Card and Three Card Spreads\n\n### The Single Card Draw\n\nThe daily one-card pull is the foundational tarot practice. Draw one card and sit with it — not as a prediction of what will happen, but as a lens through which to view the day''s energy. Ask: *What quality does this card invite me to bring today? What might I notice through this lens?*\n\nA single card read over time builds your relationship with each card''s living meaning far more effectively than memorisation alone.\n\n### The Three-Card Spread\n\nThree cards can map virtually any question. Common positional meanings:\n\n- **Past / Present / Future** — the developmental arc of a situation\n- **Situation / Action / Outcome** — what is happening, what to do, where it leads\n- **Body / Mind / Spirit** — the three dimensions of a person''s current state\n- **What to embrace / What to release / What to integrate** — a transformation spread\n- **Conscious / Unconscious / Advice** — surfacing hidden dynamics\n\nThe key to reading three cards well is **narrative synthesis**: the three cards are not independent statements — they form a sentence. Read them together, letting the middle card mediate between the first and third. Notice whether the suits, elements, or numbers of the three cards reinforce or contrast with each other.\n\nAlways state a clear question before laying the cards. Vague questions produce vague readings.',
    20, 1, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_3_1;

  IF v_lesson2_3_1 IS NULL THEN
    SELECT id INTO v_lesson2_3_1 FROM training_lessons
    WHERE title = 'Single Card and Three Card Spreads' AND category_id = v_cat2_3;
  END IF;

  -- Lesson 2-3-2
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_3,
    'The Celtic Cross',
    'A complete guide to the ten-position Celtic Cross spread — the most widely used tarot layout — covering positional meanings, reading flow, and common interpretation pitfalls.',
    'https://placeholder.astrologypro.com/videos/lesson-the-celtic-cross.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-the-celtic-cross.pdf',
    E'## The Celtic Cross\n\nThe Celtic Cross is a ten-card spread designed to give a comprehensive overview of a situation. While there are many positional variations, the standard layout is:\n\n**Position 1 — The Significator / Present Situation:** The heart of the matter.\n**Position 2 — The Cross / Challenge:** What crosses or complicates the central energy.\n**Position 3 — The Foundation / Root:** The unconscious basis; what underlies the situation.\n**Position 4 — The Recent Past:** What is leaving or receding.\n**Position 5 — The Crown / Potential:** The highest possible outcome or the conscious goal.\n**Position 6 — The Near Future:** What is approaching in the coming weeks.\n**Position 7 — The Querent''s Attitude:** How the querent sees themselves or their approach.\n**Position 8 — External Influences:** The environment, other people, external factors.\n**Position 9 — Hopes and Fears:** What the querent most desires or fears.\n**Position 10 — The Outcome:** The most likely trajectory if the current path continues.\n\nRead the cross positions (1–6) as the situation''s anatomy. Read the staff positions (7–10) as the psychological and contextual dimension. The outcome (10) is a projection, not a fate — it shifts with the querent''s choices.\n\nAvoid reading ten cards as ten separate statements. Group them: root + foundation, present + cross, near future + outcome.',
    30, 2, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_3_2;

  IF v_lesson2_3_2 IS NULL THEN
    SELECT id INTO v_lesson2_3_2 FROM training_lessons
    WHERE title = 'The Celtic Cross' AND category_id = v_cat2_3;
  END IF;

  -- Lesson 2-3-3
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat2_3,
    'Creating Custom Spreads',
    'A workshop on designing your own tarot spreads — matching positional structure to the specific question being asked, from relationship spreads to decision-making layouts.',
    'https://placeholder.astrologypro.com/videos/lesson-creating-custom-spreads.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-creating-custom-spreads.pdf',
    E'## Creating Custom Spreads\n\nA custom spread is simply a set of named positions designed to answer a specific type of question. Creating your own spreads deepens your understanding of how structure shapes meaning in a reading.\n\n### Principles of Spread Design\n\n**1. Start with the question.** What does the querent actually need to know? Map the positions to the dimensions of that question, not to a generic template.\n\n**2. Use three to seven positions for most readings.** More than seven positions often creates redundancy and dilutes focus. The exception is complex life-area spreads (e.g., annual wheel spreads with twelve positions).\n\n**3. Name each position precisely.** Vague positions produce vague readings. "Obstacle" is better than "position 3." "What I need to release" is better than "the past."\n\n**4. Design narrative flow.** Good spreads move logically: situation → dynamics → insight → action → outcome. The querent should be able to follow the reading as a coherent story.\n\n**5. Test and refine.** Read with your spread several times before finalising it. If a position consistently yields confusing cards, refine its name or reposition it.\n\n### Example: A Decision-Making Spread\n- Position 1: The decision at the heart of this\n- Position 2: What Option A offers\n- Position 3: What Option A asks of me\n- Position 4: What Option B offers\n- Position 5: What Option B asks of me\n- Position 6: What I already know but need to acknowledge\n- Position 7: The deeper purpose served by making this choice',
    25, 3, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson2_3_3;

  IF v_lesson2_3_3 IS NULL THEN
    SELECT id INTO v_lesson2_3_3 FROM training_lessons
    WHERE title = 'Creating Custom Spreads' AND category_id = v_cat2_3;
  END IF;

  -- Quiz for Lesson 2-3-2 (Celtic Cross)
  INSERT INTO training_quizzes (lesson_id, title, questions, pass_score, is_active)
  VALUES (
    v_lesson2_3_2,
    'Celtic Cross Spread Quiz',
    '[
      {"question":"How many cards are used in a standard Celtic Cross spread?","options":[{"text":"10","correct":true},{"text":"7","correct":false},{"text":"12","correct":false},{"text":"8","correct":false}]},
      {"question":"What does Position 2 (the crossing card) represent?","options":[{"text":"The challenge or complicating factor","correct":true},{"text":"The recent past","correct":false},{"text":"The querent''s attitude","correct":false},{"text":"External influences","correct":false}]},
      {"question":"Which positions are referred to as the ''staff'' in the Celtic Cross?","options":[{"text":"Positions 7–10","correct":true},{"text":"Positions 1–4","correct":false},{"text":"Positions 3–6","correct":false},{"text":"Positions 5–8","correct":false}]},
      {"question":"How should the outcome card (Position 10) be interpreted?","options":[{"text":"As a likely trajectory that can shift with the querent''s choices","correct":true},{"text":"As a fixed and unavoidable fate","correct":false},{"text":"As representing the querent''s deepest fear","correct":false},{"text":"As the card with the most literal meaning in the spread","correct":false}]},
      {"question":"What is the recommended approach to reading the Celtic Cross?","options":[{"text":"Group the cards thematically rather than reading each as an isolated statement","correct":true},{"text":"Read each card independently from first to last","correct":false},{"text":"Interpret only the cards that feel intuitively significant","correct":false},{"text":"Focus exclusively on the final outcome card","correct":false}]}
    ]'::jsonb,
    70, true
  )
  ON CONFLICT DO NOTHING;

  -- quiz_questions for Lesson 2-3-2
  INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority)
  VALUES
    (v_lesson2_3_2, 'How many cards are used in a standard Celtic Cross spread?',
     '["10","7","12","8"]'::jsonb,
     0, 'The Celtic Cross uses 10 cards: six forming the cross and four forming the staff.', 1),
    (v_lesson2_3_2, 'What does Position 2 (the crossing card) represent?',
     '["The challenge or complicating factor","The recent past","The querent''s attitude","External influences"]'::jsonb,
     0, 'The crossing card lies across the central card and represents what opposes, challenges, or complicates the present situation.', 2),
    (v_lesson2_3_2, 'Which positions are referred to as the ''staff'' in the Celtic Cross?',
     '["Positions 7–10","Positions 1–4","Positions 3–6","Positions 5–8"]'::jsonb,
     0, 'The staff (positions 7–10) describes the psychological and contextual dimensions: the querent''s attitude, external influences, hopes/fears, and outcome.', 3),
    (v_lesson2_3_2, 'How should the outcome card (Position 10) be interpreted?',
     '["As a likely trajectory that can shift with the querent''s choices","As a fixed and unavoidable fate","As representing the querent''s deepest fear","As the card with the most literal meaning in the spread"]'::jsonb,
     0, 'The outcome card shows the most probable trajectory if the current path continues. It is not fixed — the querent''s choices and awareness change it.', 4),
    (v_lesson2_3_2, 'What is the recommended approach to reading the Celtic Cross?',
     '["Group the cards thematically rather than reading each as an isolated statement","Read each card independently from first to last","Interpret only the cards that feel intuitively significant","Focus exclusively on the final outcome card"]'::jsonb,
     0, 'Good Celtic Cross reading synthesises: cross positions as the situation''s anatomy, staff positions as psychological context — read as a coherent narrative, not ten separate statements.', 5)
  ON CONFLICT DO NOTHING;

END $$;


-- ═══════════════════════════════════════════════════════════════
-- PROGRAM 3: Advanced Divination
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_prog3       UUID;
  v_cat3_1      UUID;
  v_cat3_2      UUID;
  v_lesson3_1_1 UUID;
  v_lesson3_1_2 UUID;
  v_lesson3_1_3 UUID;
  v_lesson3_2_1 UUID;
  v_lesson3_2_2 UUID;
  v_lesson3_2_3 UUID;
BEGIN

  INSERT INTO training_programs (name, description, priority, is_active)
  VALUES (
    'Advanced Divination',
    'For practitioners ready to deepen their craft — covering predictive astrology techniques, intuitive reading development, and the ethics and relational skills that distinguish a trustworthy diviner.',
    3, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_prog3;

  IF v_prog3 IS NULL THEN
    SELECT id INTO v_prog3 FROM training_programs WHERE name = 'Advanced Divination';
  END IF;

  -- ── Category 3-1: Predictive Astrology ───────────────────────
  INSERT INTO training_categories (name, description, priority, is_active, training_id)
  VALUES ('Predictive Astrology',
    'Advanced timing techniques beyond basic transits — solar returns, lunar returns, eclipses, profections, and firdaria as tools for understanding life cycles.',
    1, true, v_prog3)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat3_1;

  IF v_cat3_1 IS NULL THEN
    SELECT id INTO v_cat3_1 FROM training_categories
    WHERE name = 'Predictive Astrology' AND training_id = v_prog3;
  END IF;

  -- Lesson 3-1-1
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat3_1,
    'Solar Returns',
    'How to cast, read, and apply the solar return chart — the annual chart drawn for the moment the transiting Sun returns to its natal degree.',
    'https://placeholder.astrologypro.com/videos/lesson-solar-returns.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-solar-returns.pdf',
    E'## Solar Returns\n\nA **solar return** is cast for the exact moment the transiting Sun returns to its natal degree — an event that occurs within a day of each birthday. The resulting chart describes the thematic year ahead: the sign rising in the return chart sets a new tone, the house occupied by the return Sun reveals the year''s central focus, and the planetary positions describe the cast of characters and dynamics at play.\n\n**Key interpretive points:**\n\n**Return Ascendant** — the most important single factor. It sets the orientation and mode of expression for the year. A Scorpio Ascendant in a return chart brings a year of depth, intensity, and transformation, regardless of the natal rising sign.\n\n**Return Sun house** — where is your identity and vitality focused this year? Sun in the 10th house: a year of public achievement and career. Sun in the 4th: a year turned toward home, family, and roots.\n\n**Angular planets** — planets on the return Ascendant, IC, Descendant, or Midheaven are highly active during the year.\n\n**Relationship to natal chart** — always read the return alongside the natal. The return describes the weather; the natal describes the terrain it moves through.\n\nSolar return charts are location-sensitive. If you travel to another city for your birthday, the return chart will reflect that location''s angles — an advanced technique called *return relocation*.',
    25, 1, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson3_1_1;

  IF v_lesson3_1_1 IS NULL THEN
    SELECT id INTO v_lesson3_1_1 FROM training_lessons
    WHERE title = 'Solar Returns' AND category_id = v_cat3_1;
  END IF;

  -- Lesson 3-1-2
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat3_1,
    'Lunar Returns and Eclipses',
    'How to use the monthly lunar return chart for short-term timing, and how eclipses function as supercharged new and full moons that activate the natal chart for months.',
    'https://placeholder.astrologypro.com/videos/lesson-lunar-returns-and-eclipses.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-lunar-returns-and-eclipses.pdf',
    E'## Lunar Returns and Eclipses\n\n### Lunar Returns\n\nA **lunar return** is cast when the transiting Moon returns to its natal degree — once approximately every 27.3 days. The lunar return chart describes the emotional and relational climate of the coming month. It is the finest-grained predictive tool in traditional astrology for short-term timing.\n\nThe **return Ascendant** sets the monthly tone. Planets on the return angles activate during the month. The return Moon''s house shows where your emotional focus and domestic life will be concentrated.\n\n### Eclipses\n\nEclipses are supercharged new moons (solar eclipses) and full moons (lunar eclipses) that occur when the Sun and Moon align within the Moon''s nodal axis. Where a regular lunation has a local effect lasting days to weeks, an eclipse can trigger developments that unfold over six months to a year.\n\n**Solar eclipses** (new moons on the nodal axis) initiate new chapters, sometimes dramatically. If a solar eclipse falls conjunct a natal planet or angle, expect significant new beginnings — or sudden endings — related to that planet''s domain.\n\n**Lunar eclipses** (full moons on the nodal axis) bring culminations, revelations, and releases. They often surface what has been suppressed or hidden.\n\nEclipses travel in families (Saros series). Two eclipse seasons per year each produce one or two eclipses. Track the degree where an eclipse falls — any natal planet within 2–3° will be strongly activated.',
    25, 2, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson3_1_2;

  IF v_lesson3_1_2 IS NULL THEN
    SELECT id INTO v_lesson3_1_2 FROM training_lessons
    WHERE title = 'Lunar Returns and Eclipses' AND category_id = v_cat3_1;
  END IF;

  -- Lesson 3-1-3
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat3_1,
    'Profections and Firdaria',
    'Two classical timing techniques — annual profections (which house is activated each year of life) and firdaria (planetary time-lord periods) — for integrating traditional methods into modern practice.',
    'https://placeholder.astrologypro.com/videos/lesson-profections-and-firdaria.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-profections-and-firdaria.pdf',
    E'## Profections and Firdaria\n\nThese are classical predictive techniques from Hellenistic and Medieval astrology that have experienced a significant revival in contemporary practice.\n\n### Annual Profections\n\nProfections advance the natal Ascendant by one house for each year of life. At age 0, you are in a 1st house profection year; at age 1, a 2nd house year; at age 12, you return to the 1st house — and so on in a repeating 12-year cycle.\n\nThe **profected house** becomes the activated area of life that year, and its ruling planet becomes the **Lord of the Year** — a planet that is particularly sensitive to transits and directions throughout that twelve-month period.\n\nAt age 29 (Saturn Return), you are in a 6th house year (health, work, service). At age 33 (a significant Jupiter period), a 10th house year (career, public life). These natural correlations between profection year and life events are striking in practice.\n\n### Firdaria\n\nFirdaria are planetary time-lord periods drawn from a specific traditional sequence. Each planet governs a defined number of years of life in a fixed order: the Sun (10 years), Venus (8), Mercury (13), Moon (9), Saturn (11), Jupiter (12), Mars (7), North Node (3), South Node (2) — then the sequence repeats.\n\nThe firdaria lord colours the entire period with its natal condition and transited state. A person in a Mars firdaria period in their 40s will have their natal Mars activated as a key theme for seven years — ambition, conflict, drive, and assertion will be central.',
    35, 3, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson3_1_3;

  IF v_lesson3_1_3 IS NULL THEN
    SELECT id INTO v_lesson3_1_3 FROM training_lessons
    WHERE title = 'Profections and Firdaria' AND category_id = v_cat3_1;
  END IF;

  -- ── Category 3-2: Intuitive Reading Techniques ───────────────
  INSERT INTO training_categories (name, description, priority, is_active, training_id)
  VALUES ('Intuitive Reading Techniques',
    'Develop the relational and intuitive dimensions of divination practice — combining systems, working with clients, and grounding the work in clear ethical boundaries.',
    2, true, v_prog3)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat3_2;

  IF v_cat3_2 IS NULL THEN
    SELECT id INTO v_cat3_2 FROM training_categories
    WHERE name = 'Intuitive Reading Techniques' AND training_id = v_prog3;
  END IF;

  -- Lesson 3-2-1
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat3_2,
    'Developing Your Intuition',
    'Practical exercises and frameworks for cultivating intuitive perception as a complement to technical knowledge in divination practice.',
    'https://placeholder.astrologypro.com/videos/lesson-developing-your-intuition.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-developing-your-intuition.pdf',
    E'## Developing Your Intuition\n\nIntuition in divination is not a mystical gift that some people have and others do not. It is a trained perceptual skill — the capacity to quickly pattern-match, read emotional and contextual cues, and access knowledge that has been internalised below the level of conscious recall.\n\n### Practices That Build Intuitive Capacity\n\n**Daily card journalling.** Draw one card each morning without consulting a reference. Write your immediate impressions: colours, figures, feelings, words. Compare to the day''s events in the evening. Over months, you build a living vocabulary of the cards in your own experiential language.\n\n**Symbol saturation.** Spend extended time with a single symbol — one card, one planet, one rune — for a week. Read about it, dream with it, notice when its energy appears in daily life. Deep familiarity with symbols allows the intuition to work faster.\n\n**Embodied checking.** Before confirming an interpretation, check it in the body: does it resonate as true or does it feel like intellectual performance? The body often knows before the conscious mind catches up.\n\n**Working with clients** is itself the greatest teacher of intuition. Every reading is a feedback loop: you offer an interpretation, the client responds, and you calibrate. Over hundreds of readings, you develop an increasingly refined sense of when to lean into the technical and when to follow the thread of felt meaning.\n\nIntuition and technical knowledge are not opposites — the deepest readings arise when both are fully available and in dialogue.',
    20, 1, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson3_2_1;

  IF v_lesson3_2_1 IS NULL THEN
    SELECT id INTO v_lesson3_2_1 FROM training_lessons
    WHERE title = 'Developing Your Intuition' AND category_id = v_cat3_2;
  END IF;

  -- Lesson 3-2-2
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat3_2,
    'Combining Astrology and Tarot in a Reading',
    'How to integrate natal astrology and tarot in a single client session — using each system to illuminate the other and produce a richer, more layered reading.',
    'https://placeholder.astrologypro.com/videos/lesson-combining-astrology-and-tarot-in-a-reading.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-combining-astrology-and-tarot-in-a-reading.pdf',
    E'## Combining Astrology and Tarot in a Reading\n\nAstrology and tarot are deeply complementary. Astrology provides a long-arc structural map of a person''s life; tarot provides a present-tense mirror of current dynamics and hidden patterns. Together they produce readings with unusual depth and precision.\n\n### Structural Correspondences\n\nThe tarot deck is built on astrological correspondences. The Major Arcana cards correspond to planets and signs: the Emperor to Aries, the High Priestess to the Moon, the Sun card to the Sun itself, Judgement to Pluto/Scorpio in some systems. The Minor Arcana suits map to elements: Wands-Fire, Cups-Water, Swords-Air, Pentacles-Earth.\n\n### Integration Approaches\n\n**Chart + spread:** Begin with the natal chart to identify the core themes and current timing (transits, profections). Then use tarot to ask: *What is the deeper message here?* or *What is not visible in the chart?*\n\n**Elemental reinforcement:** If a client has a strongly watery natal chart and the reading pulls heavy Cups cards, you have double confirmation — the message is about emotional life.\n\n**Tarot for timing questions:** The astrological chart excels at timing; tarot excels at nuance and psychological texture. Use astrology to answer *when*; use tarot to answer *how it will feel* or *what is needed*.\n\n**Practical session structure:** Open with astrology (what the chart and current transits say), use tarot to deepen or clarify specific areas, close with synthesis — the message both systems are pointing toward together.',
    30, 2, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson3_2_2;

  IF v_lesson3_2_2 IS NULL THEN
    SELECT id INTO v_lesson3_2_2 FROM training_lessons
    WHERE title = 'Combining Astrology and Tarot in a Reading' AND category_id = v_cat3_2;
  END IF;

  -- Lesson 3-2-3
  INSERT INTO training_lessons (category_id, title, description, video_url, pdf_url, content, duration_mins, priority, is_active)
  VALUES (
    v_cat3_2,
    'Ethics and Boundaries in Readings',
    'The ethical responsibilities of a divination practitioner — confidentiality, informed consent, scope of practice, delivering difficult messages, and avoiding harm.',
    'https://placeholder.astrologypro.com/videos/lesson-ethics-and-boundaries-in-readings.mp4',
    'https://placeholder.astrologypro.com/pdfs/lesson-ethics-and-boundaries-in-readings.pdf',
    E'## Ethics and Boundaries in Readings\n\nEthics is not a bureaucratic add-on to divination practice — it is the foundation of trustworthy work. Clients arrive in vulnerable states, seeking clarity during periods of confusion, loss, or major decision-making. That vulnerability is a responsibility.\n\n### Core Ethical Principles\n\n**Confidentiality.** Everything a client shares in a reading is private. This includes not only what they say but what you observe about their chart or cards. Do not share client readings, even anonymised, without explicit permission.\n\n**Informed consent.** Clients should know what a reading is and is not — specifically that divination is not a medical or legal service, and that interpretations are not predictions of fixed outcomes. Set this frame clearly at the start of every session.\n\n**Scope of practice.** Diviners are not therapists, doctors, or lawyers. When a client''s presenting issue requires professional support — mental health crisis, medical diagnosis, legal advice — the ethical response is a clear, compassionate referral. A diviner who allows a distressed client to substitute readings for therapy is causing harm.\n\n**Delivering difficult messages.** Not every reading brings easy news. When the cards or chart show difficulty, your role is to present it with honesty, compassion, and agency — not to soften it into meaninglessness or to dramatise it into fear. The goal is always empowerment: *here is what the symbols suggest, here is what the person can do with that information.*\n\n**Power dynamics.** The practitioner holds positional authority in the reading space. Never use that position to foster dependence, to repeat unnecessary readings, or to suggest the client cannot access truth without you.',
    20, 3, true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_lesson3_2_3;

  IF v_lesson3_2_3 IS NULL THEN
    SELECT id INTO v_lesson3_2_3 FROM training_lessons
    WHERE title = 'Ethics and Boundaries in Readings' AND category_id = v_cat3_2;
  END IF;

  -- Quiz for Lesson 3-2-3 (ethics)
  INSERT INTO training_quizzes (lesson_id, title, questions, pass_score, is_active)
  VALUES (
    v_lesson3_2_3,
    'Ethics and Boundaries in Readings Quiz',
    '[
      {"question":"What is the primary purpose of informed consent in a reading?","options":[{"text":"To clarify what divination is and is not, so the client can engage appropriately","correct":true},{"text":"To protect the practitioner from legal liability only","correct":false},{"text":"To establish the practitioner''s credentials","correct":false},{"text":"To ensure the client believes in divination before proceeding","correct":false}]},
      {"question":"When a client''s needs fall outside the scope of divination, what is the ethical response?","options":[{"text":"A clear, compassionate referral to the appropriate professional","correct":true},{"text":"Attempt to address the issue within the reading session","correct":false},{"text":"End the session immediately without explanation","correct":false},{"text":"Offer additional paid sessions to address the concern more deeply","correct":false}]},
      {"question":"What does confidentiality require of a divination practitioner?","options":[{"text":"Keeping all client information private, including chart details and session content","correct":true},{"text":"Protecting only information explicitly marked as confidential by the client","correct":false},{"text":"Anonymising client data before sharing it for educational purposes without permission","correct":false},{"text":"Confidentiality applies only to therapeutic sessions, not divination readings","correct":false}]},
      {"question":"What is the goal when delivering a difficult message in a reading?","options":[{"text":"Presenting the information with honesty and compassion while preserving the client''s agency","correct":true},{"text":"Softening the message until the client is comfortable with it","correct":false},{"text":"Delivering the message without interpretation so the client draws their own conclusions","correct":false},{"text":"Avoiding the topic unless the client directly asks about it","correct":false}]},
      {"question":"Which of the following describes an unethical use of a practitioner''s positional authority?","options":[{"text":"Fostering client dependence by suggesting they cannot access truth without repeated readings","correct":true},{"text":"Delivering a difficult message clearly and directly","correct":false},{"text":"Referring a client to a therapist when their needs exceed scope","correct":false},{"text":"Setting a clear frame at the start of a session about what a reading is","correct":false}]}
    ]'::jsonb,
    70, true
  )
  ON CONFLICT DO NOTHING;

  -- quiz_questions for Lesson 3-2-3
  INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority)
  VALUES
    (v_lesson3_2_3, 'What is the primary purpose of informed consent in a reading?',
     '["To clarify what divination is and is not, so the client can engage appropriately","To protect the practitioner from legal liability only","To establish the practitioner''s credentials","To ensure the client believes in divination before proceeding"]'::jsonb,
     0, 'Informed consent ensures the client understands the nature of divination — what it can offer and what it cannot — before investing emotional or financial resources.', 1),
    (v_lesson3_2_3, 'When a client''s needs fall outside the scope of divination, what is the ethical response?',
     '["A clear, compassionate referral to the appropriate professional","Attempt to address the issue within the reading session","End the session immediately without explanation","Offer additional paid sessions to address the concern more deeply"]'::jsonb,
     0, 'Scope-of-practice boundaries protect the client. A warm, clear referral to the right professional is both ethical and caring.', 2),
    (v_lesson3_2_3, 'What does confidentiality require of a divination practitioner?',
     '["Keeping all client information private, including chart details and session content","Protecting only information explicitly marked as confidential by the client","Anonymising client data before sharing it for educational purposes without permission","Confidentiality applies only to therapeutic sessions, not divination readings"]'::jsonb,
     0, 'Confidentiality is total — it covers everything shared or observed in the session, without requiring the client to flag specific items.', 3),
    (v_lesson3_2_3, 'What is the goal when delivering a difficult message in a reading?',
     '["Presenting the information with honesty and compassion while preserving the client''s agency","Softening the message until the client is comfortable with it","Delivering the message without interpretation so the client draws their own conclusions","Avoiding the topic unless the client directly asks about it"]'::jsonb,
     0, 'The ethical aim is empowerment: honest delivery of what the symbols suggest, paired with compassion and an emphasis on the client''s capacity to respond.', 4),
    (v_lesson3_2_3, 'Which of the following describes an unethical use of a practitioner''s positional authority?',
     '["Fostering client dependence by suggesting they cannot access truth without repeated readings","Delivering a difficult message clearly and directly","Referring a client to a therapist when their needs exceed scope","Setting a clear frame at the start of a session about what a reading is"]'::jsonb,
     0, 'Using positional authority to create dependency is exploitative. Practitioners hold an asymmetric power position; that position must be used to empower, not to retain clients.', 5)
  ON CONFLICT DO NOTHING;

END $$;
