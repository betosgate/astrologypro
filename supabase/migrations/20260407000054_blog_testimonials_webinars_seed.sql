-- Migration 054: Seed blog, testimonials, and webinars with realistic data
-- 2026-04-07

-- ── 1. Blog Authors ───────────────────────────────────────────────────────────

INSERT INTO blog_authors (id, name, slug, bio, avatar_url, twitter_handle, is_active)
VALUES
  (
    '11111111-aaaa-4000-8000-000000000001',
    'Beto',
    'beto',
    'Head astrologer and founder of Divine Infinite Being. Beto brings over 20 years of experience in natal chart analysis, predictive astrology, and the ancient decan system. He is passionate about helping people navigate life''s pivotal transits with clarity and courage.',
    'https://placeholder.astrologypro.com/authors/beto.jpg',
    'betoastrology',
    true
  ),
  (
    '11111111-aaaa-4000-8000-000000000002',
    'Luna',
    'luna',
    'Tarot specialist and mystery school guide at Divine Infinite Being. Luna has studied the Celtic Cross, Thoth Tarot, and Marseille traditions for over 15 years. She weaves together symbolism, intuition, and archetypal wisdom to illuminate the path ahead.',
    'https://placeholder.astrologypro.com/authors/luna.jpg',
    'lunatarot',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Blog Categories ────────────────────────────────────────────────────────

INSERT INTO blog_categories (id, name, slug, description, sort_order, is_active)
VALUES
  (
    '22222222-bbbb-4000-8000-000000000001',
    'Astrology',
    'astrology',
    'Natal charts, transits, planetary cycles, and celestial forecasts.',
    1,
    true
  ),
  (
    '22222222-bbbb-4000-8000-000000000002',
    'Tarot',
    'tarot',
    'Tarot spreads, card meanings, and guidance for intuitive readings.',
    2,
    true
  ),
  (
    '22222222-bbbb-4000-8000-000000000003',
    'Mystery School',
    'mystery-school',
    'Esoteric teachings, decans, sacred geometry, and the deeper mysteries of the cosmos.',
    3,
    true
  ),
  (
    '22222222-bbbb-4000-8000-000000000004',
    'Spirituality',
    'spirituality',
    'Rituals, inner work, lunar cycles, and practices for conscious living.',
    4,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ── 3. Blog Tags ──────────────────────────────────────────────────────────────

INSERT INTO blog_tags (id, name, slug)
VALUES
  ('33333333-cccc-4000-8000-000000000001', 'Saturn Return',     'saturn-return'),
  ('33333333-cccc-4000-8000-000000000002', 'Jupiter Return',    'jupiter-return'),
  ('33333333-cccc-4000-8000-000000000003', 'Birth Chart',       'birth-chart'),
  ('33333333-cccc-4000-8000-000000000004', 'Celtic Cross',      'celtic-cross'),
  ('33333333-cccc-4000-8000-000000000005', 'Decans',            'decans'),
  ('33333333-cccc-4000-8000-000000000006', 'Beginner Guide',    'beginner-guide'),
  ('33333333-cccc-4000-8000-000000000007', 'Aries Season',      'aries-season'),
  ('33333333-cccc-4000-8000-000000000008', 'Life Cycles',       'life-cycles')
ON CONFLICT (slug) DO NOTHING;

-- ── 4. Blog Posts ─────────────────────────────────────────────────────────────

INSERT INTO blog_posts (
  id, title, slug, excerpt, content,
  category, image_url,
  is_published, published_at,
  status, author_id,
  reading_time_minutes, word_count,
  featured, hero,
  seo_title, seo_description,
  created_at, updated_at
)
VALUES

-- Post 1: Saturn Return
(
  'aaaaaaaa-0001-4000-8000-000000000001',
  'Understanding Your Saturn Return: The Transit That Changes Everything',
  'understanding-your-saturn-return',
  'Around age 29, Saturn returns to the exact position it held when you were born — and nothing is ever quite the same again.',
  $body$
## What Is a Saturn Return?

Every 29 to 30 years, the planet Saturn completes one full orbit around the Sun and returns to the precise degree and sign it occupied at the moment of your birth. This celestial homecoming is called the **Saturn Return**, and it marks one of the most significant turning points in a human life.

Most people experience their first Saturn Return between the ages of 27 and 31. The second arrives in the late fifties, and a rare few encounter a third in their mid-eighties.

## Why Is It So Intense?

Saturn is the planet of discipline, responsibility, karma, and long-term structure. When it returns to its natal position, it essentially presents you with a cosmic audit. Anything in your life that is not built on a solid, authentic foundation will begin to crack — relationships, careers, living situations, belief systems.

This is not punishment. It is precision.

Saturn wants to know: **Are you living a life that is truly yours?** If the answer is no, it will systematically dismantle what doesn't belong until you can answer yes.

## Common Saturn Return Experiences

- **Relationships ending or deepening** — Superficial connections rarely survive. Committed, growth-oriented bonds become stronger.
- **Career pivots** — Many people quit jobs they took for security and pursue what they actually care about.
- **Leaving home or moving cities** — The urge to establish your own true home, on your own terms.
- **Health wake-up calls** — The body starts communicating more loudly about what it needs.
- **Confronting the inner critic** — Saturn rules the voice that says "you're not good enough." The Return is an opportunity to examine that voice and transform it.

## How to Work With It

The single most important thing you can do during your Saturn Return is **stop running from hard things**. Saturn rewards effort, discipline, and honesty. The people who come through this transit transformed — rather than shattered — are the ones who leaned into its lessons rather than resisting them.

Practical steps:
1. **Audit your life honestly.** What structures feel forced or inherited rather than chosen?
2. **Invest in what matters.** Time, money, energy — where are they going? Does that match your values?
3. **Seek wise counsel.** A natal chart reading focused on Saturn's placement can reveal the specific lessons your Return is designed to teach you.
4. **Be patient.** Saturn moves slowly. Give yourself the full 2–3 year window.

## The Gift Inside the Challenge

The great irony of the Saturn Return is that the people who dread it most often emerge from it with the strongest sense of self they have ever known. By the time Saturn moves on, you know who you are, what you stand for, and what you are genuinely capable of building.

That clarity is Saturn's gift — and it is worth every difficult moment it costs.

*Ready to understand your Saturn placement? Book a Saturn Return Reading with one of our astrologers.*
$body$,
  'Astrology',
  'https://placeholder.astrologypro.com/blog/understanding-your-saturn-return.jpg',
  true,
  NOW() - INTERVAL '83 days',
  'published',
  '11111111-aaaa-4000-8000-000000000001',
  8, 520,
  true, true,
  'Understanding Your Saturn Return | Divine Infinite Being',
  'Learn what the Saturn Return means, why it feels so intense, and how to navigate this pivotal life transit with clarity and intention.',
  NOW() - INTERVAL '85 days',
  NOW() - INTERVAL '83 days'
),

-- Post 2: Celtic Cross Tarot
(
  'aaaaaaaa-0002-4000-8000-000000000002',
  'The Celtic Cross Spread: A Complete Guide to the Classic 10-Card Reading',
  'celtic-cross-spread-complete-guide',
  'The Celtic Cross is the most widely used tarot spread in the world — and for good reason. When read correctly, it can illuminate the full landscape of any situation.',
  $body$
## A Living Tradition

The Celtic Cross spread has been in use for over a century and appears in practically every tarot tradition and school. Its ten positions map out the present moment, the underlying forces at work, the past, the future, the hopes and fears of the querent, and the ultimate outcome.

Despite its age, the Celtic Cross remains the gold standard for complex questions that require a nuanced, layered answer.

## The Ten Positions

### Card 1 — The Heart of the Matter
This card sits at the center of the cross and represents the core of the situation as it stands right now. It is the theme, the energy, the present-moment truth.

### Card 2 — What Crosses You
Laid horizontally across Card 1, this position shows the immediate challenge, obstacle, or complicating factor. It can represent resistance, a competing force, or something that must be worked through.

### Card 3 — The Foundation (Root)
The card below. This is what underlies the situation — unconscious motivations, past events that shaped the present, or the emotional ground on which everything rests.

### Card 4 — What's Passing (Recent Past)
The card to the left of center. This energy is leaving — events from the recent past that are still exerting influence but beginning to recede.

### Card 5 — The Crown (Possible Outcome)
The card above center. This position shows what could manifest if current energies continue — a possible best-case scenario, or what the situation is reaching toward.

### Card 6 — What's Approaching (Near Future)
The card to the right. Energies and events moving toward you in the coming weeks or months.

### Cards 7–10 — The Staff (Right Column)
Read bottom to top:
- **Card 7 — You in This Situation:** Your current attitude, how you are showing up, your energy in the matter.
- **Card 8 — Environment:** What surrounds you — the influence of others, external circumstances, the climate you are operating in.
- **Card 9 — Hopes and Fears:** Often the most revealing card. What you most desire and most dread about the outcome.
- **Card 10 — Final Outcome:** The culmination. Where this path leads if nothing changes — or what transformation is being called for.

## Tips for Reading the Celtic Cross

**Read the cross first, then the staff.** The cross gives you the situation in full. The staff reveals the inner and outer dynamics shaping the outcome.

**Look for patterns.** Multiple cards of the same suit? A dominant Major Arcana? These patterns carry as much weight as individual card meanings.

**The crossing card modifies, not negates.** Card 2 does not cancel Card 1. It complicates, enriches, or challenges it.

**Trust the final outcome card, but not blindly.** The Celtic Cross shows the most likely trajectory given present energies. You have agency. The reading is a map, not a sentence.

## When to Use the Celtic Cross

This spread is best for questions that truly need depth — decisions, relationships, creative projects, spiritual crossroads. For simple yes/no questions, a single card or three-card spread will serve you better.

When you sit down with a genuine question and an open heart, the Celtic Cross rarely disappoints.

*Want a Celtic Cross reading from an experienced reader? Browse our tarot specialists and book today.*
$body$,
  'Tarot',
  'https://placeholder.astrologypro.com/blog/celtic-cross-spread-complete-guide.jpg',
  true,
  NOW() - INTERVAL '70 days',
  'published',
  '11111111-aaaa-4000-8000-000000000002',
  9, 580,
  false, false,
  'Celtic Cross Tarot Spread: Complete 10-Card Guide | Divine Infinite Being',
  'Master the Celtic Cross tarot spread with our complete guide to all 10 card positions, reading tips, and when to use this classic layout.',
  NOW() - INTERVAL '72 days',
  NOW() - INTERVAL '70 days'
),

-- Post 3: Aries Season
(
  'aaaaaaaa-0003-4000-8000-000000000003',
  'Aries Season: What the First Decan Means for You',
  'aries-season-first-decan',
  'The Sun enters Aries and the astrological new year begins — but the first decan carries a specific flavor that sets the tone for everything that follows.',
  $body$
## The Astrological New Year

When the Sun crosses 0° Aries each year — typically around March 20–21 — the astrological calendar resets. This is the Spring Equinox, a moment of perfect balance between light and dark, and the starting point of the entire zodiac wheel.

Aries is fire. Cardinal fire. The first breath of becoming. Where Pisces dissolves, Aries ignites.

## The Three Decans of Aries

Each zodiac sign spans 30 degrees and is divided into three **decans** of 10 degrees each. The decans modify the energy of the sign, giving each 10-degree section a distinct quality shaped by a secondary planetary ruler.

The first decan of Aries — **0° to 9°59'** — is ruled by **Mars**, the same planet that rules Aries itself. This is Aries at its purest and most undiluted.

## The Energy of the First Decan

Mars ruling Mars creates an energy that is bold, direct, and completely uninterested in nuance. The first decan is the archetype of the pioneer, the warrior, the one who moves without hesitation toward what is wanted.

Tarot associations: **The Two of Wands** and the first face of the Aries decan carry the energy of boldness tempered by vision. You have taken the first step. Now you look toward the horizon.

The Greek daemon traditionally associated with this face is an entity of raw, unstoppable forward momentum — the force that makes beginnings possible.

## How This Aries Season Affects You

If your Sun, Moon, Ascendant, or major personal planets fall in the first decan of Aries — or in the first decans of the other cardinal signs (Cancer, Libra, Capricorn) — this season activates something significant in your chart.

**Themes in play:**
- New beginnings that require courage
- The call to act before you feel fully ready
- Confronting fear through motion rather than preparation
- Claiming leadership — of your life, your projects, your path

## A Note for Every Sign

Even if you have no planets in Aries, you have an Aries house. The area of life governed by whichever house Aries rules in your natal chart is being lit up right now. New initiatives there are cosmically supported.

This is not the season for over-planning. It is the season for the first move.

*Curious about how Aries season activates your birth chart? Book a transit reading with one of our astrologers.*
$body$,
  'Astrology',
  'https://placeholder.astrologypro.com/blog/aries-season-first-decan.jpg',
  true,
  NOW() - INTERVAL '55 days',
  'published',
  '11111111-aaaa-4000-8000-000000000001',
  7, 460,
  true, false,
  'Aries Season & the First Decan | Divine Infinite Being',
  'Discover what Aries season and the first decan of Aries mean for you, your birth chart, and the themes of bold new beginnings.',
  NOW() - INTERVAL '57 days',
  NOW() - INTERVAL '55 days'
),

-- Post 4: How to Read Your Birth Chart
(
  'aaaaaaaa-0004-4000-8000-000000000004',
  'How to Read Your Birth Chart for the First Time',
  'how-to-read-your-birth-chart',
  'Your birth chart is a snapshot of the sky at the exact moment you were born. Here''s how to start making sense of it — even if you''re completely new to astrology.',
  $body$
## Your Cosmic Blueprint

A birth chart — also called a natal chart or horoscope — is a circular diagram that shows exactly where every planet in the solar system was positioned at the precise moment of your birth, as seen from your birthplace.

It is, in the most literal sense, a map of the sky at the instant you took your first breath.

Astrologers use this map to understand personality, life themes, talents, challenges, karmic patterns, and the timing of significant life events. Learning to read your own chart is one of the most illuminating self-knowledge practices available.

## What You Need to Get Started

To generate your birth chart accurately, you need:
1. **Date of birth** — day, month, year
2. **Exact time of birth** — as precise as possible; even 5 minutes matters
3. **City of birth** — astrology is location-specific

If you don't know your birth time, you can still generate a chart, but your Rising sign and house cusps will be uncertain.

## The Three Core Pillars

### 1. The Sun Sign
Your Sun sign is what most people mean when they say "I'm a Sagittarius." The Sun represents your core identity, the conscious self, your essential nature and life force.

### 2. The Moon Sign
Less widely known but equally important. The Moon sign describes your emotional nature, instinctive responses, what you need to feel safe, and how you experienced your early home environment.

### 3. The Rising Sign (Ascendant)
The Rising sign is the zodiac sign that was literally rising on the eastern horizon at the moment you were born. It describes your outer personality — how you are perceived, your physical presence, your approach to new situations. It also determines your entire house system.

## The Houses

The circular chart is divided into 12 segments called **houses**. Each house governs a specific domain of life:

- **1st** — Self, appearance, first impressions
- **2nd** — Money, possessions, self-worth
- **3rd** — Communication, siblings, short journeys
- **4th** — Home, family, roots, the mother
- **5th** — Creativity, romance, children, play
- **6th** — Health, daily work, routines, service
- **7th** — Partnerships, marriage, open enemies
- **8th** — Death, transformation, shared resources, sexuality
- **9th** — Philosophy, higher education, travel, spirituality
- **10th** — Career, public reputation, the father
- **11th** — Friends, groups, hopes, humanitarian causes
- **12th** — The hidden self, karma, institutions, solitude

## Where to Start

Don't try to read everything at once. Start with your Sun-Moon-Rising combination. These three placements, taken together, will already reveal a portrait of remarkable depth and accuracy.

Then look at where your Sun, Moon, and Rising sign planets (the chart rulers) fall by house. That house becomes highlighted, significant, a central arena of your life's story.

## When to Get Professional Help

Birth chart interpretation is a deep craft. A skilled astrologer can synthesize dozens of factors — sign placements, house placements, aspects between planets, progressions, transits — into a coherent picture of your life, past, present, and future.

If you are facing a major life decision or significant transition, a natal chart reading is one of the most actionable investments you can make in your own self-understanding.

*Ready to explore your chart? Book a Natal Chart Reading with one of our astrologers today.*
$body$,
  'Astrology',
  'https://placeholder.astrologypro.com/blog/how-to-read-your-birth-chart.jpg',
  true,
  NOW() - INTERVAL '40 days',
  'published',
  '11111111-aaaa-4000-8000-000000000001',
  10, 650,
  true, false,
  'How to Read Your Birth Chart for Beginners | Divine Infinite Being',
  'A beginner-friendly guide to reading your natal chart: the three core pillars, the 12 houses, and where to start your astrological self-study.',
  NOW() - INTERVAL '42 days',
  NOW() - INTERVAL '40 days'
),

-- Post 5: Mystery of the Decans
(
  'aaaaaaaa-0005-4000-8000-000000000005',
  'The Mystery of the Decans: 36 Faces of the Zodiac',
  'mystery-of-the-decans-36-faces',
  'Long before the zodiac signs we know today, ancient Egyptian and Hellenistic astrologers mapped the sky into 36 faces — each one a distinct spirit, a unique flavor of cosmic intelligence.',
  $body$
## What Are the Decans?

The word *decan* comes from the Greek *dekanoi*, meaning "ten each." Each of the twelve zodiac signs spans 30 degrees, and each sign is divided into three decans of 10 degrees apiece. This gives us 36 divisions of the zodiac, each carrying its own planetary ruler, tarot correspondence, mythological association, and spiritual quality.

The decan system is one of the oldest layers of astrological tradition, predating the widespread use of the 12 signs. In ancient Egypt, the 36 decans were gods — the *faces* of the sky that rotated through the night in 10-day cycles, marking the calendar and governing human fate.

## Hellenistic Origins

In Hellenistic astrology — the tradition that flourished in the Greek-speaking world from roughly 300 BCE to 700 CE — the decans were assigned planetary rulers using the **Chaldean order** of planets: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, and back to Saturn.

Starting from Aries, the first decan belongs to Mars (the ruler of Aries itself), the second to the Sun, the third to Venus, and so on through the sequence.

This system means every decan carries a primary influence (the sign) and a secondary influence (the decan ruler), creating a 36-note scale of cosmic possibility.

## Tarot and the Decans

The correspondence between the decans and the Minor Arcana of the tarot is one of the most striking examples of cross-tradition synthesis in Western esotericism. The 36 numbered pip cards (Ace through Ten, minus the Aces, across the four suits) map almost perfectly onto the 36 decans.

For example:
- **Two of Wands** = First decan of Aries (Mars/Mars) — bold beginnings, the pioneering gaze
- **Five of Pentacles** = Second decan of Taurus (Venus/Mercury) — material difficulty, but also resourcefulness
- **Eight of Swords** = First decan of Gemini (Mercury/Mercury) — the mind trapping itself, yet also capable of cutting free

Understanding these correspondences doesn't just enrich your tarot practice — it deepens your astrological understanding of how planets in signs operate at a granular level.

## Working With Your Decan

When a planet falls in a specific decan of your birth chart, it picks up the quality of that decan's ruler in addition to the sign's broader energy. A Moon at 15° Scorpio sits in the second decan, ruled by the Sun — giving this deeply private, transformative placement a solar quality: a need to be seen, to illuminate, to shine light into dark places.

A Mars at 25° Capricorn falls in the third decan, ruled by the Moon — giving this disciplined, ambitious placement a more instinctive, rhythmic quality, one that responds to cycles and emotional tides even while building toward long-term goals.

## The 36 Faces as Archetypal Intelligence

The Greek astrologers who catalogued the decans gave each face a vivid, sometimes unsettling description — rising figures, double-bodied beings, entities of force and transformation. These images are not meant to be taken literally. They are archetypal portraits of the energy that moves through that sector of the sky.

Engaging with them is a form of esoteric astrology — a practice of learning to recognize cosmic patterns not just intellectually, but somatically, imaginatively, spiritually.

The decans are not just a technical subdivision of the zodiac. They are 36 doors into the living intelligence of the sky.

*The Decan System is at the heart of our Mystery School curriculum. Learn more about enrollment.*
$body$,
  'Mystery School',
  'https://placeholder.astrologypro.com/blog/mystery-of-the-decans-36-faces.jpg',
  true,
  NOW() - INTERVAL '25 days',
  'published',
  '11111111-aaaa-4000-8000-000000000001',
  11, 710,
  false, false,
  'The 36 Decans of the Zodiac: Esoteric Astrology | Divine Infinite Being',
  'Explore the ancient decan system — 36 faces of the zodiac, their planetary rulers, tarot correspondences, and how they shape your birth chart.',
  NOW() - INTERVAL '27 days',
  NOW() - INTERVAL '25 days'
),

-- Post 6: Jupiter Return
(
  'aaaaaaaa-0006-4000-8000-000000000006',
  'Jupiter Return: Your 12-Year Cycle of Growth and Expansion',
  'jupiter-return-12-year-cycle',
  'Every 12 years, Jupiter returns to the sign it occupied when you were born — opening a window of extraordinary opportunity, expansion, and renewal.',
  $body$
## The Planet of Abundance

Jupiter is the largest planet in the solar system, and in astrology it carries that largeness into everything it touches. Jupiter expands, amplifies, bestows opportunity, encourages faith, and opens doors.

It takes approximately 12 years for Jupiter to complete one full orbit around the Sun and return to its natal position in your birth chart. This event — the **Jupiter Return** — happens roughly at ages 12, 24, 36, 48, 60, 72, and so on.

## What Happens During a Jupiter Return?

Unlike the Saturn Return, which is often experienced as demanding and dismantling, the Jupiter Return tends to feel like a **fresh breath of possibility**. Opportunities appear. Confidence increases. The world feels more expansive, more generous.

This is the time to:
- **Launch major projects and ventures** — Jupiter blesses beginnings
- **Expand your reach** — new audiences, new markets, new relationships
- **Travel, study, teach** — Jupiter rules long-distance journeys and higher learning
- **Commit to a bigger vision** — the Return opens a 12-year chapter; what you initiate now sets the tone

## The Shadow Side of Jupiter

Jupiter's gifts come with a caveat. Expansion without discernment can become overreach. The Jupiter Return can trigger overconfidence, excess, grandiosity, or the temptation to take on more than can be sustained.

The wise person uses the Jupiter Return to expand intelligently — saying yes to what aligns, not simply to everything that presents itself.

## Jupiter's Sign and House Matter

Jupiter's sign in your natal chart colors the quality of your Jupiter Return experience. Jupiter in Virgo expands through service, precision, and craft. Jupiter in Scorpio expands through depth, transformation, and research. Jupiter in Sagittarius (its home sign) expands through philosophy, adventure, and truth-seeking.

The house Jupiter occupies natally reveals *where* in your life this expansion is most naturally available to you — and where the Jupiter Return year will be most palpably felt.

## The 12-Year Chapter

Think of each Jupiter Return as the beginning of a new chapter in the book of your life. The previous 12 years have been one complete cycle — a full journey through the entire zodiac. Now the slate is refreshed, and a new arc begins.

What would you want to say about the next 12 years of your life, looking back from the Jupiter Return after this one? The answer to that question is your north star for the chapter that is now beginning.

*Is your Jupiter Return approaching? Book a Jupiter Return Reading with one of our astrologers to map your 12-year cycle of growth.*
$body$,
  'Astrology',
  'https://placeholder.astrologypro.com/blog/jupiter-return-12-year-cycle.jpg',
  true,
  NOW() - INTERVAL '10 days',
  'published',
  '11111111-aaaa-4000-8000-000000000001',
  8, 530,
  false, false,
  'Jupiter Return: Your 12-Year Growth Cycle | Divine Infinite Being',
  'Understand your Jupiter Return — the 12-year cycle of expansion, opportunity, and renewal — and how to make the most of this auspicious transit.',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '10 days'
)

ON CONFLICT (slug) DO NOTHING;

-- ── 5. Blog Post → Category Pivot ────────────────────────────────────────────

INSERT INTO blog_post_categories (post_id, category_id)
VALUES
  -- Saturn Return → Astrology
  ('aaaaaaaa-0001-4000-8000-000000000001', '22222222-bbbb-4000-8000-000000000001'),
  -- Celtic Cross → Tarot
  ('aaaaaaaa-0002-4000-8000-000000000002', '22222222-bbbb-4000-8000-000000000002'),
  -- Aries Season → Astrology
  ('aaaaaaaa-0003-4000-8000-000000000003', '22222222-bbbb-4000-8000-000000000001'),
  -- Birth Chart Guide → Astrology
  ('aaaaaaaa-0004-4000-8000-000000000004', '22222222-bbbb-4000-8000-000000000001'),
  -- Mystery of the Decans → Mystery School + Astrology
  ('aaaaaaaa-0005-4000-8000-000000000005', '22222222-bbbb-4000-8000-000000000003'),
  ('aaaaaaaa-0005-4000-8000-000000000005', '22222222-bbbb-4000-8000-000000000001'),
  -- Jupiter Return → Astrology
  ('aaaaaaaa-0006-4000-8000-000000000006', '22222222-bbbb-4000-8000-000000000001')
ON CONFLICT DO NOTHING;

-- ── 6. Blog Post → Tag Pivot ──────────────────────────────────────────────────

INSERT INTO blog_post_tags (post_id, tag_id)
VALUES
  -- Saturn Return post
  ('aaaaaaaa-0001-4000-8000-000000000001', '33333333-cccc-4000-8000-000000000001'),
  ('aaaaaaaa-0001-4000-8000-000000000001', '33333333-cccc-4000-8000-000000000008'),
  -- Celtic Cross post
  ('aaaaaaaa-0002-4000-8000-000000000002', '33333333-cccc-4000-8000-000000000004'),
  -- Aries Season post
  ('aaaaaaaa-0003-4000-8000-000000000003', '33333333-cccc-4000-8000-000000000007'),
  ('aaaaaaaa-0003-4000-8000-000000000003', '33333333-cccc-4000-8000-000000000005'),
  -- Birth Chart Beginner
  ('aaaaaaaa-0004-4000-8000-000000000004', '33333333-cccc-4000-8000-000000000003'),
  ('aaaaaaaa-0004-4000-8000-000000000004', '33333333-cccc-4000-8000-000000000006'),
  -- Mystery of the Decans
  ('aaaaaaaa-0005-4000-8000-000000000005', '33333333-cccc-4000-8000-000000000005'),
  -- Jupiter Return
  ('aaaaaaaa-0006-4000-8000-000000000006', '33333333-cccc-4000-8000-000000000002'),
  ('aaaaaaaa-0006-4000-8000-000000000006', '33333333-cccc-4000-8000-000000000008')
ON CONFLICT DO NOTHING;

-- ── 7. Webinars ───────────────────────────────────────────────────────────────

INSERT INTO webinars (
  id, title, description, host_name,
  scheduled_at, duration_mins,
  join_url, recording_url,
  is_free, price,
  is_active, created_at, updated_at
)
VALUES
  (
    'bbbbbbbb-0001-4000-8000-000000000001',
    'New Moon Ritual & Live Chart Reading',
    'Join Beto for a live new moon ritual followed by a real-time birth chart reading for a volunteer from the audience. Learn how to set intentions that are cosmically aligned, work with lunar energy, and see a professional chart analysis in action. Free and open to all.',
    'Beto',
    NOW() + INTERVAL '14 days',
    90,
    'https://placeholder.astrologypro.com/webinars/new-moon-ritual-chart-reading/join',
    NULL,
    true,
    0.00,
    true,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    'bbbbbbbb-0002-4000-8000-000000000002',
    'Saturn Return Masterclass',
    'A deep-dive masterclass on the Saturn Return transit with Beto. Covers the astrological mechanics of Saturn''s 29-year cycle, how to identify where Saturn falls in your natal chart, the three phases of the Return, and specific strategies for each Saturn sign placement. Includes a live Q&A. Lifetime access to the recording.',
    'Beto',
    NOW() + INTERVAL '30 days',
    120,
    'https://placeholder.astrologypro.com/webinars/saturn-return-masterclass/join',
    NULL,
    false,
    27.00,
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    'bbbbbbbb-0003-4000-8000-000000000003',
    'Introduction to Tarot: Reading the Cards with Confidence',
    'Luna guides absolute beginners through the foundations of tarot: the structure of the 78-card deck, the difference between Major and Minor Arcana, how to do a simple 3-card reading, and how to trust your intuition alongside card meanings. Watch the recording at your own pace.',
    'Luna',
    NOW() - INTERVAL '21 days',
    75,
    NULL,
    'https://placeholder.astrologypro.com/webinars/intro-to-tarot/recording',
    true,
    0.00,
    true,
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '20 days'
  )
ON CONFLICT DO NOTHING;

-- ── 8. Testimonials ───────────────────────────────────────────────────────────
-- Note: diviner_id is NOT NULL. We insert only if at least one diviner exists,
-- using the first available diviner_id as a placeholder for demo data.

DO $$
DECLARE
  v_diviner_id UUID;
BEGIN
  SELECT id INTO v_diviner_id FROM diviners ORDER BY created_at ASC LIMIT 1;

  IF v_diviner_id IS NULL THEN
    RAISE NOTICE 'No diviners found — skipping testimonial seed data. Re-run after a diviner is created.';
    RETURN;
  END IF;

  INSERT INTO testimonials (
    id, diviner_id, client_name, rating, text, service_type, status, featured, created_at
  )
  VALUES
    (
      'cccccccc-0001-4000-8000-000000000001',
      v_diviner_id,
      'Sarah M.',
      5,
      'I had my natal chart reading last month and I am still processing everything Beto shared with me. He connected dots in my life that I had never been able to see clearly — my career struggles, my relationship patterns, the way I respond to change. It all made sense through the lens of my chart. I feel like I finally understand myself.',
      'Natal Chart Reading',
      'approved',
      true,
      NOW() - INTERVAL '72 days'
    ),
    (
      'cccccccc-0002-4000-8000-000000000002',
      v_diviner_id,
      'James K.',
      5,
      'The Saturn Return reading was exactly what I needed. I''m 29 and honestly feeling the pressure of this transit in every area of my life. Beto helped me understand that the chaos isn''t random — it has direction. I left with a clear sense of what I''m being asked to build and what I need to let go of. Life-changing.',
      'Saturn Return Reading',
      'approved',
      true,
      NOW() - INTERVAL '58 days'
    ),
    (
      'cccccccc-0003-4000-8000-000000000003',
      v_diviner_id,
      'Priya R.',
      5,
      'Luna''s Celtic Cross reading was one of the most accurate and insightful experiences I''ve ever had. She read each card with such depth and connected them to real situations in my life that she couldn''t possibly have known about. I came in with a big career decision to make and left knowing exactly what to do.',
      '10-Card Celtic Cross',
      'approved',
      true,
      NOW() - INTERVAL '44 days'
    ),
    (
      'cccccccc-0004-4000-8000-000000000004',
      v_diviner_id,
      'Michael T.',
      4,
      'Great monthly transit reading. I appreciated having a heads-up about the Mercury retrograde period and how it would specifically affect my Virgo rising. The advice about communication and contracts during that window was spot-on. Will definitely be booking monthly.',
      'Monthly Transit Reading',
      'approved',
      false,
      NOW() - INTERVAL '37 days'
    ),
    (
      'cccccccc-0005-4000-8000-000000000005',
      v_diviner_id,
      'Elena V.',
      5,
      'I booked a relationship reading for me and my partner and it was incredibly validating. We''ve been together 7 years and there are certain dynamics we''ve never been able to fully explain — the synastry chart made them visible. It didn''t just describe the challenges; it gave us language and tools to work with them.',
      'Romantic Relationship Reading',
      'approved',
      false,
      NOW() - INTERVAL '30 days'
    ),
    (
      'cccccccc-0006-4000-8000-000000000006',
      v_diviner_id,
      'David C.',
      4,
      'Second time working with Beto — this time for a Jupiter Return reading. He mapped out the next 12 years with real specificity, identifying the windows for expansion in my business and the areas where I need to slow down and consolidate. Clear, practical, and grounded in the actual chart. Excellent.',
      'Jupiter Return Reading',
      'approved',
      false,
      NOW() - INTERVAL '22 days'
    ),
    (
      'cccccccc-0007-4000-8000-000000000007',
      v_diviner_id,
      'Amara O.',
      5,
      'The 3-card tarot pull I did with Luna before my job interview was uncannily on point. She pulled the 8 of Pentacles, the Ace of Cups reversed, and The Sun — and her interpretation about leading with craft over emotion, and remembering that success here is genuinely available to me, was exactly what I needed to hear. I got the job.',
      '3-Card Basic Spread',
      'approved',
      false,
      NOW() - INTERVAL '15 days'
    ),
    (
      'cccccccc-0008-4000-8000-000000000008',
      v_diviner_id,
      'Tom W.',
      4,
      'Really solid birth chart reading. I''d had readings before but they were always vague — Sun sign stuff mostly. This was different. We went deep into my Moon in Scorpio and what it means for how I process emotion, and into my Capricorn stellium and why I''ve always felt this pressure to perform and achieve. Very worth the investment.',
      'Natal Chart Reading',
      'approved',
      false,
      NOW() - INTERVAL '8 days'
    )
  ON CONFLICT DO NOTHING;

END $$;
