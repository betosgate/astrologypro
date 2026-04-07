-- Migration 061: Seed quiz questions for all training lessons missing them
-- Uses ON CONFLICT DO NOTHING (no unique constraint on quiz_questions, so just INSERT)

-- Helper: insert questions per lesson_id
-- Schema: question TEXT, options JSONB (array of strings), correct_answer INTEGER (0-based), explanation TEXT, priority INTEGER

-- ============================================================
-- LESSON: Single Card and Three Card Spreads
-- id: 4203fc32-3f59-4f8d-ab3b-fef1e20c25a1
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('4203fc32-3f59-4f8d-ab3b-fef1e20c25a1',
 'In a Three Card Spread, what does the middle card typically represent?',
 '["The past","The present","The future","The querent''s hidden feelings"]',
 1, 'The classic Three Card Spread positions are Past, Present, Future — the middle card represents the present situation.', 1),
('4203fc32-3f59-4f8d-ab3b-fef1e20c25a1',
 'A Single Card draw is best used for:',
 '["Complex multi-layered life questions","A quick daily focus or yes/no guidance","Relationship compatibility","Career path analysis"]',
 1, 'Single card pulls provide focused, concise insight — ideal for daily guidance or a simple yes/no direction.', 2),
('4203fc32-3f59-4f8d-ab3b-fef1e20c25a1',
 'Which position in a Three Card Spread reveals potential outcomes if the current path continues?',
 '["Position 1","Position 2","Position 3","All positions equally"]',
 2, 'Position 3 (Future) reflects the likely outcome based on present energies and past influences.', 3);

-- ============================================================
-- LESSON: Week 1 — The Call to the Mysteries
-- id: 56c29054-3ce9-41aa-a379-da307826c9f2
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('56c29054-3ce9-41aa-a379-da307826c9f2',
 'What is the primary purpose of the Mystery School Foundation program?',
 '["To learn astrology chart reading","To explore esoteric wisdom and inner transformation","To become a professional tarot reader","To study world religions academically"]',
 1, 'The Mystery School Foundation focuses on inner transformation through esoteric and spiritual wisdom traditions.', 1),
('56c29054-3ce9-41aa-a379-da307826c9f2',
 'The "Call to the Mysteries" refers to:',
 '["A marketing strategy for spiritual services","The inner impulse that draws a seeker toward deeper spiritual understanding","A specific tarot card spread","The first lesson in astrology"]',
 1, 'The Call to the Mysteries is the inner pull or awakening that draws a soul toward deeper esoteric study and self-knowledge.', 2),
('56c29054-3ce9-41aa-a379-da307826c9f2',
 'Which ancient tradition is most associated with mystery school teachings?',
 '["Modern psychology","The Eleusinian Mysteries of ancient Greece","20th century New Age movement","Medieval alchemy only"]',
 1, 'The Eleusinian Mysteries of ancient Greece are among the most well-documented mystery school traditions, initiating seekers into hidden spiritual truths.', 3);

-- ============================================================
-- LESSON: The Four Suits and Their Elements
-- id: 92107c41-4df0-48fc-b704-b3957f0e84e0
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('92107c41-4df0-48fc-b704-b3957f0e84e0',
 'Which element corresponds to the suit of Cups?',
 '["Fire","Earth","Water","Air"]',
 2, 'Cups are associated with the Water element, representing emotions, intuition, relationships, and the unconscious.', 1),
('92107c41-4df0-48fc-b704-b3957f0e84e0',
 'The suit of Wands is associated with which element and life area?',
 '["Water — emotions","Earth — material matters","Fire — passion and creative action","Air — thought and communication"]',
 2, 'Wands correspond to Fire, representing passion, creativity, ambition, and inspired action.', 2),
('92107c41-4df0-48fc-b704-b3957f0e84e0',
 'Pentacles (or Coins) represent:',
 '["Spiritual matters and higher consciousness","Material world, finances, health, and physical reality","Conflict, logic, and mental challenges","Emotional relationships and dreams"]',
 1, 'Pentacles are the Earth suit, dealing with practical matters: money, career, home, health, and the physical world.', 3);

-- ============================================================
-- LESSON: Understanding Transits
-- id: d81232d6-677e-4cae-a710-c8e54a3a600b
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('d81232d6-677e-4cae-a710-c8e54a3a600b',
 'An astrological transit occurs when:',
 '["Two planets align in your birth chart","A current-sky planet aspects a natal chart planet","The Moon enters a new sign","A planet stations retrograde"]',
 1, 'A transit is the real-time movement of planets through the sky forming aspects to positions in your natal (birth) chart.', 1),
('d81232d6-677e-4cae-a710-c8e54a3a600b',
 'Which planet''s transits are generally considered the most transformative due to their long duration?',
 '["Moon","Mars","Jupiter","Pluto"]',
 3, 'Pluto transits are the slowest and most transformative — they can last years and coincide with deep, irreversible life changes.', 2),
('d81232d6-677e-4cae-a710-c8e54a3a600b',
 'A transit "conjunction" means:',
 '["The transiting planet is 180° from a natal planet","The transiting planet is in the same degree as a natal planet","The transiting planet trines a natal planet","The transiting planet is in the 7th house"]',
 1, 'A conjunction (0°) is when the transiting planet is at the same degree as a natal planet, amplifying and merging its energy with the natal point.', 3);

-- ============================================================
-- LESSON: The 12 Zodiac Signs (Foundations of Astrology)
-- id: 451669f3-6c8f-4d97-872c-572716d64221
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('451669f3-6c8f-4d97-872c-572716d64221',
 'Which zodiac sign begins the astrological year at the spring equinox?',
 '["Taurus","Pisces","Aries","Capricorn"]',
 2, 'Aries (0°) marks the vernal equinox and the beginning of the astrological year, symbolizing new beginnings and initiative.', 1),
