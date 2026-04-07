-- ============================================================
-- Tarot Admin Seed — 5 spreads + 78 cards
-- Idempotent: skips rows that already exist by name
-- ============================================================

-- ── TAROT SPREADS ────────────────────────────────────────────────────────────

INSERT INTO tarot_spreads (name, description, card_count, layout_json, is_active, priority)
SELECT * FROM (VALUES
  (
    'Three Card Spread',
    'A simple, powerful spread revealing Past, Present, and Future influences.',
    3,
    '{"position_labels": ["Past", "Present", "Future"]}'::jsonb,
    true,
    10
  ),
  (
    'Celtic Cross',
    'The most widely used tarot spread, offering a deep and comprehensive reading across 10 positions covering the querent''s situation from every angle.',
    10,
    '{"position_labels": ["Present Situation", "Crossing Influence", "Root Cause", "Recent Past", "Possible Outcome", "Near Future", "Your Attitude", "External Influences", "Hopes and Fears", "Final Outcome"]}'::jsonb,
    true,
    20
  ),
  (
    'Horseshoe Spread',
    'A seven-card arc covering past, present, hidden influences, obstacles, external factors, advice, and likely outcome.',
    7,
    '{"position_labels": ["Past", "Present", "Hidden Influences", "Obstacles", "External Factors", "Advice", "Likely Outcome"]}'::jsonb,
    true,
    15
  ),
  (
    'Single Card Draw',
    'A focused single-card pull for daily guidance, a quick answer, or a meditation focus.',
    1,
    '{"position_labels": ["Card of the Day"]}'::jsonb,
    true,
    5
  ),
  (
    'Relationship Spread',
    'A seven-position spread exploring both individuals, the relationship dynamic, challenges, strengths, potential, and outcome.',
    7,
    '{"position_labels": ["You", "Your Partner", "The Relationship", "Strengths", "Challenges", "What to Nurture", "Potential Outcome"]}'::jsonb,
    true,
    18
  )
) AS v(name, description, card_count, layout_json, is_active, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM tarot_spreads WHERE tarot_spreads.name = v.name
);

-- ── TAROT CARDS — MAJOR ARCANA ───────────────────────────────────────────────