('451669f3-6c8f-4d97-872c-572716d64221',
 'Signs are grouped into three modalities. Which modality initiates and starts new cycles?',
 '["Fixed","Mutable","Cardinal","Angular"]',
 2, 'Cardinal signs (Aries, Cancer, Libra, Capricorn) initiate new seasons and new energy cycles.', 2),
('451669f3-6c8f-4d97-872c-572716d64221',
 'How many signs belong to the Earth element?',
 '["2","3","4","1"]',
 1, 'There are three Earth signs: Taurus, Virgo, and Capricorn — all focused on practical, material, and grounded concerns.', 3);

-- ============================================================
-- LESSON: The Fool's Journey — Overview of the Major Arcana
-- id: 0283c037-b4c2-467e-af67-c407d5983674
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('0283c037-b4c2-467e-af67-c407d5983674',
 'How many cards make up the Major Arcana?',
 '["21","22","78","56"]',
 1, 'The Major Arcana consists of 22 cards (numbered 0–21), from The Fool to The World.', 1),
('0283c037-b4c2-467e-af67-c407d5983674',
 'The Fool''s Journey is a metaphor for:',
 '["A beginner''s mistake in reading cards","The soul''s journey through life experiences and spiritual growth","A specific 22-card tarot spread","The history of the tarot deck"]',
 1, 'The Fool''s Journey describes the soul moving through all 22 archetypes — from innocence (The Fool) to completion (The World).', 2),
('0283c037-b4c2-467e-af67-c407d5983674',
 'Which card completes the Fool''s Journey and represents wholeness and integration?',
 '["The Star","Judgement","The Sun","The World"]',
 3, 'The World (card XXI) represents the culmination of the journey — wholeness, completion, and integration of all experiences.', 3);

-- ============================================================
-- LESSON: Booking & Intake Process
-- id: f31d4a48-5dce-431b-a221-5c497f55128c
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('f31d4a48-5dce-431b-a221-5c497f55128c',
 'What is the primary purpose of an intake form before a reading?',
 '["To collect payment information","To gather birth data and the client''s focus areas for a personalized reading","To check the client''s credit score","To verify the client''s identity"]',
 1, 'Intake forms help diviners prepare by collecting birth details, question focus, and background — leading to more accurate, personalized readings.', 1),
('f31d4a48-5dce-431b-a221-5c497f55128c',
 'Which piece of information is MOST critical for an astrology reading intake?',
 '["Client''s favorite color","Client''s exact birth date, time, and location","Client''s social media handles","Client''s employment history"]',
 1, 'Exact birth date, time, and location are essential for casting an accurate natal chart — the foundation of any astrology reading.', 2),
('f31d4a48-5dce-431b-a221-5c497f55128c',
 'When should a diviner send a booking confirmation to a client?',
 '["Only after the reading is complete","Never — clients track their own bookings","Immediately upon booking confirmation","Only if the client asks"]',
 2, 'Prompt booking confirmations establish professionalism and give clients confidence that their appointment is secured.', 3);

-- ============================================================
-- LESSON: The Fool to The Chariot (0–VII)
-- id: 12b04e49-4e65-4c71-ac90-3c0f70942535
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('12b04e49-4e65-4c71-ac90-3c0f70942535',
 'The Magician card (I) represents:',
 '["Confusion and lack of direction","Mastery of all four elements and the will to manifest","Surrender to higher forces","Deception and illusion"]',
 1, 'The Magician has all four suit tools on his table (wand, cup, sword, pentacle) and represents skill, will, and the power to manifest.', 1),
('12b04e49-4e65-4c71-ac90-3c0f70942535',
 'The High Priestess (II) is associated with:',
 '["Rational analysis and logic","Intuition, the subconscious, and hidden knowledge","Physical strength","Action and willpower"]',
 1, 'The High Priestess represents the subconscious mind, intuition, mystery, and the hidden realm between the worlds.', 2),
('12b04e49-4e65-4c71-ac90-3c0f70942535',
 'The Chariot (VII) symbolizes:',
 '["Passive surrender","Victory through determination and willpower despite opposing forces","Spiritual enlightenment","Romantic partnership"]',
 1, 'The Chariot represents triumph through focused willpower, often achieved by mastering opposing forces or inner conflicts.', 3);

-- ============================================================
-- LESSON: Developing Your Intuition
-- id: 1b145b79-cb96-4574-95b5-6763c5353fef
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('1b145b79-cb96-4574-95b5-6763c5353fef',
 'Which practice is most commonly recommended for strengthening intuition in readings?',
 '["Memorizing card meanings without reflection","Daily meditation and journaling on impressions","Analyzing statistical card frequencies","Reading only upright cards"]',
 1, 'Regular meditation and journaling build the inner stillness and self-awareness that allow intuition to surface clearly during readings.', 1),
('1b145b79-cb96-4574-95b5-6763c5353fef',
 'Intuition in a reading is best described as:',
 '["Making up meanings on the spot","Random guessing","A felt sense or knowing that arises beyond logical reasoning","Strict adherence to a textbook definition"]',
 2, 'Intuition is the felt sense or direct knowing that emerges beyond analytical reasoning — it often provides the most personally resonant insights.', 2),
('1b145b79-cb96-4574-95b5-6763c5353fef',
 'What role does "beginner''s mind" play in developing intuition?',
 '["It blocks intuition by lacking knowledge","It keeps the reader open to fresh impressions without rigid preconceptions","It means ignoring all training","It is irrelevant to intuitive development"]',
 1, 'Beginner''s mind keeps the reader receptive to direct impressions, preventing over-reliance on memorized meanings that can block intuitive flow.', 3);

-- ============================================================
-- LESSON: Your Referral Link & Commission Dashboard
-- id: d904eaf3-0967-412b-975d-7e6e232bf023
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('d904eaf3-0967-412b-975d-7e6e232bf023',
 'What does a unique referral link allow an affiliate to track?',
 '["The affiliate''s personal spending","New sign-ups or purchases attributed to their promotion","Other affiliates'' earnings","Client reading history"]',
 1, 'A unique referral link tracks clicks, sign-ups, and purchases attributed to a specific affiliate, enabling accurate commission calculation.', 1),
('d904eaf3-0967-412b-975d-7e6e232bf023',
 'Where can affiliates view their earnings and conversion stats?',
 '["Only by emailing support","The Commission Dashboard in the affiliate portal","Their personal email inbox","The admin panel only"]',
 1, 'The Commission Dashboard provides real-time visibility into clicks, conversions, and earned commissions for affiliates.', 2),
('d904eaf3-0967-412b-975d-7e6e232bf023',
 'Commission is typically calculated based on:',
 '["How many social posts an affiliate makes","Successfully converted referrals — sign-ups or purchases by new clients","The number of friends in the affiliate''s network","Monthly flat fee regardless of performance"]',
 1, 'Commission is performance-based — paid on successful conversions (actual sign-ups or purchases) traced to the affiliate''s referral link.', 3);

-- ============================================================
-- LESSON: Setting Up Your Diviner Profile
-- id: 9f065038-b881-4b2c-8fbc-588e226b8385
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('9f065038-b881-4b2c-8fbc-588e226b8385',
 'Which element of a diviner profile builds the most trust with potential clients?',
 '["Listing every certification ever earned","A professional photo and authentic bio describing your reading style","The most expensive pricing","Generic descriptions copied from other diviners"]',
 1, 'An authentic photo and bio that describes your unique approach and specialties build genuine trust and help clients choose the right reader for them.', 1),
('9f065038-b881-4b2c-8fbc-588e226b8385',
 'Specialties listed on your profile should be:',
 '["As broad as possible to attract every client","Specific and honest about your actual areas of expertise","Randomly chosen to seem more credible","Copied from top-rated diviners"]',
 1, 'Honest, specific specialties attract clients who are genuinely a good fit, leading to better readings and stronger reviews.', 2),
('9f065038-b881-4b2c-8fbc-588e226b8385',
 'Why is a complete diviner profile important for the platform?',
 '["It is required only for admin approval","It increases visibility in search results and builds client confidence","It is optional and rarely viewed","It only matters for social media sharing"]',
 1, 'A complete profile improves search ranking on the platform and gives clients the information they need to feel confident booking.', 3);

-- ============================================================
-- LESSON: Solar Returns
-- id: e906adc3-512f-41c9-b6fe-904dbcb257ea
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('e906adc3-512f-41c9-b6fe-904dbcb257ea',
 'A Solar Return chart is cast for the moment:',
 '["The Sun enters Aries each year","The transiting Sun returns to its exact natal position, usually on or near the birthday","Jupiter completes its 12-year cycle","The Moon is full in the natal Sun sign"]',
 1, 'The Solar Return chart is cast for the precise moment the Sun returns to its natal degree each year — this chart describes the themes for the coming year.', 1),
('e906adc3-512f-41c9-b6fe-904dbcb257ea',
 'The Solar Return Ascendant is significant because:',
 '["It is always the same as the natal Ascendant","It sets the tone and dominant area of focus for the year ahead","It reveals past-life karma","It only matters if it falls in a fire sign"]',
 1, 'The SR Ascendant describes the overall energy, outlook, and major theme that will color the entire year from birthday to birthday.', 2),
('e906adc3-512f-41c9-b6fe-904dbcb257ea',
 'Planets heavily emphasized in a Solar Return chart indicate:',
 '["Areas and themes that will be particularly active during the solar year","The person''s permanent personality traits","Planets that will retrograde that year","Houses that are permanently shut down"]',
 0, 'Planets prominent in the Solar Return (angular, stellium, or ruling SR chart) highlight the themes, challenges, and opportunities for the year.', 3);

-- ============================================================
-- LESSON: Major Life Transits: Saturn Return, Jupiter Return
-- id: 775f5006-3fbd-478f-8109-5001a4f23015
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('775f5006-3fbd-478f-8109-5001a4f23015',
 'At approximately what age does the first Saturn Return occur?',
 '["16–18","21–23","27–30","35–38"]',
 2, 'Saturn takes approximately 29.5 years to orbit the Sun, so the first Saturn Return occurs around ages 27–30, marking a major life maturation point.', 1),
('775f5006-3fbd-478f-8109-5001a4f23015',
 'The Jupiter Return occurs approximately every:',
 '["1 year","12 years","29 years","84 years"]',
 1, 'Jupiter takes about 12 years to complete its orbit, so Jupiter Returns occur at roughly ages 12, 24, 36, 48 — bringing new cycles of growth and opportunity.', 2),
('775f5006-3fbd-478f-8109-5001a4f23015',
 'Saturn Return is often experienced as:',
 '["A period of effortless abundance","A major restructuring — letting go of what isn''t aligned with your authentic path","A time of social withdrawal with no external changes","An entirely positive, easy life phase"]',
 1, 'Saturn Return (27–30) challenges people to shed inauthentic structures and build a life based on genuine values — often involving significant endings and new beginnings.', 3);

-- ============================================================
-- LESSON: The 10 Planets
-- id: 92b17b97-1007-4bbb-89da-43fe4a1d8bc0
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('92b17b97-1007-4bbb-89da-43fe4a1d8bc0',
 'Which planet rules communication, intellect, and short trips in astrology?',
 '["Venus","Mars","Mercury","Jupiter"]',
 2, 'Mercury governs the mind, communication, learning, short travel, and commerce — it rules Gemini and Virgo.', 1),