INSERT INTO tarot_cards (name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
SELECT * FROM (VALUES
  ('The Fool',          'major', 'Major Arcana',  0, 'New beginnings, spontaneity, and a leap of faith into the unknown with pure potential.',                              'Recklessness, naivety, or holding back from a necessary new start.',             'https://placeholder.astrologypro.com/tarot/major-the-fool.jpg',          true),
  ('The Magician',      'major', 'Major Arcana',  1, 'Willpower, skill, and the ability to manifest desires through focused intention.',                                    'Manipulation, poor planning, or untapped talents going to waste.',              'https://placeholder.astrologypro.com/tarot/major-the-magician.jpg',      true),
  ('The High Priestess','major', 'Major Arcana',  2, 'Intuition, mystery, and deep inner knowing that transcends rational understanding.',                                  'Secrets withheld, disconnection from intuition, or surface-level thinking.',    'https://placeholder.astrologypro.com/tarot/major-the-high-priestess.jpg',true),
  ('The Empress',       'major', 'Major Arcana',  3, 'Fertility, abundance, creativity, and nurturing energy that brings growth and beauty.',                               'Creative block, dependence, or smothering those you care for.',                 'https://placeholder.astrologypro.com/tarot/major-the-empress.jpg',       true),
  ('The Emperor',       'major', 'Major Arcana',  4, 'Authority, structure, and stability established through discipline and rational leadership.',                         'Rigidity, domination, or an inability to adapt to necessary change.',           'https://placeholder.astrologypro.com/tarot/major-the-emperor.jpg',       true),
  ('The Hierophant',    'major', 'Major Arcana',  5, 'Tradition, spiritual guidance, and conformity to established wisdom and institutions.',                               'Rebellion against convention, unconventional paths, or dogmatism.',             'https://placeholder.astrologypro.com/tarot/major-the-hierophant.jpg',    true),
  ('The Lovers',        'major', 'Major Arcana',  6, 'Deep connection, alignment of values, and meaningful choices made from the heart.',                                   'Misalignment, disharmony in relationships, or avoidance of difficult choices.', 'https://placeholder.astrologypro.com/tarot/major-the-lovers.jpg',        true),
  ('The Chariot',       'major', 'Major Arcana',  7, 'Determination, victory, and forward momentum achieved through focused willpower and control.',                        'Lack of direction, aggression, or being pulled apart by conflicting forces.',    'https://placeholder.astrologypro.com/tarot/major-the-chariot.jpg',       true),
  ('Strength',          'major', 'Major Arcana',  8, 'Courage, inner strength, and patience that tames raw instinct through compassion rather than force.',                 'Self-doubt, weakness, or allowing fear to override your better nature.',         'https://placeholder.astrologypro.com/tarot/major-strength.jpg',          true),
  ('The Hermit',        'major', 'Major Arcana',  9, 'Soul-searching, solitude, and the inner wisdom found by withdrawing from external noise.',                            'Isolation, withdrawal into loneliness, or refusing to accept guidance.',         'https://placeholder.astrologypro.com/tarot/major-the-hermit.jpg',        true),
  ('Wheel of Fortune',  'major', 'Major Arcana', 10, 'Cycles of fate, turning points, and the ever-changing nature of luck and destiny.',                                   'Bad luck, resistance to change, or being stuck in a repeating cycle.',          'https://placeholder.astrologypro.com/tarot/major-wheel-of-fortune.jpg',  true),
  ('Justice',           'major', 'Major Arcana', 11, 'Fairness, truth, and the law of cause and effect delivering balanced outcomes.',                                      'Injustice, dishonesty, or avoiding accountability for your actions.',           'https://placeholder.astrologypro.com/tarot/major-justice.jpg',           true),
  ('The Hanged Man',    'major', 'Major Arcana', 12, 'Suspension, new perspectives, and the wisdom gained by surrendering and letting go.',                                 'Delays, resistance to surrender, or martyrdom without meaningful purpose.',      'https://placeholder.astrologypro.com/tarot/major-the-hanged-man.jpg',    true),
  ('Death',             'major', 'Major Arcana', 13, 'Transformation, endings, and necessary closure that clears the way for profound renewal.',                            'Fear of change, stagnation, or clinging to what has already run its course.',   'https://placeholder.astrologypro.com/tarot/major-death.jpg',             true),
  ('Temperance',        'major', 'Major Arcana', 14, 'Balance, patience, and the alchemy of blending opposites into harmonious moderation.',                                'Imbalance, excess, or a lack of long-term vision causing unnecessary friction.', 'https://placeholder.astrologypro.com/tarot/major-temperance.jpg',        true),
  ('The Devil',         'major', 'Major Arcana', 15, 'Bondage, materialism, and the shadow patterns that keep you trapped in unhealthy cycles.',                            'Release from bondage, reclaiming power, or breaking free from addiction.',      'https://placeholder.astrologypro.com/tarot/major-the-devil.jpg',         true),
  ('The Tower',         'major', 'Major Arcana', 16, 'Sudden upheaval, revelation, and the collapse of false foundations to reveal truth.',                                 'Avoiding necessary change, fear of disaster, or a crisis narrowly averted.',    'https://placeholder.astrologypro.com/tarot/major-the-tower.jpg',         true),
  ('The Star',          'major', 'Major Arcana', 17, 'Hope, renewal, and deep faith that healing and better times are already on the way.',                                  'Despair, lack of faith, or feeling disconnected from your sense of purpose.',   'https://placeholder.astrologypro.com/tarot/major-the-star.jpg',          true),
  ('The Moon',          'major', 'Major Arcana', 18, 'Illusion, the unconscious mind, and the fears and dreams that surface in unclear times.',                             'Confusion lifting, hidden truths emerging, or release of deep-seated fears.',   'https://placeholder.astrologypro.com/tarot/major-the-moon.jpg',          true),
  ('The Sun',           'major', 'Major Arcana', 19, 'Joy, vitality, success, and the radiant clarity of living in full alignment with your truth.',                        'Temporary setbacks, excessive optimism, or hiding your true light from others.', 'https://placeholder.astrologypro.com/tarot/major-the-sun.jpg',           true),
  ('Judgement',         'major', 'Major Arcana', 20, 'Reflection, reckoning, and a powerful call to rise into your higher self and purpose.',                               'Self-doubt, fear of judgment, or ignoring the call to transformation.',         'https://placeholder.astrologypro.com/tarot/major-judgement.jpg',         true),
  ('The World',         'major', 'Major Arcana', 21, 'Completion, wholeness, and the triumphant celebration of a cycle fully and beautifully realized.',                    'Incompletion, shortcuts taken, or an unwillingness to see a journey through.',  'https://placeholder.astrologypro.com/tarot/major-the-world.jpg',         true)
) AS v(name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM tarot_cards WHERE tarot_cards.name = v.name AND tarot_cards.arcana = 'major'
);

-- ── TAROT CARDS — MINOR ARCANA: WANDS ───────────────────────────────────────

INSERT INTO tarot_cards (name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
SELECT * FROM (VALUES
  ('Ace of Wands',   'minor', 'Wands',  1, 'A spark of inspiration, creative potential, and the enthusiastic beginning of a bold new venture.',       'Delays, lack of motivation, or creative energy with no clear outlet.',              'https://placeholder.astrologypro.com/tarot/wands-ace.jpg',    true),
  ('Two of Wands',   'minor', 'Wands',  2, 'Future planning, personal power, and the courageous decision to step beyond familiar horizons.',           'Fear of the unknown, indecision, or poor long-range planning holding you back.',    'https://placeholder.astrologypro.com/tarot/wands-02.jpg',     true),
  ('Three of Wands', 'minor', 'Wands',  3, 'Expansion, foresight, and confident anticipation as your plans begin to move into the wider world.',       'Obstacles to progress, delays in travel or plans, or lack of foresight.',           'https://placeholder.astrologypro.com/tarot/wands-03.jpg',     true),
  ('Four of Wands',  'minor', 'Wands',  4, 'Celebration, homecoming, and joyful community marking a milestone of harmony and achievement.',            'Lack of harmony at home, postponed celebrations, or instability in foundations.',  'https://placeholder.astrologypro.com/tarot/wands-04.jpg',     true),
  ('Five of Wands',  'minor', 'Wands',  5, 'Competition, conflict, and the creative tension of multiple energies and ideas clashing productively.',    'Avoiding conflict, releasing tension, or finding ways to collaborate rather than compete.', 'https://placeholder.astrologypro.com/tarot/wands-05.jpg', true),
  ('Six of Wands',   'minor', 'Wands',  6, 'Victory, public recognition, and the earned confidence that comes from achieving your goals.',             'Fall from grace, lack of recognition, or success undermined by ego.',               'https://placeholder.astrologypro.com/tarot/wands-06.jpg',     true),
  ('Seven of Wands', 'minor', 'Wands',  7, 'Perseverance, defending your position, and standing firm against opposition or challenge.',                'Giving up, being overwhelmed, or exhaustion from fighting battles on too many fronts.', 'https://placeholder.astrologypro.com/tarot/wands-07.jpg', true),
  ('Eight of Wands', 'minor', 'Wands',  8, 'Swift action, rapid progress, and the exciting momentum of events finally moving quickly forward.',        'Delays, frustration, or communication misfires disrupting forward momentum.',       'https://placeholder.astrologypro.com/tarot/wands-08.jpg',     true),
  ('Nine of Wands',  'minor', 'Wands',  9, 'Resilience, persistence, and the last reserves of strength summoned to see something important through.',  'Stubbornness, paranoia, or exhaustion from refusing to ask for help.',              'https://placeholder.astrologypro.com/tarot/wands-09.jpg',     true),
  ('Ten of Wands',   'minor', 'Wands', 10, 'Burden, overcommitment, and the weight of responsibility carried too long without delegation.',            'Release of burdens, delegation, or finally setting down what was never yours to carry.', 'https://placeholder.astrologypro.com/tarot/wands-10.jpg', true),
  ('Page of Wands',  'minor', 'Wands', 11, 'Enthusiasm, curiosity, and the free-spirited exploration of new ideas and creative possibilities.',        'Immaturity, lack of follow-through, or impulsive action without considered direction.', 'https://placeholder.astrologypro.com/tarot/wands-page.jpg', true),
  ('Knight of Wands','minor', 'Wands', 12, 'Adventure, passion, and fearless pursuit of exciting goals with unstoppable fiery energy.',                'Impulsiveness, recklessness, or hot-headed action creating unnecessary chaos.',     'https://placeholder.astrologypro.com/tarot/wands-knight.jpg', true),
  ('Queen of Wands', 'minor', 'Wands', 13, 'Confidence, charisma, and the vibrant creative leadership of someone who inspires all around her.',        'Selfishness, jealousy, or burning bright while secretly feeling insecure inside.',  'https://placeholder.astrologypro.com/tarot/wands-queen.jpg',  true),
  ('King of Wands',  'minor', 'Wands', 14, 'Vision, entrepreneurship, and the bold leadership of someone who turns big ideas into lasting reality.',   'Impulsive decisions, unrealistic visions, or a domineering approach to leadership.','https://placeholder.astrologypro.com/tarot/wands-king.jpg',  true)
) AS v(name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM tarot_cards WHERE tarot_cards.name = v.name AND tarot_cards.suit = 'Wands'
);

-- ── TAROT CARDS — MINOR ARCANA: CUPS ────────────────────────────────────────

INSERT INTO tarot_cards (name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
SELECT * FROM (VALUES
  ('Ace of Cups',   'minor', 'Cups',  1, 'New emotional beginnings, overflowing love, and the gift of deep intuitive connection.',                    'Emotional repression, blocked feelings, or an inability to open to love and joy.',  'https://placeholder.astrologypro.com/tarot/cups-ace.jpg',    true),
  ('Two of Cups',   'minor', 'Cups',  2, 'Partnership, mutual attraction, and the beautiful harmony of two hearts coming together.',                  'Imbalance in relationships, broken bonds, or a misalignment of emotional needs.',   'https://placeholder.astrologypro.com/tarot/cups-02.jpg',     true),
  ('Three of Cups', 'minor', 'Cups',  3, 'Celebration, friendship, and the joyful abundance of community, creative collaboration, and shared love.',  'Overindulgence, gossip, or a group dynamic that has become superficial or draining.','https://placeholder.astrologypro.com/tarot/cups-03.jpg',     true),
  ('Four of Cups',  'minor', 'Cups',  4, 'Contemplation, apathy, and the tendency to overlook blessings while lost in inner reflection.',             'Renewed motivation, openness to new opportunities, or emerging from withdrawal.',   'https://placeholder.astrologypro.com/tarot/cups-04.jpg',     true),
  ('Five of Cups',  'minor', 'Cups',  5, 'Grief, loss, and the painful process of mourning what has been spilled while hope still remains.',          'Moving on from grief, acceptance, or finally turning to face what remains.',        'https://placeholder.astrologypro.com/tarot/cups-05.jpg',     true),
  ('Six of Cups',   'minor', 'Cups',  6, 'Nostalgia, innocence, and the warm comfort of happy memories and childhood connections revisited.',          'Living in the past, naive idealism, or inability to release what is gone.',         'https://placeholder.astrologypro.com/tarot/cups-06.jpg',     true),
  ('Seven of Cups', 'minor', 'Cups',  7, 'Fantasy, wishful thinking, and the abundance of choices that can overwhelm without discernment.',           'Clarity returning after confusion, or making a grounded choice from many options.',  'https://placeholder.astrologypro.com/tarot/cups-07.jpg',     true),
  ('Eight of Cups', 'minor', 'Cups',  8, 'Walking away, disillusionment, and the brave choice to leave behind what no longer fulfills you.',          'Fear of moving on, stagnation, or staying in a situation that has long run its course.', 'https://placeholder.astrologypro.com/tarot/cups-08.jpg', true),
  ('Nine of Cups',  'minor', 'Cups',  9, 'Contentment, wish fulfillment, and the deep satisfaction of emotional and material wellbeing.',             'Complacency, over-indulgence, or a hollow satisfaction that masks deeper emptiness.','https://placeholder.astrologypro.com/tarot/cups-09.jpg',     true),
  ('Ten of Cups',   'minor', 'Cups', 10, 'Emotional fulfillment, lasting happiness, and the bliss of a harmonious family or community life.',         'Broken family ties, disharmony at home, or happiness disrupted by unresolved conflict.', 'https://placeholder.astrologypro.com/tarot/cups-10.jpg', true),
  ('Page of Cups',  'minor', 'Cups', 11, 'Creative sensitivity, intuitive messages, and the imaginative inner world of an emotionally open soul.',    'Emotional immaturity, creative blocks, or retreating into daydreams to avoid reality.','https://placeholder.astrologypro.com/tarot/cups-page.jpg', true),
  ('Knight of Cups','minor', 'Cups', 12, 'Romance, charm, and the idealistic pursuit of beauty, connection, and deeply meaningful experiences.',      'Moodiness, unrealistic expectations, or emotional manipulation disguised as romance.','https://placeholder.astrologypro.com/tarot/cups-knight.jpg', true),
  ('Queen of Cups', 'minor', 'Cups', 13, 'Compassion, emotional intelligence, and the nurturing wisdom of someone deeply in tune with her heart.',    'Emotional overwhelm, co-dependency, or moodiness that unsettles those around her.', 'https://placeholder.astrologypro.com/tarot/cups-queen.jpg',  true),
  ('King of Cups',  'minor', 'Cups', 14, 'Emotional maturity, wise leadership, and the calm mastery of feelings that allows compassionate authority.', 'Emotional manipulation, moodiness, or using sensitivity as a tool for control.',    'https://placeholder.astrologypro.com/tarot/cups-king.jpg',   true)
) AS v(name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM tarot_cards WHERE tarot_cards.name = v.name AND tarot_cards.suit = 'Cups'
);

-- ── TAROT CARDS — MINOR ARCANA: PENTACLES ───────────────────────────────────

INSERT INTO tarot_cards (name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
SELECT * FROM (VALUES
  ('Ace of Pentacles',   'minor', 'Pentacles',  1, 'A new financial opportunity, material abundance, and the seed of a prosperous and grounded new beginning.',   'Missed opportunity, financial instability, or poor planning undermining material security.', 'https://placeholder.astrologypro.com/tarot/pentacles-ace.jpg',    true),
  ('Two of Pentacles',   'minor', 'Pentacles',  2, 'Balance, adaptability, and the skillful juggling of multiple responsibilities and financial priorities.',     'Overwhelm, financial disorganization, or losing control of too many things at once.',        'https://placeholder.astrologypro.com/tarot/pentacles-02.jpg',     true),
  ('Three of Pentacles', 'minor', 'Pentacles',  3, 'Teamwork, craftsmanship, and the rewarding collaboration that produces high-quality, meaningful work.',       'Lack of teamwork, poor-quality output, or effort and skill going unrecognized.',              'https://placeholder.astrologypro.com/tarot/pentacles-03.jpg',     true),
  ('Four of Pentacles',  'minor', 'Pentacles',  4, 'Security, stability, and the conservative holding of resources — sometimes tipping into possessiveness.',    'Greed, materialism, or releasing control of resources out of fear or scarcity.',              'https://placeholder.astrologypro.com/tarot/pentacles-04.jpg',     true),
  ('Five of Pentacles',  'minor', 'Pentacles',  5, 'Financial hardship, isolation, and the feeling of being left out in the cold during difficult times.',        'Recovery from hardship, renewed hope, or accepting help that has been available all along.',   'https://placeholder.astrologypro.com/tarot/pentacles-05.jpg',     true),
  ('Six of Pentacles',   'minor', 'Pentacles',  6, 'Generosity, charity, and the balanced exchange of giving and receiving material support.',                    'Debt, one-sided giving, or charity given with strings attached and hidden motives.',           'https://placeholder.astrologypro.com/tarot/pentacles-06.jpg',     true),
  ('Seven of Pentacles', 'minor', 'Pentacles',  7, 'Patience, investment, and the long view of tending work carefully before the full harvest arrives.',          'Impatience, poor return on investment, or hard work that yields unsatisfying results.',        'https://placeholder.astrologypro.com/tarot/pentacles-07.jpg',     true),
  ('Eight of Pentacles', 'minor', 'Pentacles',  8, 'Diligence, mastery, and the focused apprenticeship of honing a skill with dedication and pride.',             'Poor craftsmanship, cutting corners, or perfectionism that blocks completion.',                'https://placeholder.astrologypro.com/tarot/pentacles-08.jpg',     true),
  ('Nine of Pentacles',  'minor', 'Pentacles',  9, 'Abundance, luxury, and the hard-won independence of someone self-sufficient and financially at ease.',        'Dependence, over-spending, or material success that feels hollow without deeper fulfillment.', 'https://placeholder.astrologypro.com/tarot/pentacles-09.jpg',     true),
  ('Ten of Pentacles',   'minor', 'Pentacles', 10, 'Legacy, long-term wealth, and the profound fulfillment of building something that lasts for generations.',    'Family conflict over wealth, financial instability, or a legacy built on shaky foundations.', 'https://placeholder.astrologypro.com/tarot/pentacles-10.jpg',     true),
  ('Page of Pentacles',  'minor', 'Pentacles', 11, 'Ambition, diligence, and the focused study of someone building practical skills for a promising future.',    'Laziness, lack of focus, or learning opportunities squandered through poor commitment.',       'https://placeholder.astrologypro.com/tarot/pentacles-page.jpg',   true),
  ('Knight of Pentacles','minor', 'Pentacles', 12, 'Responsibility, reliability, and the methodical progress of someone steadily working toward worthy goals.',   'Stubbornness, over-caution, or a plodding approach that lacks necessary vision.',              'https://placeholder.astrologypro.com/tarot/pentacles-knight.jpg', true),
  ('Queen of Pentacles', 'minor', 'Pentacles', 13, 'Practicality, nurturing abundance, and the warmth of someone who creates security and comfort for all.',      'Financial insecurity, neglect of practical matters, or overwork at the cost of wellbeing.',   'https://placeholder.astrologypro.com/tarot/pentacles-queen.jpg',  true),
  ('King of Pentacles',  'minor', 'Pentacles', 14, 'Wealth, leadership, and the disciplined mastery of the material world that creates lasting prosperity.',      'Financial corruption, greed, or the misuse of wealth and power for selfish ends.',            'https://placeholder.astrologypro.com/tarot/pentacles-king.jpg',   true)
) AS v(name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM tarot_cards WHERE tarot_cards.name = v.name AND tarot_cards.suit = 'Pentacles'
);

-- ── TAROT CARDS — MINOR ARCANA: SWORDS ──────────────────────────────────────

INSERT INTO tarot_cards (name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
SELECT * FROM (VALUES
  ('Ace of Swords',   'minor', 'Swords',  1, 'Mental clarity, breakthrough insight, and the piercing truth that cuts through confusion to reveal reality.',     'Confusion, misinformation, or a powerful idea wielded without clarity or care.',             'https://placeholder.astrologypro.com/tarot/swords-ace.jpg',    true),
  ('Two of Swords',   'minor', 'Swords',  2, 'Stalemate, difficult decisions, and the uneasy truce of avoiding a choice that needs to be made.',                'Breaking a stalemate, facing truth, or making a difficult decision with new information.',    'https://placeholder.astrologypro.com/tarot/swords-02.jpg',     true),
  ('Three of Swords', 'minor', 'Swords',  3, 'Heartbreak, grief, and the painful but necessary processing of sorrow, loss, and deep emotional wounds.',         'Recovery from heartbreak, releasing grief, or working through pain toward healing.',          'https://placeholder.astrologypro.com/tarot/swords-03.jpg',     true),
  ('Four of Swords',  'minor', 'Swords',  4, 'Rest, recuperation, and the essential pause needed to restore mind and body after a period of intense struggle.', 'Restlessness, inability to rest, or returning to action before full recovery.',               'https://placeholder.astrologypro.com/tarot/swords-04.jpg',     true),
  ('Five of Swords',  'minor', 'Swords',  5, 'Conflict, defeat, and the hollow victory of winning at the cost of integrity or important relationships.',         'Reconciliation after conflict, letting go of a grudge, or choosing peace over being right.', 'https://placeholder.astrologypro.com/tarot/swords-05.jpg',     true),
  ('Six of Swords',   'minor', 'Swords',  6, 'Transition, moving away from turbulence, and the slow but steady journey toward calmer and clearer waters.',      'Resistance to necessary change, carrying old baggage forward, or a difficult transition.',    'https://placeholder.astrologypro.com/tarot/swords-06.jpg',     true),
  ('Seven of Swords', 'minor', 'Swords',  7, 'Deception, strategy, and the cunning retrieval of what is yours — or the temptation to take what is not.',        'Coming clean, getting caught in deception, or abandoning a risky strategy.',                  'https://placeholder.astrologypro.com/tarot/swords-07.jpg',     true),
  ('Eight of Swords', 'minor', 'Swords',  8, 'Restriction, self-imprisonment, and the mental trap of believing you have no options or power to act.',           'Release from restriction, new perspective, or breaking free from self-imposed limitations.', 'https://placeholder.astrologypro.com/tarot/swords-08.jpg',     true),
  ('Nine of Swords',  'minor', 'Swords',  9, 'Anxiety, nightmares, and the overwhelming mental anguish of fears and worries that spiral in the dark.',          'Releasing anxiety, finding perspective, or asking for help with mental health struggles.',    'https://placeholder.astrologypro.com/tarot/swords-09.jpg',     true),
  ('Ten of Swords',   'minor', 'Swords', 10, 'Painful endings, rock bottom, and the finality of a situation that has run its course and must now conclude.',    'Recovery after rock bottom, resisting an inevitable end, or rising from total defeat.',      'https://placeholder.astrologypro.com/tarot/swords-10.jpg',     true),
  ('Page of Swords',  'minor', 'Swords', 11, 'Curiosity, vigilance, and the sharp mental alertness of someone eager to gather truth and communicate clearly.', 'Gossip, a blunt tongue, or using sharp words without the wisdom to wield them well.',         'https://placeholder.astrologypro.com/tarot/swords-page.jpg',   true),
  ('Knight of Swords','minor', 'Swords', 12, 'Ambition, speed, and the razor-sharp charge of an intellect that cuts through obstacles without hesitation.',     'Recklessness, verbal aggression, or charging forward without considering the consequences.', 'https://placeholder.astrologypro.com/tarot/swords-knight.jpg', true),
  ('Queen of Swords', 'minor', 'Swords', 13, 'Perceptive clarity, independent thinking, and the honest directness of a sharp and experienced mind.',            'Cruelty, cold-heartedness, or using intellect as a weapon against those who are vulnerable.','https://placeholder.astrologypro.com/tarot/swords-queen.jpg',  true),
  ('King of Swords',  'minor', 'Swords', 14, 'Intellectual power, authority, and the clear ethical judgment of a leader who speaks truth without compromise.',  'Abuse of power, tyranny, or cold ruthless logic devoid of empathy or human consideration.', 'https://placeholder.astrologypro.com/tarot/swords-king.jpg',   true)
) AS v(name, arcana, suit, number, upright_meaning, reversed_meaning, image_url, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM tarot_cards WHERE tarot_cards.name = v.name AND tarot_cards.suit = 'Swords'
);