('92b17b97-1007-4bbb-89da-43fe4a1d8bc0',
 'The outer planets (Uranus, Neptune, Pluto) are called "generational" planets because:',
 '["They move so slowly that they affect entire generations born within years of each other","They were discovered by astronomers of that generation","They only influence elderly people","They move faster than the inner planets"]',
 0, 'Uranus (84-year cycle), Neptune (165-year), and Pluto (248-year) move so slowly they shape the collective experience of entire generational cohorts.', 2),
('92b17b97-1007-4bbb-89da-43fe4a1d8bc0',
 'Which planet is associated with expansion, abundance, luck, and higher learning?',
 '["Saturn","Mars","Jupiter","Uranus"]',
 2, 'Jupiter is the planet of expansion, good fortune, philosophy, higher education, and optimism — the great benefic of traditional astrology.', 3);

-- ============================================================
-- LESSON: Delivering Difficult Readings
-- id: e21f1580-2430-4f6e-aa6e-623b66fe44f8
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('e21f1580-2430-4f6e-aa6e-623b66fe44f8',
 'When a reading reveals challenging information, a skilled diviner should:',
 '["Withhold the information entirely","Deliver it with compassion, framing it as potential and opportunity for growth","Amplify the drama to seem more powerful","Only tell clients what they want to hear"]',
 1, 'Compassionate honesty — framing challenges as growth opportunities — is the hallmark of ethical, empowering divination.', 1),
('e21f1580-2430-4f6e-aa6e-623b66fe44f8',
 'A client becomes emotional during a reading. The best response is:',
 '["End the session immediately","Continue talking without acknowledging the emotion","Pause, acknowledge the feeling, and offer to continue when ready","Ignore the emotion and keep reading cards"]',
 2, 'Pausing to honor and acknowledge a client''s emotion creates safety and trust — the hallmark of a trauma-informed, ethical reading practice.', 2),
('e21f1580-2430-4f6e-aa6e-623b66fe44f8',
 'Which statement best reflects the ethical stance on predicting death or serious illness?',
 '["Diviners should always predict specific outcomes including death","Never predict death or diagnose illness — refer clients to appropriate professionals","Only predict death if the Tower card appears","Predict anything the cards show, no exceptions"]',
 1, 'Ethical diviners never predict death or diagnose medical conditions — these require licensed professionals, and such predictions cause harm without benefit.', 3);

-- ============================================================
-- LESSON: Week 2 — Sacred Geometry Primer
-- id: 45cddaac-b290-4f82-b549-1d3cd6ed3721
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('45cddaac-b290-4f82-b549-1d3cd6ed3721',
 'What is the Flower of Life?',
 '["A botanical diagram used in herbalism","A sacred geometric pattern of overlapping circles found in ancient temples worldwide","A New Age marketing symbol","A specific tarot card spread"]',
 1, 'The Flower of Life is a fundamental sacred geometry pattern — a lattice of overlapping circles — found in ancient Egypt, India, and many world traditions.', 1),
('45cddaac-b290-4f82-b549-1d3cd6ed3721',
 'The Golden Ratio (φ ≈ 1.618) appears in sacred geometry because:',
 '["It was invented by modern mathematicians","It appears in natural growth patterns and was used in ancient temples as a proportion of divine harmony","It is found only in computer-generated art","It has no spiritual significance"]',
 1, 'The Golden Ratio appears throughout nature (shells, galaxies, DNA) and ancient architecture as a proportion associated with beauty, harmony, and divine order.', 2),
('45cddaac-b290-4f82-b549-1d3cd6ed3721',
 'Metatron''s Cube is derived from:',
 '["The Kabbalah Tree of Life","The Flower of Life pattern — containing all Platonic solids within it","A medieval map of the zodiac","The Hermetic principles alone"]',
 1, 'Metatron''s Cube is derived from the Fruit of Life (13 circles within the Flower of Life) and is said to contain all five Platonic solids, the building blocks of creation.', 3);

-- ============================================================
-- LESSON: Strength to The World (VIII–XXI)
-- id: 63d3f1e9-c27e-4df5-9572-33beb4544747
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('63d3f1e9-c27e-4df5-9572-33beb4544747',
 'The Tower card (XVI) most commonly represents:',
 '["Slow, gradual change","Sudden revelation and the dismantling of false structures","Spiritual enlightenment and peace","A successful career change"]',
 1, 'The Tower represents sudden disruption — often a crisis that tears down false or unstable structures, ultimately clearing the way for truth.', 1),
('63d3f1e9-c27e-4df5-9572-33beb4544747',
 'The Star card (XVII) follows The Tower because:',
 '["It represents more destruction","After crisis (Tower) comes hope, renewal, and healing — the Star''s gifts","They have no thematic connection","The Star always appears after difficult cards"]',
 1, 'The Star follows The Tower to remind us that after upheaval comes renewal — the Star offers hope, healing, and faith in the future.', 2),
('63d3f1e9-c27e-4df5-9572-33beb4544747',
 'Judgement (XX) calls for:',
 '["Final endings with no redemption","A review of the past, self-evaluation, and answering a higher calling","Isolation and retreat","Material gain and success"]',
 1, 'Judgement represents awakening to a higher calling — a moment of honest self-reckoning and rising to answer the soul''s true purpose.', 3);

-- ============================================================
-- LESSON: The Planets and Their Meanings
-- id: 793fb350-fbda-40f5-bd4b-b29a406ec2de
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('793fb350-fbda-40f5-bd4b-b29a406ec2de',
 'Which planet governs love, beauty, harmony, and values?',
 '["Mars","Venus","Moon","Neptune"]',
 1, 'Venus rules love, beauty, aesthetics, values, harmony, and pleasure — it governs Taurus and Libra.', 1),
('793fb350-fbda-40f5-bd4b-b29a406ec2de',
 'The Sun in astrology represents:',
 '["The mother and early childhood","The ego, identity, vitality, and conscious will","Hidden fears and the shadow self","Communication and siblings"]',
 1, 'The Sun represents the core self — ego, identity, life force, and the area of life where one shines and seeks recognition.', 2),
('793fb350-fbda-40f5-bd4b-b29a406ec2de',
 'Saturn''s influence in a natal chart most often points to:',
 '["Easy gains and luck","Areas of discipline, restriction, karmic lessons, and long-term achievement","Romantic partnerships","Creative inspiration"]',
 1, 'Saturn shows where we must work hard, face limitations, and develop mastery through discipline — its house and sign reveal karmic lessons and areas of greatest growth.', 3);

-- ============================================================
-- LESSON: How to Read Aspects in a Chart
-- id: a2dceabb-9205-4073-89b4-8a6a370e46ff
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('a2dceabb-9205-4073-89b4-8a6a370e46ff',
 'An astrological aspect measures:',
 '["The distance between a planet and the Ascendant","The angular distance (in degrees) between two planets","The speed at which a planet moves","The brightness of a planet as seen from Earth"]',
 1, 'An aspect is the angular relationship between two planets measured in degrees — it describes how those planetary energies interact.', 1),
('a2dceabb-9205-4073-89b4-8a6a370e46ff',
 'A square aspect (90°) typically indicates:',
 '["Easy flow of energy and natural talent","Tension, friction, and the need to integrate conflicting drives","Complete harmony and partnership","Separation and endings"]',
 1, 'Squares create friction between planets, producing tension that can be challenging but also highly motivating — the energy pushes for resolution and growth.', 2),
('a2dceabb-9205-4073-89b4-8a6a370e46ff',
 'An orb in aspect interpretation refers to:',
 '["The circular chart wheel itself","The allowed margin of degrees on either side of an exact aspect angle","The color used to draw aspect lines","The speed of the faster planet"]',
 1, 'An orb is the allowed deviation from the exact aspect degree — e.g., a trine can be within 6–8° of the exact 120° and still be considered active.', 3);

-- ============================================================
-- LESSON: Wands and Pentacles
-- id: 254baf9c-56ec-4fc1-8d0b-6c3fe25b044e
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('254baf9c-56ec-4fc1-8d0b-6c3fe25b044e',
 'The Ace of Wands typically signifies:',
 '["Financial loss and stagnation","A new creative project, inspiration, or entrepreneurial spark","Emotional healing and closure","Legal disputes and conflict"]',
 1, 'The Ace of Wands is the pure essence of Fire — a seed of creative energy, inspiration, new ventures, and passionate beginnings.', 1),
('254baf9c-56ec-4fc1-8d0b-6c3fe25b044e',
 'The Ten of Pentacles represents:',
 '["Poverty and isolation","Long-term abundance, legacy, family wealth, and generational security","The completion of a difficult journey with mixed results","A major financial crisis"]',
 1, 'The Ten of Pentacles is the pinnacle of the Earth suit — representing legacy, wealth passed through generations, family stability, and lasting material security.', 2),
('254baf9c-56ec-4fc1-8d0b-6c3fe25b044e',
 'When the Five of Wands appears in a reading, it most often indicates:',
 '["Total harmony and agreement","Competition, conflict of ideas, or chaotic group energy","Financial ruin","A spiritual breakthrough"]',
 1, 'The Five of Wands shows multiple figures in conflict — representing competition, clashing opinions, or the chaos of too many competing energies.', 3);

-- ============================================================
-- LESSON: Lunar Returns and Eclipses
-- id: 7065bfa7-362c-4bb3-9703-5930ff902661
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('7065bfa7-362c-4bb3-9703-5930ff902661',
 'A Lunar Return chart is cast when:',
 '["The Moon is full","The transiting Moon returns to its exact natal position, approximately every 27–28 days","Jupiter returns to its natal position","There is a total solar eclipse"]',
 1, 'A Lunar Return chart is cast for the moment the Moon returns to its natal degree — occurring monthly, it describes the emotional themes for that lunar month.', 1),
('7065bfa7-362c-4bb3-9703-5930ff902661',
 'Solar eclipses are significant in astrology because:',
 '["They have no astrological meaning","They act as supercharged New Moons that can trigger major new beginnings, especially near natal chart points","They always cause bad luck","They only affect people born under Scorpio"]',
 1, 'Solar eclipses are powerful New Moon events that can catalyze major new beginnings and life changes, especially when they conjunct or oppose natal planets.', 2),
('7065bfa7-362c-4bb3-9703-5930ff902661',
 'Eclipse seasons occur when:',
 '["The Moon is at maximum declination","The New or Full Moon is near the Moon''s nodal axis (within ~18° of the nodes)","Saturn squares the Moon","There is a planet in retrograde"]',
 1, 'Eclipses happen when the New or Full Moon occurs close to the Moon''s nodes — the points where the Moon''s orbit crosses the ecliptic (the Sun''s apparent path).', 3);

-- ============================================================
-- LESSON: Combining Astrology and Tarot in a Reading
-- id: 1db253b7-f8ea-4fb1-a837-6a0a1918b571
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('1db253b7-f8ea-4fb1-a837-6a0a1918b571',
 'Pulling the birth chart Ascendant ruler card in a tarot reading can help:',
 '["Replace the birth chart entirely","Add a symbolic layer showing how the client''s energy and approach to life is currently expressing","Determine the client''s financial future","Choose which spread to use"]',
 1, 'Drawing the tarot card associated with the Ascendant ruler adds a complementary intuitive layer to the chart, illuminating how the client''s core identity energy is manifesting.', 1),
('1db253b7-f8ea-4fb1-a837-6a0a1918b571',
 'The Major Arcana cards are often linked to planets and signs. The Emperor (IV) corresponds to:',
 '["Venus","The Moon","Aries (and Mars)","Scorpio"]',
 2, 'The Emperor (IV) is associated with Aries — reflecting authority, structure, assertiveness, and the archetype of the pioneering ruler.', 2),
('1db253b7-f8ea-4fb1-a837-6a0a1918b571',
 'When combining astrology and tarot, the purpose is to:',
 '["Make readings longer to justify higher fees","Cross-reference symbolic systems to provide deeper, more nuanced insights","Replace one modality with the other","Confuse the client with too much information"]',
 1, 'Combining modalities enriches readings — each system illuminates different facets, and their convergence points often reveal the most significant insights.', 3);

-- ============================================================
-- LESSON: Aspect Patterns: Grand Trine, T-Square, Yod
-- id: 2d056e2e-6180-4493-b5a2-89b0cab46bf8
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('2d056e2e-6180-4493-b5a2-89b0cab46bf8',
 'A Grand Trine consists of:',
 '["Three planets each 90° apart","Three planets each 120° apart, forming an equilateral triangle","Two planets in opposition with a third square to both","Four planets in squares"]',
 1, 'A Grand Trine involves three planets each approximately 120° apart — they form an equilateral triangle, indicating natural talent and ease in that element.', 1),
('2d056e2e-6180-4493-b5a2-89b0cab46bf8',
 'A T-Square involves:',
 '["Three planets in harmonious trines","Two planets in opposition (180°), with a third planet squaring both — creating intense dynamic tension","Two planets in conjunction and one in trine","Three planets all in the same sign"]',
 1, 'A T-Square has an opposition (180°) as its base with a third planet squaring both ends — the apex planet receives intense pressure and represents the key challenge to resolve.', 2),
('2d056e2e-6180-4493-b5a2-89b0cab46bf8',
 'The Yod (Finger of God) is known as a fated configuration because:',
 '["It always brings misfortune","Two planets in sextile (60°) both quincunx (150°) a third, pointing to an area of life requiring constant adjustment and a sense of special purpose","It appears in every natal chart","Three planets are in exact conjunction"]',
 1, 'The Yod''s two quincunx (150°) aspects create an uncomfortable, unresolvable tension pointing to the apex planet — suggesting a karmic mission or area requiring perpetual adjustment.', 3);

-- ============================================================
-- LESSON: Cups and Swords
-- id: d173f50f-9411-4b62-9239-c47d27c04fe4
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('d173f50f-9411-4b62-9239-c47d27c04fe4',
 'The suit of Swords is associated with:',
 '["Earth and practical matters","Water and emotions","Air — the realm of thought, communication, conflict, and truth","Fire and creative passion"]',
 2, 'Swords correspond to the Air element — governing intellect, communication, conflict, clarity, and sometimes painful but necessary truths.', 1),
('d173f50f-9411-4b62-9239-c47d27c04fe4',
 'The Two of Cups typically represents:',
 '["Financial partnership only","A harmonious emotional connection, new relationship, or mutual attraction between two people","Conflict and separation","A period of emotional overwhelm"]',
 1, 'The Two of Cups is a card of deep connection — often indicating a new romantic relationship, soulmate encounter, or harmonious emotional partnership.', 2),
('d173f50f-9411-4b62-9239-c47d27c04fe4',
 'The Ace of Swords signifies:',
 '["Confusion and mental fog","Emotional healing and peace","A breakthrough in clarity, truth, and the power of a new idea or decision","Material abundance"]',
 2, 'The Ace of Swords is pure Air energy — a flash of clarity, a new idea, or a decisive truth that cuts through confusion.', 3);

-- ============================================================
-- LESSON: Cards 8–14: Strength through Temperance
-- id: b9f3edf5-dd7c-452b-8ad4-f43e8ea22efe
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('b9f3edf5-dd7c-452b-8ad4-f43e8ea22efe',
 'Strength (VIII) in the Rider-Waite tradition is symbolized by:',
 '["A knight in armor slaying a dragon","A woman gently closing a lion''s mouth, symbolizing compassionate mastery over raw instinct","A warrior defeating enemies in battle","A hermit alone on a mountaintop"]',
 1, 'The Rider-Waite Strength card shows a woman calmly managing a lion — representing inner strength, courage, patience, and taming the instinctual nature through love rather than force.', 1),
('b9f3edf5-dd7c-452b-8ad4-f43e8ea22efe',
 'The Wheel of Fortune (X) represents:',
 '["A fixed, unchangeable fate","The cyclical nature of life, luck, karma, and the turning of cycles","Only financial fortune","A bad omen in all positions"]',
 1, 'The Wheel of Fortune acknowledges that life is cyclic — what goes down will rise again; the card invites surrender to the flow of cycles rather than resistance.', 2),
('b9f3edf5-dd7c-452b-8ad4-f43e8ea22efe',
 'Temperance (XIV) asks the querent to:',
 '["Choose one extreme or the other","Give up all earthly pleasures","Find balance, integration, and the middle path between opposing forces","Focus entirely on spiritual pursuits"]',
 1, 'Temperance calls for moderation, integration, and alchemy — blending opposites in harmonious proportions to find the sustainable middle way.', 3);

-- ============================================================
-- LESSON: Profections and Firdaria
-- id: f61885bf-25cc-4b89-acb9-ed1402acb474
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('f61885bf-25cc-4b89-acb9-ed1402acb474',
 'Annual Profections work by:',
 '["Transiting the outer planets to the natal chart","Advancing the natal Ascendant one house per year of life, activating the Lord of that house as the Year Lord","Calculating the solar arc direction","Tracking Jupiter''s position each birthday"]',
 1, 'Annual Profections advance the chart by one house per year — at age 0 it begins in the 1st house, age 1 moves to 2nd, and so on (cycling every 12 years), making the house ruler the Year Lord.', 1),
('f61885bf-25cc-4b89-acb9-ed1402acb474',
 'Firdaria is a Hellenistic/Persian timing technique that:',
 '["Divides life into equal 10-year periods for each planet","Assigns sequential rulership periods of varying lengths to each of the seven traditional planets plus the lunar nodes","Uses solar arcs for predictions","Is synonymous with progressions"]',
 1, 'Firdaria assigns each planet a multi-year period of influence over life (the Sun gets 10 years, the Moon 9 years, etc.) — helping astrologers understand which planetary themes dominate a given period.', 2),
('f61885bf-25cc-4b89-acb9-ed1402acb474',
 'In Profections, at age 24, which house is activated?',
 '["12th house","1st house","2nd house","3rd house"]',
 1, '24 ÷ 12 = 2 remainder 0 — the cycle completes twice. Age 24 is a 1st house profection year (a repeat of age 0, 12, 24, 36, etc.), making the Ascendant ruler the Year Lord.', 2),

-- ============================================================
-- LESSON: The 12 Houses (Tarot Mastery category)
-- id: 43c12531-f752-4c06-a999-b8b24618cc9b
-- ============================================================
('43c12531-f752-4c06-a999-b8b24618cc9b',
 'The 1st House in astrology primarily represents:',
 '["Hidden enemies and secret sorrows","The self, physical body, appearance, and approach to life","Partnerships and marriage","Career and public reputation"]',
 1, 'The 1st House (Ascendant) represents the physical self, appearance, first impressions, and the instinctive way one approaches the world.', 1),
('43c12531-f752-4c06-a999-b8b24618cc9b',
 'Which house governs marriage and close one-on-one partnerships?',
 '["5th house","7th house","11th house","3rd house"]',
 1, 'The 7th House governs committed partnerships including marriage, business partnerships, and open enemies — it is directly opposite the 1st house of self.', 2),
('43c12531-f752-4c06-a999-b8b24618cc9b',
 'The 10th House is associated with:',
 '["Home, family, and the mother","Career, public image, social status, and authority","Friends, groups, and hopes","Travel, philosophy, and higher education"]',
 1, 'The 10th House (MC/Midheaven) governs career, public reputation, achievements, and how one is seen in the world — often linked to the father or authority figures.', 3);

-- ============================================================
-- LESSON: Creating Custom Spreads
-- id: 60de131b-f478-47ad-9b2d-5836bb8c3c1d
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('60de131b-f478-47ad-9b2d-5836bb8c3c1d',
 'When designing a custom tarot spread, the first step is:',
 '["Choose the card meanings at random","Define the clear intention and question the spread is designed to answer","Pick a number of cards that feels lucky","Copy an existing spread exactly"]',
 1, 'A well-designed spread begins with a clear intention — defining exactly what question or life area each position is meant to illuminate.', 1),
('60de131b-f478-47ad-9b2d-5836bb8c3c1d',
 'Each position in a custom spread should:',
 '["Have a vague label so interpretations stay flexible","Have a specific, clearly defined meaning so the reader knows exactly what energy each card speaks to","Be drawn in a circular pattern always","Be identical to standard spread positions"]',
 1, 'Clear, specific position labels prevent confusion and help both reader and client understand exactly what dimension of the question each card addresses.', 2),
('60de131b-f478-47ad-9b2d-5836bb8c3c1d',
 'The number of cards in a spread should be determined by:',
 '["Using as many cards as possible for maximum detail","The complexity of the question — simple questions need fewer positions; complex questions may need more","Always using exactly 10 cards","The number that was used in your first ever reading"]',
 1, 'Spread size should match the question — a simple yes/no needs 1–3 cards; deep life questions may need 7–10+. Unnecessary positions dilute focus and confuse the reading.', 3);

-- ============================================================
-- LESSON: Secondary Progressions
-- id: a813091e-677a-4d66-b901-a334e5370e30
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('a813091e-677a-4d66-b901-a334e5370e30',
 'Secondary Progressions are based on the symbolic equation:',
 '["One month of life equals one year of progressed chart movement","One day after birth equals one year of life","One year equals one degree of solar arc","The actual daily transit of the Sun"]',
 1, 'Secondary Progressions use the "a day for a year" formula — the chart position of each planet on day N after birth symbolically describes year N of life.', 1),
('a813091e-677a-4d66-b901-a334e5370e30',
 'The Progressed Moon is particularly important because:',
 '["It moves very slowly, taking 30 years per sign","It moves approximately one degree per month, completing a full chart cycle in ~27 years, marking emotional chapters of life","It is always in the same sign as the natal Moon","It only matters when it goes retrograde"]',
 1, 'The Progressed Moon moves about 1°/month and marks significant emotional and life chapters — its sign, house, and aspects reveal the inner emotional climate of any given period.', 2),
('a813091e-677a-4d66-b901-a334e5370e30',
 'A Progressed New Moon is significant because:',
 '["It only happens once in a lifetime and brings wealth","It begins a 29-year cycle of new beginnings in whatever area of the chart it falls, seeding new life chapters","It always indicates a relationship ending","It speeds up the progressed chart temporarily"]',
 1, 'A Progressed New Moon (Sun conjunct Moon by progression) marks the start of a major 29-year chapter — a powerful time for new beginnings in the relevant house.', 3);

-- ============================================================
-- LESSON: Court Cards: Pages, Knights, Queens, Kings
-- id: f76d9dbb-bee8-4cf2-8159-d33ffcabf27d
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('f76d9dbb-bee8-4cf2-8159-d33ffcabf27d',
 'Court cards in a reading can represent:',
 '["Only the querent","Only other people","The querent, another person, or an aspect of personality/energy in a situation","Only abstract spiritual forces"]',
 2, 'Court cards are highly flexible — they can represent the querent, another person in the situation, or a quality/energy the querent is expressing or needs to embody.', 1),
('f76d9dbb-bee8-4cf2-8159-d33ffcabf27d',
 'Pages in the tarot represent:',
 '["Authority, mastery, and leadership","Youthful energy, new messages, beginners, or the initial spark of a suit''s energy","Mature, balanced feminine energy","Action-oriented, ambitious pursuit"]',
 1, 'Pages represent youth, new beginnings, messages, and the learning phase of each suit''s energy — they are students and messengers.', 2),
('f76d9dbb-bee8-4cf2-8159-d33ffcabf27d',
 'The Queen of Cups is most associated with:',
 '["Aggressive action and ambition","Logical analysis and critical thinking","Deep emotional intelligence, empathy, intuition, and nurturing energy","Financial management and practical skill"]',
 2, 'The Queen of Cups embodies the highest expression of Water — profound emotional intelligence, psychic sensitivity, compassion, and the ability to nurture from a full heart.', 3);

-- ============================================================
-- LESSON: The 12 Houses (Astrology category)
-- id: c2572092-0198-4138-ab1f-0680c2d79891
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('c2572092-0198-4138-ab1f-0680c2d79891',
 'The 4th House in a natal chart governs:',
 '["Career and public recognition","Home, family, roots, ancestry, and the private inner foundation","Friends and social groups","Creative self-expression and romance"]',
 1, 'The 4th House (IC) governs the home, family of origin, ancestry, psychological foundation, and later the home you create — it is the most private, inner part of the chart.', 1),
('c2572092-0198-4138-ab1f-0680c2d79891',
 'Planets in the 12th House are often described as:',
 '["Easy to express and highly visible","Hidden, unconscious, or self-undermining — they often operate behind the scenes","Career-oriented and ambitious","Relationship-focused and partnership-driven"]',
 1, 'The 12th House governs the hidden, unconscious, and collective realm — planets here often operate from the subconscious and may be difficult to consciously access or express.', 2),
('c2572092-0198-4138-ab1f-0680c2d79891',
 'The 8th House governs which life area?',
 '["Daily routines, health, and work","Transformation, shared resources, inheritance, sexuality, death, and rebirth","Long-distance travel and higher education","Siblings and local community"]',
 1, 'The 8th House rules deep transformation, shared resources (debt, inheritance, partner''s money), sexuality, psychological depth, and the cycle of death and rebirth.', 3);

-- ============================================================
-- LESSON: Cards 15–21: The Devil through The World
-- id: 5a10bb7c-830b-4d59-958d-0d77fcb74170
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('5a10bb7c-830b-4d59-958d-0d77fcb74170',
 'The Devil card (XV) most often represents:',
 '["Pure evil and irredeemable darkness","Bondage to material desires, unhealthy patterns, or self-limiting beliefs — and the reminder that the chains can be removed","A warning to avoid all pleasure","Spiritual mastery and transcendence"]',
 1, 'The Devil shows two figures chained — yet the chains are loose. It represents the illusions and addictions that bind us, and the empowering truth that we can free ourselves.', 1),
('5a10bb7c-830b-4d59-958d-0d77fcb74170',
 'The Moon card (XVIII) deals primarily with:',
 '["Clarity, reason, and logic","The subconscious, illusions, fears, and navigating the uncertain dark night of the soul","Material wealth and security","Professional success and public recognition"]',
 1, 'The Moon illuminates the subconscious landscape — it is the card of dreams, fears, hidden truths, and the unsettling beauty of navigating uncertain emotional waters.', 2),
('5a10bb7c-830b-4d59-958d-0d77fcb74170',
 'The Sun card (XIX) primarily represents:',
 '["Hidden wisdom only accessible to initiates","Clarity, vitality, joy, success, and the pure radiance of conscious awareness","Sadness and endings","A warning about overconfidence"]',
 1, 'The Sun is the most joyful card in the Major Arcana — radiating clarity, vitality, success, childlike joy, and the warming light of full consciousness.', 3);

-- ============================================================
-- LESSON: The 12 Zodiac Signs (Tarot Mastery program)
-- id: 07e7be58-d797-4790-b1d1-bd4c87fb9f70
-- ============================================================
INSERT INTO quiz_questions (lesson_id, question, options, correct_answer, explanation, priority) VALUES
('07e7be58-d797-4790-b1d1-bd4c87fb9f70',
 'Scorpio is a Fixed Water sign ruled by:',
 '["Venus","Jupiter","Pluto (modern) and Mars (traditional)","Saturn"]',
 2, 'Scorpio is ruled by Pluto in modern astrology and Mars in traditional — reflecting its themes of intensity, transformation, depth, power, and regeneration.', 1),
('07e7be58-d797-4790-b1d1-bd4c87fb9f70',
 'The Mutable signs are:',
 '["Aries, Cancer, Libra, Capricorn","Taurus, Leo, Scorpio, Aquarius","Gemini, Virgo, Sagittarius, Pisces","Aries, Taurus, Gemini, Cancer"]',
 2, 'The Mutable signs (Gemini, Virgo, Sagittarius, Pisces) are adaptable, flexible, and transitional — they bridge one season into the next.', 2),
('07e7be58-d797-4790-b1d1-bd4c87fb9f70',
 'Which sign is known as the natural ruler of the 9th house and is associated with philosophy, higher learning, and travel?',
 '["Capricorn","Aquarius","Sagittarius","Libra"]',
 2, 'Sagittarius naturally rules the 9th house — governing philosophy, foreign travel, higher education, religion, and the quest for meaning.', 3);
