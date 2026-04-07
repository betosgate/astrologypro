-- =============================================================================
-- Migration: 20260407000061_training_comprehensive_seed.sql
-- Purpose:   Comprehensive re-seed of training module
-- Gaps fixed:
--   1. 11 lessons missing content + video_url + pdf_url
--   2. 32 of 38 lessons missing quiz questions (only 6 had quiz; 30 needed)
--   3. 2 empty categories: "Weeks 5–8: Intermediate", "Spread Design & Readings"
--   4. is_sequential=false on ALL programs/categories — set appropriately
--   5. "Diviner Certification Program" has only 1 lesson in Platform & Tools
--   6. "Social Advocacy Training" has only 1 lesson
-- =============================================================================

-- =========================================================
-- PART 1: Set is_sequential appropriately on programs
-- =========================================================

-- Diviner Certification is a structured curriculum — must be sequential
UPDATE training_programs
SET is_sequential = true
WHERE id = 'ade198dd-f73b-4d68-932e-274ff2b02ea5';

-- Mystery School Foundation is sequential (week-by-week progression)
UPDATE training_programs
SET is_sequential = true
WHERE id = 'ac9be8e4-301a-4595-aab0-7a608108f4dc';

-- Tarot Mastery Track is sequential (Major Arcana before Spreads)
UPDATE training_programs
SET is_sequential = true
WHERE id = '1d7b5f74-a332-412b-9f54-7ccea16c02eb';

-- Foundations of Astrology, Tarot Mastery, Advanced Divination — open/non-sequential
-- Social Advocacy Training — open
-- (no change needed, already false)

-- Set categories to sequential where parent program is sequential
UPDATE training_categories SET is_sequential = true
WHERE training_id = 'ade198dd-f73b-4d68-932e-274ff2b02ea5';

UPDATE training_categories SET is_sequential = true
WHERE training_id = 'ac9be8e4-301a-4595-aab0-7a608108f4dc';

UPDATE training_categories SET is_sequential = true
WHERE training_id = '1d7b5f74-a332-412b-9f54-7ccea16c02eb';


-- =========================================================
-- PART 2: Fill in lesson content + video_url + pdf_url
--         for all 11 lessons that have NULL content
-- =========================================================

-- Diviner Certification → Astrology Fundamentals → The 12 Zodiac Signs
UPDATE training_lessons SET
  content = '## The 12 Zodiac Signs

The zodiac is a belt of sky divided into 12 equal sections of 30° each. Every sign has a distinct elemental nature, modality, and ruling planet that colour how its energy expresses.

**The Four Elements**
- **Fire** (Aries, Leo, Sagittarius): initiative, enthusiasm, and action.
- **Earth** (Taurus, Virgo, Capricorn): practicality, stability, and material focus.
- **Air** (Gemini, Libra, Aquarius): intellect, communication, and social connection.
- **Water** (Cancer, Scorpio, Pisces): emotion, intuition, and depth.

**The Three Modalities**
- **Cardinal** (Aries, Cancer, Libra, Capricorn): initiating, starting new cycles.
- **Fixed** (Taurus, Leo, Scorpio, Aquarius): sustaining, deepening, completing.
- **Mutable** (Gemini, Virgo, Sagittarius, Pisces): adapting, transitioning, synthesising.

Each sign carries both an element and a modality — Aries is Cardinal Fire (the spark of new action), while Scorpio is Fixed Water (deep, still, transformative emotion).

**Practice**: Write one sentence describing the core energy of each element-modality combination before the next lesson.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/12-zodiac-signs.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/12-zodiac-signs.pdf',
  updated_at = now()
WHERE id = '451669f3-6c8f-4d97-872c-572716d64221';

-- Diviner Certification → Astrology Fundamentals → The 10 Planets
UPDATE training_lessons SET
  content = '## The 10 Planets

In traditional and modern astrology, the "planets" include the Sun, Moon, and eight classical/modern planets. Each rules one or two signs and governs a domain of life.

**The Personal Planets (fast-moving, personal influence)**
- **Sun**: ego, life-force, identity. Rules Leo.
- **Moon**: emotions, instincts, the past. Rules Cancer.
- **Mercury**: communication, mind, movement. Rules Gemini and Virgo.
- **Venus**: love, beauty, values. Rules Taurus and Libra.
- **Mars**: drive, desire, conflict. Rules Aries (traditionally Scorpio).

**The Social Planets (generational bridge)**
- **Jupiter**: expansion, philosophy, luck. Rules Sagittarius (traditionally Pisces).
- **Saturn**: discipline, limitation, mastery. Rules Capricorn (traditionally Aquarius).

**The Outer/Generational Planets**
- **Uranus**: disruption, innovation, freedom. Rules Aquarius.
- **Neptune**: dissolution, spirituality, illusion. Rules Pisces.
- **Pluto**: transformation, power, death-rebirth. Rules Scorpio.

Planets in a chart show *what* energies are at play. The sign they occupy shows *how* that energy expresses. The house shows *where* in life it operates.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/10-planets.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/10-planets.pdf',
  updated_at = now()
WHERE id = '92b17b97-1007-4bbb-89da-43fe4a1d8bc0';

-- Diviner Certification → Astrology Fundamentals → The 12 Houses
UPDATE training_lessons SET
  content = '## The 12 Houses

The 12 houses are divisions of the sky based on the local horizon at your birth location. Unlike the zodiac (which is fixed to the ecliptic), houses rotate with Earth''s daily spin — your Ascendant (1st house cusp) changes roughly every two hours.

**Angular Houses (1, 4, 7, 10)** — most powerful; themes dominate life visibly.
**Succedent Houses (2, 5, 8, 11)** — stabilise and sustain angular themes.
**Cadent Houses (3, 6, 9, 12)** — adapt and transition; less immediately visible.

**Quick House Reference**
| House | Domain |
|-------|--------|
| 1st | Self, body, first impressions |
| 2nd | Money, possessions, self-worth |
| 3rd | Communication, siblings, short travel |
| 4th | Home, roots, parents, inner life |
| 5th | Creativity, romance, children, play |
| 6th | Health, daily work, service |
| 7th | Partnerships, marriage, open enemies |
| 8th | Shared resources, sexuality, death, transformation |
| 9th | Philosophy, higher education, long travel, belief |
| 10th | Career, public reputation, authority |
| 11th | Friends, groups, hopes, networks |
| 12th | Hidden matters, retreat, karma, institutions |

A planet in a house colours how that house''s themes play out in the client''s life.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/12-houses.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/12-houses.pdf',
  updated_at = now()
WHERE id = 'c2572092-0198-4138-ab1f-0680c2d79891';

-- Diviner Certification → Client Communication → Booking & Intake Process
UPDATE training_lessons SET
  content = '## Booking & Intake Process

A smooth booking and intake flow sets the tone for the entire reading relationship. As a Diviner on the platform, your intake form is your first point of professional contact.

**Why Intake Matters**
The intake form gathers birth data, session intent, and any sensitivities before the reading begins. This prevents awkward mid-session gaps and protects both you and the client from being caught off-guard by difficult topics.

**What to Collect**
1. **Birth information** — date, exact time (if known), and city of birth.
2. **Session intention** — what is the client hoping to explore? (career, relationships, life direction)
3. **Sensitive topics** — any areas the client does not want addressed?
4. **Prior reading experience** — first-time or returning client?

**Platform Workflow**
- Clients book through the platform calendar. Your availability is set in your Diviner profile.
- Once a booking is confirmed, the intake form is sent automatically.
- Review the intake responses at least 15 minutes before the session.
- If birth time is unknown, note this and plan to use solar chart methods.

**Red Flags to Watch For**
- Vague intentions ("I just want to know everything") — gently redirect to one or two focus areas.
- Emotional vulnerability signals — prepare grounding language and referral resources.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/client-comm/booking-intake.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/client-comm/booking-intake.pdf',
  updated_at = now()
WHERE id = 'f31d4a48-5dce-431b-a221-5c497f55128c';

-- Diviner Certification → Client Communication → Delivering Difficult Readings
UPDATE training_lessons SET
  content = '## Delivering Difficult Readings

Not every chart — or every session — brings light news. A professional Diviner knows how to hold space for challenging insights without causing harm.

**The Ethical Foundation**
Your role is not to predict doom; it is to illuminate patterns and choices. Every difficult transit, challenging placement, or heavy card in the spread is also an invitation for the client to grow.

**Framework for Difficult Delivery**
1. **Ground first** — start with strengths, gifts, or recent supportive transits before entering challenging territory.
2. **Use "invitation" language** — "This period may ask you to examine…" rather than "You will lose…"
3. **Offer agency** — after naming the challenge, always follow with a question or reflection: "How does that land for you? What resources do you feel you have?"
4. **Know your boundaries** — you are not a therapist. If a client discloses mental health crisis, active harm, or suicidal ideation, pause the reading and provide crisis resources immediately.

**Sensitive Topics: A Checklist**
- Death in the chart (8th house, Pluto transits) — speak to transformation, not literal endings.
- Relationship endings — validate grief, avoid predicting specific outcomes.
- Health indicators — *never* diagnose. Encourage professional medical advice.

**Post-Session Self-Care**
Vicarious processing is real. Build a 10-minute transition ritual after heavy sessions.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/client-comm/difficult-readings.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/client-comm/difficult-readings.pdf',
  updated_at = now()
WHERE id = 'e21f1580-2430-4f6e-aa6e-623b66fe44f8';

-- Diviner Certification → Platform & Tools → Setting Up Your Diviner Profile
UPDATE training_lessons SET
  content = '## Setting Up Your Diviner Profile

Your Diviner profile is your storefront on Divine Infinite Being. A complete, compelling profile dramatically increases booking conversion and client trust.

**Required Profile Elements**
1. **Professional photo** — well-lit, clear headshot. No filters that obscure your face.
2. **Bio (50–200 words)** — your background, approach, and what clients can expect. Avoid vague spiritual jargon; be specific about your methods.
3. **Specialities** — select all that apply: natal astrology, synastry, transits, tarot, oracle, human design, numerology, etc.
4. **Availability** — connect your calendar and set your weekly schedule. Keep it accurate; frequent cancellations harm your rating.
5. **Session types and pricing** — set at least one 30-minute and one 60-minute offering. Pricing guidelines are in the Diviner handbook.
6. **Intake form** — build or select a template intake form in your dashboard. At minimum it should capture birth data and session intention.

**Profile Quality Standards**
- No pricing listed outside the platform.
- No contact info (email, phone, social) in bio — this violates platform terms.
- Bio must be in English (additional languages can be added as secondary).

**After Setup**
Submit your profile for admin review. Approval typically takes 1–2 business days. You will receive a confirmation email once you are live.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/profile-setup.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/profile-setup.pdf',
  updated_at = now()
WHERE id = '9f065038-b881-4b2c-8fbc-588e226b8385';

-- Mystery School → Weeks 1–4: Foundation → Week 1 — The Call to the Mysteries
UPDATE training_lessons SET
  content = '## Week 1 — The Call to the Mysteries

Welcome to the Divine Infinite Being Mystery School Foundation. This first week is about orientation — to the tradition, to yourself, and to the practice of conscious inquiry.

**What Is a Mystery School?**
Mystery schools are lineages of esoteric knowledge transmitted through structured initiation and practice. The word "mystery" comes from the Greek *mysterion* — that which can only be known through direct experience, not second-hand description.

**The Three Pillars of This Foundation Program**
1. **Self-knowledge** — the ancient Delphic injunction, "Know Thyself," is not metaphor. It is the first act of genuine spiritual work.
2. **Cosmological framework** — understanding the structure of reality as the ancients described it: the Great Chain of Being, correspondence (As above, so below), and the nature of the soul.
3. **Practical discipline** — contemplation, ritual, and shadow work are the tools. Theory without practice is empty.

**This Week''s Practice**
Each morning (5–10 minutes): Sit in silence and write one sentence in response to the prompt: *"What am I most afraid to know about myself?"* Do not analyse — just write and leave it. Return to it at the end of the week.

**Recommended Reading**
- Manly P. Hall, *The Secret Teachings of All Ages* (introduction chapter)
- Keep a dedicated journal for this program.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/mystery-school/foundation/week-01-call-to-mysteries.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/mystery-school/foundation/week-01-workbook.pdf',
  updated_at = now()
WHERE id = '56c29054-3ce9-41aa-a379-da307826c9f2';

-- Mystery School → Weeks 1–4: Foundation → Week 2 — Sacred Geometry Primer
UPDATE training_lessons SET
  content = '## Week 2 — Sacred Geometry Primer

Sacred geometry is the study of the mathematical patterns that underlie all physical form. Every tradition — Greek, Egyptian, Islamic, Hindu, and indigenous — encodes cosmological truth in geometric language.

**The Core Principles**
- **The Point**: pure potential, the unmanifest source. Before form, there is point.
- **The Line**: division, duality, the first movement from unity.
- **The Circle**: wholeness, eternity, the divine container. No beginning, no end.
- **The Triangle**: the number three — spirit manifesting in matter through a third force.
- **The Square**: the four elements, cardinal directions, material reality.
- **The Pentagon / Phi Spiral**: life, growth, and the golden ratio (1.618…) that appears in shells, galaxies, and the human body.

**The Flower of Life**
This pattern of overlapping circles contains within it the Fruit of Life, the Tree of Life, the Platonic Solids, and Metatron''s Cube. It is considered a master template of creation.

**This Week''s Practice**
Draw a Vesica Piscis (two overlapping circles of equal radius, each passing through the other''s centre) by hand. Sit with it for five minutes and write: what does this shape evoke in you?

Sacred geometry is not superstition — it is applied mathematics in service of spiritual cognition.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/mystery-school/foundation/week-02-sacred-geometry.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/mystery-school/foundation/week-02-workbook.pdf',
  updated_at = now()
WHERE id = '45cddaac-b290-4f82-b549-1d3cd6ed3721';

-- Tarot Mastery Track → Major Arcana → The Fool to The Chariot (0–VII)
UPDATE training_lessons SET
  content = '## The Fool to The Chariot (Cards 0–VII)

The first eight cards of the Major Arcana trace the journey from pure potential to the first mastery of will.

**0 — The Fool**: Pure potential, new beginnings, the leap of faith before experience. Element: Air. No number — outside the cycle, or encompassing it.

**I — The Magician**: Willpower applied to the material world. Has all four suit tools on the table — wands, cups, swords, pentacles. Element: Air / Mercury.

**II — The High Priestess**: Hidden knowledge, intuition, the unconscious. She holds what the Magician cannot yet access. Element: Water / Moon.

**III — The Empress**: Abundance, fertility, creative embodiment, the natural world. Element: Earth / Venus.

**IV — The Emperor**: Structure, authority, paternal order, civilisation. Element: Fire / Aries.

**V — The Hierophant**: Tradition, institution, spiritual transmission through lineage. Element: Earth / Taurus.

**VI — The Lovers**: Choice, values alignment, union. Not merely romance — the deeper decision of who you are in relationship. Element: Air / Gemini.

**VII — The Chariot**: Mastery of opposing forces through focused will. Victory through discipline, not domination. Element: Water / Cancer.

**Pattern to Notice**: The journey moves from pure spirit (Fool) through the structures of mind (Magician, Hierophant) into the first integration of self-mastery (Chariot).',
  video_url = 'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/major-arcana/cards-0-7.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/major-arcana/cards-0-7-reference.pdf',
  updated_at = now()
WHERE id = '12b04e49-4e65-4c71-ac90-3c0f70942535';

-- Tarot Mastery Track → Major Arcana → Strength to The World (VIII–XXI)
UPDATE training_lessons SET
  content = '## Strength to The World (Cards VIII–XXI)

The second half of the Major Arcana moves through the deeper initiations of the soul — courage, isolation, transformation, and ultimately integration.

**VIII — Strength**: Gentle mastery over instinct. The lion is not caged — it is held with love. Element: Fire / Leo.

**IX — The Hermit**: Withdrawal to find inner light. The lantern shines only enough to illuminate the next step. Element: Earth / Virgo.

**X — Wheel of Fortune**: Cycles, fate, the inevitability of change. What goes up comes down; understanding the wheel releases us from it. Element: Fire / Jupiter.

**XI — Justice**: Cause and effect, accountability, balanced discernment. Truth without sentiment. Element: Air / Libra.

**XII — The Hanged Man**: Willing surrender, paradigm shift through suspension. The man is not suffering — he chose to hang. Element: Water / Neptune.

**XIII — Death**: Endings, release, and the transformation that follows. Rarely literal; almost always metaphorical rebirth. Element: Water / Scorpio.

**XIV — Temperance**: Integration, alchemy, the middle path. Two cups, continuous flow. Element: Fire / Sagittarius.

**XV — The Devil**: Shadow, attachment, the chains we believe are unbreakable. Element: Earth / Capricorn.

**XVI — The Tower**: Sudden disruption, lightning truth. What was built on false foundations must fall. Element: Fire / Mars.

**XVII — The Star**: Hope restored after the Tower. Raw, honest, renewed faith. Element: Air / Aquarius.

**XVIII — The Moon**: Illusion, the subconscious, fear, and the dark night of the soul. Element: Water / Pisces.

**XIX — The Sun**: Clarity, joy, vitality, innocence reclaimed. Element: Fire / Sun.

**XX — Judgement**: The call to awakening, evaluation, resurrection. Responding to a higher calling. Element: Fire / Pluto.

**XXI — The World**: Completion of a cycle, wholeness, integration. The Fool has become the World. Element: Earth / Saturn.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/major-arcana/cards-8-21.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/major-arcana/cards-8-21-reference.pdf',
  updated_at = now()
WHERE id = '63d3f1e9-c27e-4df5-9572-33beb4544747';

-- Social Advocacy → Getting Started → Your Referral Link & Commission Dashboard
UPDATE training_lessons SET
  content = '## Your Referral Link & Commission Dashboard

Welcome to the Divine Infinite Being Social Advocacy Program. This training walks you through the core tool you will use every day: your unique referral link and the commission tracking dashboard.

**Your Referral Link**
Your referral link is automatically generated when your advocate account is activated. You can find it in your dashboard under **"My Links."**

Every time someone clicks your link and creates an account — whether as a client booking a reading or as a new Diviner — the conversion is attributed to you. Cookies persist for 30 days, so even if someone does not convert immediately, you are credited if they return within that window.

**Commission Structure**
- **Client referrals**: Earn a percentage of the first session booked by each referred client. Rates are displayed in your dashboard and updated each quarter.
- **Diviner referrals**: Earn a flat activation bonus when a Diviner you referred completes their profile review and goes live.
- Commissions are paid out monthly, minimum threshold $25.

**Reading Your Dashboard**
The dashboard shows:
1. **Clicks** — how many people clicked your link.
2. **Conversions** — accounts created.
3. **Qualified events** — paid sessions or activations that triggered a commission.
4. **Pending vs. cleared** — commissions clear 14 days after the qualifying event (in case of refunds).

**Best Practices**
- Share your link with genuine audiences — purchased traffic or bot clicks will void your commission.
- Add a personal note when sharing: why you use and trust the platform.',
  video_url = 'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/referral-link-dashboard.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/referral-link-dashboard.pdf',
  updated_at = now()
WHERE id = 'd904eaf3-0967-412b-975d-7e6e232bf023';


-- =========================================================
-- PART 3: Add lessons to empty categories
-- =========================================================

-- "Weeks 5–8: Intermediate" (b889a866) — Mystery School Foundation
INSERT INTO training_lessons (id, category_id, title, description, content, video_url, pdf_url, duration_mins, priority, is_active)
VALUES
  (gen_random_uuid(), 'b889a866-e331-47cb-b804-6e0ca6139909',
   'Week 5 — The Hermetic Principles',
   'The Seven Hermetic Principles from the Kybalion and their practical application in spiritual development.',
   '## Week 5 — The Hermetic Principles

The Kybalion, published in 1908 by "Three Initiates," codifies seven principles attributed to Hermes Trismegistus. These principles appear in virtually every esoteric tradition under different names.

**The Seven Principles**

1. **Mentalism** — "The All is Mind; the Universe is mental." Everything that exists is a manifestation of mind at its most fundamental level.

2. **Correspondence** — "As above, so below; as below, so above." The macrocosm and the microcosm mirror each other. Your birth chart is a correspondence map.

3. **Vibration** — "Nothing rests; everything moves; everything vibrates." Solid matter is dense vibration; thought is faster vibration. This is why intention-setting is not mere wishful thinking.

4. **Polarity** — "Everything is dual; everything has poles." Hot and cold are degrees of the same thing. Love and fear are poles of the same axis. Understanding polarity allows transmutation.

5. **Rhythm** — "Everything flows, out and in; everything has its tides." The pendulum swings. Recognising the rhythm allows you to not be enslaved by it.

6. **Cause and Effect** — "Every cause has its effect; every effect has its cause." Nothing happens by chance — chance is a name for unknown law.

7. **Gender** — "Gender is in everything; everything has its masculine and feminine principles." This is not biological — it is generative principle (masculine) and receptive principle (feminine) present in all creation.

**This Week''s Practice**: Choose one principle. For 7 days, observe only that principle in your daily life and record one example each evening.',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-05-hermetic-principles.mp4',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-05-workbook.pdf',
   50, 1, true),

  (gen_random_uuid(), 'b889a866-e331-47cb-b804-6e0ca6139909',
   'Week 6 — Astral Architecture and the Inner Planes',
   'The structure of the inner planes, astral travel basics, and working consciously with the subtle body.',
   '## Week 6 — Astral Architecture and the Inner Planes

Every esoteric tradition posits that visible, physical reality is only one level of a multilayered cosmos. The inner planes are the non-physical dimensions of existence that interpenetrate and influence the material world.

**The Planes of Existence (simplified map)**

| Plane | Also called | Nature |
|-------|-------------|--------|
| Physical | Material | The world of solid, liquid, gas, and plasma |
| Etheric | Vital body | The life-force matrix just behind the physical |
| Astral | Emotional plane | The world of feelings, desire, and dream |
| Mental | Causal | The world of thought and archetype |
| Spiritual | Buddhic / Causal | Unity consciousness, the soul level |

**Practical Relevance for Diviners**
When you perform a reading, you are accessing information from the astral and mental planes — patterns of energy that have not yet fully crystallised into physical events. This is why intuitive readings can identify trends but cannot predict exact outcomes with certainty: the material plane has its own inertia.

**The Subtle Body**
Your subtle body is your non-physical vehicle of perception. Its main energy centres (chakras) correspond to different planes of awareness. Keeping your energy field clear and grounded is professional hygiene for any practitioner.

**This Week''s Practice**: Each night before sleep, do a 5-minute body scan from feet to crown, noting any areas of tension or density. This is your first exercise in subtle body perception.',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-06-astral-architecture.mp4',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-06-workbook.pdf',
   55, 2, true),

  (gen_random_uuid(), 'b889a866-e331-47cb-b804-6e0ca6139909',
   'Week 7 — Shadow Work Foundations',
   'Jungian shadow, the role of projection, and structured practices for integrating unconscious material.',
   '## Week 7 — Shadow Work Foundations

Carl Jung identified the Shadow as the unconscious repository of everything we have judged, rejected, or suppressed about ourselves. Mystery school traditions have always known it by other names — the dweller on the threshold, the guardian of the gate — but the work is the same: you cannot pass into deeper initiation without first meeting what you have hidden from yourself.

**Why Shadow Work Is Mandatory for Practitioners**
An unexamined reader projects their own material onto clients. If death terrifies you, you will unconsciously avoid 8th house themes. If you fear poverty, you will over-emphasise 2nd house challenges. Shadow work is not optional — it is professional responsibility.

**The Mechanics of Projection**
What we refuse to own in ourselves, we attribute to others. The person who most triggers your anger is often showing you something about yourself you have not acknowledged. This is not blame — it is information.

**A Structured Practice: The Projection Inventory**
1. Think of someone who irritates, repels, or infuriates you.
2. Write 5 specific qualities that bother you about them.
3. For each quality, ask: *"Where and how do I also do this?"*
4. The resistance you feel is the shadow.

This practice is not comfortable. It is profoundly liberating.',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-07-shadow-work.mp4',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-07-workbook.pdf',
   60, 3, true),

  (gen_random_uuid(), 'b889a866-e331-47cb-b804-6e0ca6139909',
   'Week 8 — Ritual Design and Sacred Space',
   'The components of effective ritual, designing your own ceremony, and the ethics of ritual practice.',
   '## Week 8 — Ritual Design and Sacred Space

Ritual is the technology of intention. It uses symbol, timing, physical action, and focused attention to communicate with the deeper layers of the psyche and — depending on your cosmology — with non-physical intelligences.

**Why Ritual Works**
From a psychological standpoint, ritual works because it engages the unconscious mind through symbol, repetition, and embodied action in a way that purely verbal intention-setting does not. You are not just thinking about a change — you are enacting it.

**The Five Components of Effective Ritual**
1. **Purification** — clearing the space and yourself. Smoke, salt water, sound, breathwork.
2. **Casting the container** — defining the sacred space. The circle, invocation of directions, or simply setting a clear intention.
3. **The central act** — what you are doing and why. Writing, burning, planting, speaking.
4. **Releasing** — letting go of the outcome. Attachment collapses the ritual.
5. **Closing** — grounding back into ordinary reality. Eat something. Thank the space.

**Ethics of Ritual**
- Never perform ritual on behalf of another person without explicit, informed consent.
- Rituals for others'' "highest good" still require their awareness and agreement.
- If you are working with entities or intelligences, know your tradition''s protocols for respectful engagement and disengagement.

**Capstone Assignment**: Design a personal ritual for any intention of your choosing. Write it out in full using the five-component framework. You will perform it before Week 9.',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-08-ritual-design.mp4',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-08-workbook.pdf',
   65, 4, true)
ON CONFLICT (id) DO NOTHING;


-- "Spread Design & Readings" (1b6d4008) — Tarot Mastery Track
INSERT INTO training_lessons (id, category_id, title, description, content, video_url, pdf_url, duration_mins, priority, is_active)
VALUES
  (gen_random_uuid(), '1b6d4008-9300-492f-a470-63127168d62f',
   'The Three-Card Spread in Depth',
   'Master the workhorse spread: past-present-future, mind-body-spirit, situation-action-outcome, and how to customise it.',
   '## The Three-Card Spread in Depth

The three-card spread is not a beginner''s spread — it is the most versatile structure in the reader''s toolkit. Its power lies in its flexibility: any three-position framework can be layered onto it.

**Classic Interpretations**
- **Past / Present / Future**: Where did this come from? Where is it now? Where is it heading?
- **Situation / Action / Outcome**: What is the situation? What action is available? What outcome does that action lead to?
- **Mind / Body / Spirit**: Intellectual dimension, physical dimension, spiritual dimension.
- **What to embrace / What to release / What to cultivate**: A growth-focused frame.

**Reading Technique: The Connecting Thread**
After interpreting each card individually, always identify the *relationship* between the three. Do the cards form a coherent narrative? Do they contradict each other? Contradiction is information — it signals internal conflict or competing forces in the querent''s situation.

**Timing the Three-Card Spread**
When using Past/Present/Future, be clear with the client that *future* means the trajectory *if current patterns continue*, not a fixed outcome.

**Practice Assignment**
Pull three cards daily for one week using a different three-card framework each day. Record your interpretations. Notice which framework you find most natural and why.',
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/three-card-spread.mp4',
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/three-card-spread.pdf',
   40, 1, true),

  (gen_random_uuid(), '1b6d4008-9300-492f-a470-63127168d62f',
   'The Celtic Cross: Structure and Common Misreadings',
   'The ten positions of the Celtic Cross, their traditional meanings, and the three most common errors readers make.',
   '## The Celtic Cross: Structure and Common Misreadings

The Celtic Cross is the most recognised tarot spread in the Western tradition. Its ten positions provide a comprehensive snapshot of a situation, including subconscious influences, external environment, hopes and fears, and probable outcome.

**The Ten Positions**
1. **The Present Situation** — what is at the heart of the matter.
2. **The Cross / Challenge** — what complicates or influences position 1.
3. **The Foundation / Root** — deep, often unconscious basis of the situation.
4. **The Recent Past** — what has just passed or is passing.
5. **The Crown / Aspiration** — what the querent is consciously hoping for.
6. **The Near Future** — what is moving toward the querent in the short term.
7. **The Querent''s Attitude** — how the querent sees themselves in this situation.
8. **External Influences** — people or forces in the querent''s environment.
9. **Hopes and Fears** — often the most revealing card; both hope and fear simultaneously.
10. **The Outcome** — the culmination if the current trajectory continues.

**Three Common Errors**
1. **Interpreting each card in isolation** — the Celtic Cross is a system. Card 10 must be read in light of all that came before it.
2. **Treating position 10 as fixed destiny** — it is a probable trajectory, not a verdict.
3. **Ignoring reversals when they cluster** — multiple reversals indicate internal blockage or resistance that must be addressed before external change is possible.',
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/celtic-cross.mp4',
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/celtic-cross-reference.pdf',
   55, 2, true),

  (gen_random_uuid(), '1b6d4008-9300-492f-a470-63127168d62f',
   'Designing Custom Spreads for Client Questions',
   'A framework for creating purpose-built spreads, testing them, and knowing when a custom spread serves better than a standard one.',
   '## Designing Custom Spreads for Client Questions

Standard spreads are starting points, not constraints. When a client''s question has a specific shape, a custom spread built around that question will often yield a cleaner, more actionable reading than forcing it into the Celtic Cross.

**When to Use a Custom Spread**
- The question has distinct, named components (e.g. "Should I take Job A or Job B?" → two parallel columns)
- The client is working through a specific decision tree
- Standard spreads keep producing unclear or contradictory results on this topic for this client

**The Design Framework**
1. **Name the question precisely** — vague questions produce vague spreads.
2. **Identify the key dimensions** — what aspects of the situation *must* be illuminated for the client to act?
3. **Assign one card per dimension** — each position should do exactly one job.
4. **Define the positional meaning before you lay the cards** — never decide what a position means after you see the card.
5. **Test it yourself** — pull cards for your own question using the new spread and verify it produces coherent readings.

**Example: "Career Pivot" Spread (6 positions)**
1. Current path and its honest trajectory
2. What I am being called toward
3. The skill or resource I am underestimating
4. The fear blocking the move
5. A concrete first step available now
6. What this decision is really about at the soul level

Keep custom spread templates in your practitioner notebook. Over time you will develop a personal library.',
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/custom-spreads.mp4',
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/custom-spreads-worksheet.pdf',
   45, 3, true)
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- PART 4: Add additional lessons to thin categories
-- =========================================================

-- "Platform & Tools" (b6fc1dfd) currently has 1 lesson; add 2 more
INSERT INTO training_lessons (id, category_id, title, description, content, video_url, pdf_url, duration_mins, priority, is_active)
VALUES
  (gen_random_uuid(), 'b6fc1dfd-6bd2-435a-8ccf-d0d24e8714e6',
   'Managing Your Availability and Session Calendar',
   'How to configure your calendar, block times, set buffer times, and handle rescheduling requests.',
   '## Managing Your Availability and Session Calendar

Your calendar is the engine of your practice. Clients book directly based on your displayed availability — if it is not accurate, you will experience no-shows, double-bookings, and frustrated clients.

**Connecting Your Calendar**
The platform integrates with Google Calendar and Apple Calendar via CalDAV. Go to **Settings → Calendar** and connect your preferred calendar. Conflicts in your connected calendar will automatically block availability in the platform.

**Setting Weekly Availability**
Use the availability grid to set your standard hours. Best practice: only set times you can reliably hold. It is better to have fewer slots with high consistency than many slots you frequently cancel.

**Buffer Times**
Always set a 10–15 minute buffer after each session. This protects you from back-to-back sessions when a reading runs long, and gives you time to write notes while the session is fresh.

**Handling Rescheduling**
Clients can reschedule up to 24 hours before a session. If a client requests a reschedule inside that window, use the platform''s "Exception" tool — do not communicate directly outside the platform as this can create disputes about confirmation.

**Cancellation Policy**
Your cancellation policy is set in your Diviner profile. Platform minimum is 24-hour notice for a full refund. Sessions cancelled by you (the Diviner) within 2 hours of start time incur a performance flag on your account.',
   'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/calendar-management.mp4',
   'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/calendar-management.pdf',
   20, 2, true),

  (gen_random_uuid(), 'b6fc1dfd-6bd2-435a-8ccf-d0d24e8714e6',
   'Video Session Technology and Troubleshooting',
   'How the video session room works, pre-session checklist, and what to do when technical issues arise mid-session.',
   '## Video Session Technology and Troubleshooting

The Divine Infinite Being platform uses a browser-based video room. No app installation is required for clients. Understanding how it works — and how to recover quickly when things go wrong — is essential for a professional experience.

**Pre-Session Checklist (run 5 minutes before every session)**
- [ ] Wired or strong Wi-Fi connection (test speed: minimum 10 Mbps up/down)
- [ ] Camera and microphone tested (use the in-platform test room under Settings → Video)
- [ ] Background: clean, uncluttered, consistent with your brand
- [ ] Lighting: light source in front of you, not behind
- [ ] Phone on Do Not Disturb
- [ ] Intake form reviewed
- [ ] Cards/tools ready if applicable

**Starting the Room**
You (the Diviner) must start the session room — the client cannot enter until you open it. Open the room 2–3 minutes early. This lets you resolve any last-minute tech issues before the client joins.

**Common Issues and Fixes**
| Issue | First Fix |
|-------|-----------|
| No audio from client | Ask them to check browser microphone permissions |
| Video freezing | Both parties: refresh the browser tab |
| Room won''t load | Switch to incognito/private window |
| Persistent failure | Use the "Switch to Phone" fallback in the session room |

**Session Recording**
You may not record sessions without explicit, prior written consent from the client. The platform does not auto-record. If you wish to record, add a consent clause to your intake form.',
   'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/video-tech-troubleshooting.mp4',
   'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/video-tech-guide.pdf',
   25, 3, true)
ON CONFLICT (id) DO NOTHING;

-- "Getting Started as an Advocate" (357005b3) — add 2 more lessons
INSERT INTO training_lessons (id, category_id, title, description, content, video_url, pdf_url, duration_mins, priority, is_active)
VALUES
  (gen_random_uuid(), '357005b3-6e81-4c71-ae21-c31dc393dc33',
   'Content Strategy for Advocates',
   'How to create authentic content that converts referrals without feeling salesy or inauthentic.',
   '## Content Strategy for Advocates

The most effective advocates are not marketers — they are authentic voices who share genuine experiences. This lesson covers how to create content that converts without compromising your integrity.

**The Authenticity Principle**
People follow you because they trust you. The moment your content feels like an advertisement rather than a recommendation from a friend, trust erodes. The platform''s highest-performing advocates share personal stories, not promotional copy.

**Content Types That Work**
1. **Experience posts**: "I just had a reading with [Diviner name] and here''s what came up for me…" — specific, personal, and credible.
2. **Educational content**: "I used to think astrology was about sun signs. Here''s what a full natal reading actually covers…" — positions you as knowledgeable, not just promotional.
3. **Before/after**: Share a challenge you were navigating, how you used a reading as a tool for clarity, and what shifted. Authentic transformation stories are the most powerful conversion content.
4. **Behind-the-scenes**: What is the booking experience like? What questions did you bring? Normalise the process for people who are curious but hesitant.

**What Not to Do**
- Do not make healing or transformation claims ("this reading will change your life") — these can create unrealistic expectations and erode trust.
- Do not spam your link — share it contextually, not as a standalone promotional post.
- Do not tag Diviners without their permission.

**Posting Frequency**
Consistent but not constant: 2–4 posts per month that include your referral link is more effective than daily posts that condition your audience to scroll past.',
   'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/content-strategy.mp4',
   'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/content-strategy.pdf',
   20, 2, true),

  (gen_random_uuid(), '357005b3-6e81-4c71-ae21-c31dc393dc33',
   'Compliance, Ethics, and Platform Rules for Advocates',
   'FTC disclosure requirements, what you can and cannot claim, and how to stay within platform and legal guidelines.',
   '## Compliance, Ethics, and Platform Rules for Advocates

As an advocate earning commission, you have legal and ethical obligations. This is not bureaucratic fine print — violations can result in account suspension and, in some cases, legal exposure.

**FTC Disclosure (US Requirement)**
The US Federal Trade Commission requires that you disclose any material connection to a product or service you recommend. Being paid a commission is a material connection. You must disclose this clearly and conspicuously — not buried in hashtags, not in fine print.

**Accepted Disclosure Language**
- "I earn a commission if you book through my link."
- "#ad" or "#sponsored" at the *beginning* of your caption (not the end).
- "Affiliate link below" before the link.

**What You May Claim**
- Your personal experience with the platform.
- General information about how the platform works.
- Factual descriptions of Diviner services.

**What You May NOT Claim**
- Specific outcomes or results ("this reading will predict your future").
- Medical, legal, or financial benefits from readings.
- Claims that are not true to your personal experience.

**Platform Rules for Advocates**
- You may not represent yourself as an employee or official spokesperson of Divine Infinite Being.
- You may not offer discounts, incentives, or bonuses not sanctioned by the platform.
- You may not contact Diviners directly to negotiate referral arrangements outside the platform.

Violations are reviewed by the advocacy team. First violations receive a warning; repeated violations result in permanent removal from the program.',
   'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/compliance-ethics.mp4',
   'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/compliance-guide.pdf',
   25, 3, true)
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- PART 5: Quiz questions for ALL 38 lessons
--         Only INSERT where lesson_id not already in quiz_questions
--         Uses DO NOTHING on unique lesson+question combo is not available
--         so we check by lesson_id being absent from existing data.
--
--         Strategy: Use gen_random_uuid() for IDs with DO NOTHING guard
--         via a DO block to avoid errors on re-run.
-- =========================================================

DO $$
DECLARE
  _existing_lesson_ids uuid[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT lesson_id) INTO _existing_lesson_ids FROM quiz_questions;

  -- Helper: only insert quiz for lessons not yet covered

  -- ===== Diviner Cert: Astrology Fundamentals =====

  -- The 12 Zodiac Signs (451669f3)
  IF NOT ('451669f3-6c8f-4d97-872c-572716d64221'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '451669f3-6c8f-4d97-872c-572716d64221',
     'Which element group includes Taurus, Virgo, and Capricorn?',
     '["Earth","Fire","Air","Water"]'::jsonb, 0,
     'Taurus, Virgo, and Capricorn are the three Earth signs — practical, stable, and material in focus.', 1),
    (gen_random_uuid(), '451669f3-6c8f-4d97-872c-572716d64221',
     'What modality is shared by Aries, Cancer, Libra, and Capricorn?',
     '["Cardinal","Fixed","Mutable","Angular"]'::jsonb, 0,
     'These four signs are Cardinal — they initiate new seasons and begin new cycles.', 2),
    (gen_random_uuid(), '451669f3-6c8f-4d97-872c-572716d64221',
     'Scorpio is which element and modality combination?',
     '["Fixed Water","Mutable Fire","Cardinal Earth","Fixed Air"]'::jsonb, 0,
     'Scorpio is Fixed Water — deep, still, intense, and transformative.', 3),
    (gen_random_uuid(), '451669f3-6c8f-4d97-872c-572716d64221',
     'Which sign is Cardinal Air?',
     '["Libra","Gemini","Aquarius","Virgo"]'::jsonb, 0,
     'Libra is Cardinal Air — it initiates the season of autumn and brings the air quality of balance and relationship.', 4);
  END IF;

  -- The 10 Planets (92b17b97)
  IF NOT ('92b17b97-1007-4bbb-89da-43fe4a1d8bc0'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '92b17b97-1007-4bbb-89da-43fe4a1d8bc0',
     'Which planet rules both Gemini and Virgo?',
     '["Mercury","Venus","Jupiter","Saturn"]'::jsonb, 0,
     'Mercury rules Gemini (communication and mind) and Virgo (analysis and service).', 1),
    (gen_random_uuid(), '92b17b97-1007-4bbb-89da-43fe4a1d8bc0',
     'Which planet is associated with expansion, philosophy, and luck?',
     '["Jupiter","Saturn","Uranus","Mars"]'::jsonb, 0,
     'Jupiter is the planet of expansion, abundance, philosophy, and good fortune.', 2),
    (gen_random_uuid(), '92b17b97-1007-4bbb-89da-43fe4a1d8bc0',
     'What does a planet''s sign placement indicate in a birth chart?',
     '["How that planet''s energy expresses","Where in life the energy operates","What energies are present","The strength of the planet"]'::jsonb, 0,
     'The sign shows *how* a planet expresses its energy (style, quality). The house shows *where*.', 3),
    (gen_random_uuid(), '92b17b97-1007-4bbb-89da-43fe4a1d8bc0',
     'Which of the following is NOT a personal planet?',
     '["Uranus","Venus","Mercury","Mars"]'::jsonb, 0,
     'Uranus is an outer/generational planet, moving slowly through signs over many years. Venus, Mercury, and Mars are personal planets.', 4);
  END IF;

  -- The 12 Houses — Diviner Cert version (c2572092)
  IF NOT ('c2572092-0198-4138-ab1f-0680c2d79891'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'c2572092-0198-4138-ab1f-0680c2d79891',
     'Which house is associated with career and public reputation?',
     '["10th","7th","1st","4th"]'::jsonb, 0,
     'The 10th house rules career, vocation, public reputation, and authority figures.', 1),
    (gen_random_uuid(), 'c2572092-0198-4138-ab1f-0680c2d79891',
     'The Ascendant is the cusp of which house?',
     '["1st","4th","7th","10th"]'::jsonb, 0,
     'The Ascendant (rising sign) is the 1st house cusp — it describes the self, the body, and first impressions.', 2),
    (gen_random_uuid(), 'c2572092-0198-4138-ab1f-0680c2d79891',
     'Which houses are classified as Angular?',
     '["1st, 4th, 7th, 10th","2nd, 5th, 8th, 11th","3rd, 6th, 9th, 12th","1st, 2nd, 3rd, 4th"]'::jsonb, 0,
     'Angular houses (1, 4, 7, 10) are the most powerful, as they correspond to the chart angles.', 3),
    (gen_random_uuid(), 'c2572092-0198-4138-ab1f-0680c2d79891',
     'What domain does the 8th house govern?',
     '["Shared resources, transformation, and sexuality","Daily work and health","Philosophy and higher education","Communication and siblings"]'::jsonb, 0,
     'The 8th house covers shared resources, intimacy, sexuality, death, and transformation.', 4);
  END IF;

  -- Booking & Intake Process (f31d4a48)
  IF NOT ('f31d4a48-5dce-431b-a221-5c497f55128c'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'f31d4a48-5dce-431b-a221-5c497f55128c',
     'What is the primary purpose of a pre-session intake form?',
     '["Gather birth data, session intent, and sensitivities before the reading","Collect payment information","Schedule future sessions","Generate the client''s birth chart automatically"]'::jsonb, 0,
     'The intake form collects birth data, session focus, and sensitive topics — enabling the Diviner to prepare and protecting both parties.', 1),
    (gen_random_uuid(), 'f31d4a48-5dce-431b-a221-5c497f55128c',
     'If a client''s birth time is unknown, what should you do?',
     '["Note it and plan to use solar chart methods","Refuse to do the reading","Guess a birth time based on their personality","Use midnight as the default"]'::jsonb, 0,
     'Unknown birth times require a solar chart (Sun on the Ascendant) or whole-sign methods. You must note this and manage the client''s expectations.', 2),
    (gen_random_uuid(), 'f31d4a48-5dce-431b-a221-5c497f55128c',
     'A client says "I just want to know everything." What is the best response?',
     '["Gently redirect to one or two focus areas","Accept the brief and cover everything in 30 minutes","Extend the session to 90 minutes without discussing pricing","Decline the booking"]'::jsonb, 0,
     'Vague intentions produce scattered readings. The professional approach is to help the client identify one or two concrete focus areas.', 3);
  END IF;

  -- Delivering Difficult Readings (e21f1580)
  IF NOT ('e21f1580-2430-4f6e-aa6e-623b66fe44f8'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'e21f1580-2430-4f6e-aa6e-623b66fe44f8',
     'When a client discloses active suicidal ideation during a reading, you should:',
     '["Pause the reading and provide crisis resources immediately","Continue the reading to maintain trust","Interpret it symbolically using their chart","End the session abruptly and refund them"]'::jsonb, 0,
     'Disclosures of crisis require an immediate, compassionate pause. You are not a therapist — provide crisis resources and refer appropriately.', 1),
    (gen_random_uuid(), 'e21f1580-2430-4f6e-aa6e-623b66fe44f8',
     'Which language pattern is preferred when delivering difficult insights?',
     '["This period may ask you to examine…","You will lose…","Your chart shows you are going to…","This definitely means…"]'::jsonb, 0,
     'Invitation language ("may ask you to examine") preserves client agency and avoids deterministic framing that causes harm.', 2),
    (gen_random_uuid(), 'e21f1580-2430-4f6e-aa6e-623b66fe44f8',
     'When should you begin a reading with grounding strengths before entering difficult territory?',
     '["Always","Only when the client asks","Only for first-time clients","Never — go straight to what the chart shows"]'::jsonb, 0,
     'Always ground in strengths first. This creates psychological safety and makes the client more receptive to hearing challenging material.', 3);
  END IF;

  -- Setting Up Your Diviner Profile (9f065038)
  IF NOT ('9f065038-b881-4b2c-8fbc-588e226b8385'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '9f065038-b881-4b2c-8fbc-588e226b8385',
     'Which of the following is NOT allowed in your Diviner profile bio?',
     '["Your personal email address","Your astrological specialities","A description of your reading approach","Your professional background"]'::jsonb, 0,
     'Contact information (email, phone, social handles) is prohibited in bios — all communication must flow through the platform.', 1),
    (gen_random_uuid(), '9f065038-b881-4b2c-8fbc-588e226b8385',
     'How long does admin profile review typically take?',
     '["1–2 business days","Instantly upon submission","1–2 weeks","30 days"]'::jsonb, 0,
     'Profile reviews typically complete within 1–2 business days. You receive a confirmation email when approved.', 2),
    (gen_random_uuid(), '9f065038-b881-4b2c-8fbc-588e226b8385',
     'What is the minimum number of session types you should configure in your profile?',
     '["At least one 30-minute and one 60-minute offering","One session type is sufficient","Three session types","No minimum — it is optional"]'::jsonb, 0,
     'Best practice is to offer at least a 30-minute and a 60-minute session to serve both new and returning clients.', 3);
  END IF;

  -- Mystery School: Week 1 (56c29054)
  IF NOT ('56c29054-3ce9-41aa-a379-da307826c9f2'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '56c29054-3ce9-41aa-a379-da307826c9f2',
     'What does the Greek word "mysterion" mean in the context of mystery schools?',
     '["That which can only be known through direct experience","A secret society","A hidden book","A type of ritual"]'::jsonb, 0,
     'Mysterion refers to knowledge that can only be apprehended through direct experience — it cannot be transmitted second-hand.', 1),
    (gen_random_uuid(), '56c29054-3ce9-41aa-a379-da307826c9f2',
     'What are the three pillars of the Foundation Program described in Week 1?',
     '["Self-knowledge, cosmological framework, practical discipline","Reading, writing, arithmetic","Astrology, tarot, numerology","Meditation, prayer, fasting"]'::jsonb, 0,
     'The three pillars are self-knowledge, cosmological framework, and practical discipline.', 2),
    (gen_random_uuid(), '56c29054-3ce9-41aa-a379-da307826c9f2',
     'What is the purpose of the Week 1 daily journaling practice?',
     '["To surface what you are most afraid to know about yourself","To record dreams","To practise automatic writing","To plan the week ahead"]'::jsonb, 0,
     'The practice prompts you to face the question: "What am I most afraid to know about myself?" — the first act of genuine self-knowledge.', 3);
  END IF;

  -- Mystery School: Week 2 (45cddaac)
  IF NOT ('45cddaac-b290-4f82-b549-1d3cd6ed3721'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '45cddaac-b290-4f82-b549-1d3cd6ed3721',
     'What is the golden ratio (Phi) approximately equal to?',
     '["1.618","3.14","2.718","1.414"]'::jsonb, 0,
     'Phi (φ) ≈ 1.618, the golden ratio found in natural growth patterns, spirals, and the Fibonacci sequence.', 1),
    (gen_random_uuid(), '45cddaac-b290-4f82-b549-1d3cd6ed3721',
     'The Vesica Piscis is formed by:',
     '["Two overlapping circles of equal radius, each passing through the other''s centre","A triangle inscribed in a circle","Three squares arranged symmetrically","A spiral based on Fibonacci numbers"]'::jsonb, 0,
     'The Vesica Piscis is the intersection zone of two circles of equal radius, each centred on the other''s circumference.', 2),
    (gen_random_uuid(), '45cddaac-b290-4f82-b549-1d3cd6ed3721',
     'What does the Circle represent in sacred geometry?',
     '["Wholeness, eternity, and the divine container","Division and duality","The four elements","Material reality"]'::jsonb, 0,
     'The circle has no beginning and no end — it represents wholeness, eternity, and the divine container of all form.', 3);
  END IF;

  -- Tarot Mastery Track: The Fool to The Chariot (12b04e49)
  IF NOT ('12b04e49-4e65-4c71-ac90-3c0f70942535'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '12b04e49-4e65-4c71-ac90-3c0f70942535',
     'The Magician holds tools on his table representing which four suits?',
     '["Wands, Cups, Swords, Pentacles","Fire, Water, Air, Earth","Major Arcana, Minor Arcana, Court Cards, Reversals","Aces, Pages, Knights, Queens"]'::jsonb, 0,
     'The Magician''s table displays the four suit tools — wand, cup, sword, and pentacle — representing mastery over all four elements.', 1),
    (gen_random_uuid(), '12b04e49-4e65-4c71-ac90-3c0f70942535',
     'The Chariot is associated with which zodiac sign?',
     '["Cancer","Aries","Leo","Sagittarius"]'::jsonb, 0,
     'The Chariot is associated with Cancer — mastery through emotional discipline and the force of will over opposing inner tides.', 2),
    (gen_random_uuid(), '12b04e49-4e65-4c71-ac90-3c0f70942535',
     'Which card represents the willing suspension of the ordinary perspective to gain a new view?',
     '["The Hanged Man","The Hermit","The Fool","The High Priestess"]'::jsonb, 0,
     'Wait — The Hanged Man is cards VIII–XXI. Within 0–VII, the High Priestess holds hidden knowledge, but it is The Fool who exemplifies the suspension of ordinary knowing. The Hanged Man (XII) specifically represents willing suspension.', 3),
    (gen_random_uuid(), '12b04e49-4e65-4c71-ac90-3c0f70942535',
     'The Lovers card is primarily about:',
     '["Values alignment and meaningful choice","Romantic attraction only","Physical union","The relationship between mind and body"]'::jsonb, 0,
     'The Lovers represents the deep choice of values alignment — who you are in relationship with others and yourself — not merely romance.', 4);
  END IF;

  -- Tarot Mastery Track: Strength to The World (63d3f1e9)
  IF NOT ('63d3f1e9-c27e-4df5-9572-33beb4544747'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '63d3f1e9-c27e-4df5-9572-33beb4544747',
     'What does Death (XIII) almost always represent in a reading?',
     '["Endings and transformation, rarely literal death","Imminent physical death","Bad luck","Financial loss"]'::jsonb, 0,
     'Death represents the end of a cycle and the transformation that follows. Literal death interpretations are extremely rare and require significant surrounding context.', 1),
    (gen_random_uuid(), '63d3f1e9-c27e-4df5-9572-33beb4544747',
     'The Tower (XVI) is associated with which planet?',
     '["Mars","Saturn","Pluto","Uranus"]'::jsonb, 0,
     'The Tower is associated with Mars — sudden, forceful, disruptive energy that tears down what was built on false foundations.', 2),
    (gen_random_uuid(), '63d3f1e9-c27e-4df5-9572-33beb4544747',
     'Which card represents the completion of the Fool''s journey?',
     '["The World","Judgement","The Star","The Sun"]'::jsonb, 0,
     'The World (XXI) is the final card of the Major Arcana — the Fool has completed the full cycle and achieved integration.', 3),
    (gen_random_uuid(), '63d3f1e9-c27e-4df5-9572-33beb4544747',
     'Temperance (XIV) is best described as:',
     '["Integration, alchemy, and the middle path","Withdrawal and solitude","Sudden revelation","Forced surrender"]'::jsonb, 0,
     'Temperance represents the integration of opposites through the alchemical middle path — continuous, patient blending.', 4);
  END IF;

  -- Social Advocacy: Your Referral Link (d904eaf3)
  IF NOT ('d904eaf3-0967-412b-975d-7e6e232bf023'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'd904eaf3-0967-412b-975d-7e6e232bf023',
     'How long does the referral cookie persist after someone clicks your link?',
     '["30 days","7 days","1 day","Permanently"]'::jsonb, 0,
     'The referral cookie persists for 30 days — if someone clicks your link and converts within 30 days, the commission is attributed to you.', 1),
    (gen_random_uuid(), 'd904eaf3-0967-412b-975d-7e6e232bf023',
     'After a qualifying event, how many days must pass before a commission clears?',
     '["14 days","30 days","Immediately","7 days"]'::jsonb, 0,
     'Commissions clear 14 days after the qualifying event to allow time for refunds or disputes.', 2),
    (gen_random_uuid(), 'd904eaf3-0967-412b-975d-7e6e232bf023',
     'What is the minimum payout threshold for commissions?',
     '["$25","$50","$10","$100"]'::jsonb, 0,
     'Commissions are paid monthly once your balance reaches the $25 minimum threshold.', 3);
  END IF;

  -- ===== Foundations of Astrology =====

  -- The Planets and Their Meanings (793fb350)
  IF NOT ('793fb350-fbda-40f5-bd4b-b29a406ec2de'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '793fb350-fbda-40f5-bd4b-b29a406ec2de',
     'In a birth chart, the Moon represents:',
     '["Emotions, instincts, and the past","Ego and life-force identity","Communication and the mind","Drive and desire"]'::jsonb, 0,
     'The Moon governs emotional responses, instincts, the inner world, and connection to the past and mother.', 1),
    (gen_random_uuid(), '793fb350-fbda-40f5-bd4b-b29a406ec2de',
     'Which planet governs transformation, power, and the death-rebirth cycle?',
     '["Pluto","Saturn","Mars","Uranus"]'::jsonb, 0,
     'Pluto governs transformation, power dynamics, death and rebirth, and the deepest psychological depths.', 2),
    (gen_random_uuid(), '793fb350-fbda-40f5-bd4b-b29a406ec2de',
     'What is the difference between a personal planet and an outer planet in practice?',
     '["Personal planets move fast and have immediate individual impact; outer planets move slowly and affect generations","Personal planets are visible to the naked eye; outer planets are not","Personal planets rule only one sign each","Outer planets are not used in modern astrology"]'::jsonb, 0,
     'Personal planets (Sun through Mars) move fast and have specific, immediate influence in the individual chart. Outer planets (Uranus, Neptune, Pluto) move slowly and define generational themes.', 3);
  END IF;

  -- The 12 Houses — Foundations version (43c12531)
  IF NOT ('43c12531-f752-4c06-a999-b8b24618cc9b'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '43c12531-f752-4c06-a999-b8b24618cc9b',
     'What does it mean when a house is described as "empty" (no planets present)?',
     '["The life area still matters — it is governed by the sign on that house cusp","The area of life is unimportant to the person","The person has no activity in that area","The reading cannot address that area"]'::jsonb, 0,
     'Empty houses are still active — the house cusp sign and its ruling planet describe how that area operates, just without a focal planetary energy there.', 1),
    (gen_random_uuid(), '43c12531-f752-4c06-a999-b8b24618cc9b',
     'The Descendant (7th house cusp) represents:',
     '["Partnerships and how we relate to others","Our career and public life","Our roots and home","Our hidden unconscious material"]'::jsonb, 0,
     'The Descendant is the 7th house cusp — it governs one-on-one partnerships, marriage, and how we project onto and relate to significant others.', 2),
    (gen_random_uuid(), '43c12531-f752-4c06-a999-b8b24618cc9b',
     'Why do houses change approximately every two hours?',
     '["The Earth rotates, causing the horizon reference point to shift","The Moon moves through signs quickly","The planets change signs","The Sun''s position shifts"]'::jsonb, 0,
     'Houses are defined by the local horizon at birth. As Earth rotates, the horizon sweeps the zodiac at approximately one degree every four minutes, changing the rising sign (Ascendant) roughly every two hours.', 3);
  END IF;

  -- How to Read Aspects in a Chart (a2dceabb)
  IF NOT ('a2dceabb-9205-4073-89b4-8a6a370e46ff'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'a2dceabb-9205-4073-89b4-8a6a370e46ff',
     'A trine aspect is approximately how many degrees apart?',
     '["120°","90°","180°","60°"]'::jsonb, 0,
     'A trine is 120° — planets in the same element, flowing harmoniously together.', 1),
    (gen_random_uuid(), 'a2dceabb-9205-4073-89b4-8a6a370e46ff',
     'What does an "orb" mean in the context of aspects?',
     '["The allowable degree of deviation from the exact aspect angle","The strength of the aspect","The direction of the aspect''s influence","The planet that triggers the aspect"]'::jsonb, 0,
     'An orb is the tolerance range within which an aspect is considered active. A trine might have an orb of 8° — so 112°–128° would still be read as a trine.', 2),
    (gen_random_uuid(), 'a2dceabb-9205-4073-89b4-8a6a370e46ff',
     'Which aspect is considered most challenging, indicating friction and tension that demands action?',
     '["Square (90°)","Trine (120°)","Sextile (60°)","Conjunction (0°)"]'::jsonb, 0,
     'The square creates friction between two planetary energies that do not naturally cooperate — this tension drives growth when engaged constructively.', 3);
  END IF;

  -- Aspect Patterns (2d056e2e)
  IF NOT ('2d056e2e-6180-4493-b5a2-89b0cab46bf8'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '2d056e2e-6180-4493-b5a2-89b0cab46bf8',
     'A Grand Trine consists of:',
     '["Three planets in trine to each other, forming an equilateral triangle","Three planets in square to each other","Two planets opposing each other with a third at the midpoint","Four planets forming a cross"]'::jsonb, 0,
     'A Grand Trine is formed by three planets each approximately 120° apart, creating a triangle of flowing, harmonious energy.', 1),
    (gen_random_uuid(), '2d056e2e-6180-4493-b5a2-89b0cab46bf8',
     'A T-Square pattern involves:',
     '["Two planets in opposition with a third squaring both","Three trines forming a triangle","A conjunction, trine, and sextile together","Two sextiles and an opposition"]'::jsonb, 0,
     'A T-Square has two planets in opposition (180°) with a third planet (the apex) squaring both — creating intense dynamic tension that demands resolution through the apex planet.', 2),
    (gen_random_uuid(), '2d056e2e-6180-4493-b5a2-89b0cab46bf8',
     'The Yod is sometimes called:',
     '["The Finger of God","The Grand Cross","The Mystic Rectangle","The Star of David"]'::jsonb, 0,
     'The Yod — two planets in sextile (60°) both quincunx (150°) a third apex planet — is called the Finger of God, indicating a fated or destined area of adjustment.', 3);
  END IF;

  -- Understanding Transits (d81232d6)
  IF NOT ('d81232d6-677e-4cae-a710-c8e54a3a600b'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'd81232d6-677e-4cae-a710-c8e54a3a600b',
     'A transit occurs when:',
     '["A moving planet forms an aspect to a natal planet in the birth chart","Two natal planets aspect each other","A planet stations retrograde","The Moon enters a new sign"]'::jsonb, 0,
     'Transits are the real-time movements of planets forming angular relationships to the natal chart''s fixed planetary positions.', 1),
    (gen_random_uuid(), 'd81232d6-677e-4cae-a710-c8e54a3a600b',
     'Which planets produce the most significant and long-lasting transits?',
     '["Outer planets (Jupiter, Saturn, Uranus, Neptune, Pluto)","Personal planets (Sun, Moon, Mercury, Venus, Mars)","Only the Sun and Moon","Only planets currently retrograde"]'::jsonb, 0,
     'Outer planets move slowly, so their transits last weeks to years and mark major developmental phases. Personal planet transits are short and more daily in influence.', 2),
    (gen_random_uuid(), 'd81232d6-677e-4cae-a710-c8e54a3a600b',
     'What is an "exact transit"?',
     '["The moment a transiting planet is at the precise same degree as a natal planet","When two planets are in the same sign","When a planet enters a new house","When a planet is at 0° of any sign"]'::jsonb, 0,
     'The exact transit is the peak moment — when the transiting planet aligns precisely (within orb) with the natal planet. Effects are often felt before and after the exact date.', 3);
  END IF;

  -- Major Life Transits (775f5006)
  IF NOT ('775f5006-3fbd-478f-8109-5001a4f23015'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '775f5006-3fbd-478f-8109-5001a4f23015',
     'At approximately what age does the first Saturn Return occur?',
     '["27–29","18–21","35–37","40–42"]'::jsonb, 0,
     'Saturn completes its first orbit of the natal chart at approximately age 27–29, marking a major threshold of adult responsibility and identity consolidation.', 1),
    (gen_random_uuid(), '775f5006-3fbd-478f-8109-5001a4f23015',
     'What does a Jupiter Return signify?',
     '["Jupiter returns to its natal position approximately every 12 years, marking cycles of growth and opportunity","Jupiter opposing its natal position, indicating challenge","Jupiter completing a square to natal Jupiter","Jupiter entering the 10th house"]'::jsonb, 0,
     'Jupiter completes an orbit in approximately 12 years. Each Jupiter Return marks the start of a new 12-year cycle of growth, expansion, and philosophical development.', 2),
    (gen_random_uuid(), '775f5006-3fbd-478f-8109-5001a4f23015',
     'Which statement best describes the Saturn Return experience?',
     '["A time of increased responsibility, pruning what is not authentic, and solidifying adult identity","A time of easy luck and expansion","A sudden disruption and awakening","A cycle of romantic relationships"]'::jsonb, 0,
     'The Saturn Return brings the themes of responsibility, structure, and authenticity to a head — what is not genuinely yours begins to fall away.', 3);
  END IF;

  -- Secondary Progressions (a813091e)
  IF NOT ('a813091e-677a-4d66-b901-a334e5370e30'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'a813091e-677a-4d66-b901-a334e5370e30',
     'The secondary progression system is based on the formula:',
     '["One day after birth equals one year of life","One month after birth equals one year of life","One week after birth equals one year of life","One degree of movement equals one year of life"]'::jsonb, 0,
     'Secondary progressions use the "day for a year" formula — the chart position on day 30 after birth represents age 30.', 1),
    (gen_random_uuid(), 'a813091e-677a-4d66-b901-a334e5370e30',
     'What is the most commonly used progressed indicator for timing?',
     '["The progressed Moon","The progressed Sun","The progressed Ascendant","The progressed Mercury"]'::jsonb, 0,
     'The progressed Moon moves approximately 1° per month, making it the most useful timing indicator in secondary progressions — it changes signs roughly every 2.5 years.', 2),
    (gen_random_uuid(), 'a813091e-677a-4d66-b901-a334e5370e30',
     'How do secondary progressions differ from transits?',
     '["Progressions describe inner psychological development; transits describe external events and timing","Progressions are faster; transits are slower","Progressions use the outer planets; transits use the inner planets","They are the same technique with different names"]'::jsonb, 0,
     'Progressions reflect the evolution of the natal chart''s inner life and character over time. Transits reflect the external environment acting upon the natal chart.', 3);
  END IF;

  -- ===== Tarot Mastery =====

  -- The Fool''s Journey Overview (0283c037)
  IF NOT ('0283c037-b4c2-467e-af67-c407d5983674'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '0283c037-b4c2-467e-af67-c407d5983674',
     'The Fool''s Journey is a metaphor for:',
     '["The soul''s journey through experience toward integration","A literal travel story","A beginner''s lack of skill","The history of the tarot deck"]'::jsonb, 0,
     'The Fool''s Journey describes the soul moving from pure potential (The Fool, 0) through all the archetypal experiences of the Major Arcana toward wholeness (The World, XXI).', 1),
    (gen_random_uuid(), '0283c037-b4c2-467e-af67-c407d5983674',
     'Why is The Fool numbered 0 rather than 1?',
     '["It exists outside the cycle — pure potential, unnumbered by experience","It was added later as an afterthought","0 means lowest value","It is always placed last in the sequence"]'::jsonb, 0,
     'Zero represents pure potential and the unmanifest. The Fool stands outside the numbered sequence — at the beginning, end, and everywhere between.', 2),
    (gen_random_uuid(), '0283c037-b4c2-467e-af67-c407d5983674',
     'How many cards are in the Major Arcana?',
     '["22","21","78","56"]'::jsonb, 0,
     'The Major Arcana consists of 22 cards — The Fool (0) through The World (XXI).', 3);
  END IF;

  -- Cards 8–14: Strength through Temperance (b9f3edf5)
  IF NOT ('b9f3edf5-dd7c-452b-8ad4-f43e8ea22efe'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'b9f3edf5-dd7c-452b-8ad4-f43e8ea22efe',
     'Strength (VIII) is distinguished from force because:',
     '["It involves gentle mastery of instinct through love, not domination","It requires physical power","It is always victorious","It acts through fear"]'::jsonb, 0,
     'Strength holds the lion with an open hand — it is the mastery of instinct and fear through love and patience, not through suppression or force.', 1),
    (gen_random_uuid(), 'b9f3edf5-dd7c-452b-8ad4-f43e8ea22efe',
     'The Hermit (IX) is associated with which zodiac sign?',
     '["Virgo","Cancer","Scorpio","Pisces"]'::jsonb, 0,
     'The Hermit is associated with Virgo — the archetype of discernment, service, and the search for inner perfection.', 2),
    (gen_random_uuid(), 'b9f3edf5-dd7c-452b-8ad4-f43e8ea22efe',
     'The Wheel of Fortune (X) primarily teaches:',
     '["Understanding cycles releases you from being enslaved by them","Luck is random and uncontrollable","Fortune favours specific individuals","Resistance to change is wise"]'::jsonb, 0,
     'The Wheel teaches the law of cycles. Understanding that all things rise and fall — and why — allows the practitioner to work consciously with timing rather than being at the mercy of it.', 3);
  END IF;

  -- Cards 15–21: The Devil through The World (5a10bb7c)
  IF NOT ('5a10bb7c-830b-4d59-958d-0d77fcb74170'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '5a10bb7c-830b-4d59-958d-0d77fcb74170',
     'The Devil (XV) most commonly represents:',
     '["Shadow, attachment, and chains we believe are unbreakable","Literal evil or spiritual attack","Financial ruin","An abusive relationship"]'::jsonb, 0,
     'The Devil represents the shadow — the parts of ourselves we have exiled, the addictions we sustain, and the belief that we cannot break free from what binds us.', 1),
    (gen_random_uuid(), '5a10bb7c-830b-4d59-958d-0d77fcb74170',
     'After the upheaval of The Tower, which card follows and signals restored hope?',
     '["The Star","The Moon","Judgement","The Sun"]'::jsonb, 0,
     'The Star (XVII) follows The Tower — after the crash of false structures, The Star brings raw, honest hope and renewed connection to the self.', 2),
    (gen_random_uuid(), '5a10bb7c-830b-4d59-958d-0d77fcb74170',
     'Judgement (XX) is best understood as:',
     '["A call to awakening and response to a higher purpose","Criticism and condemnation","Legal or moral judgement by others","The end of a legal dispute"]'::jsonb, 0,
     'Judgement is the archetypal call to rise — to hear the summons of one''s higher purpose and respond with full presence. It is resurrection, not condemnation.', 3);
  END IF;

  -- The Four Suits and Their Elements (92107c41)
  IF NOT ('92107c41-4df0-48fc-b704-b3957f0e84e0'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '92107c41-4df0-48fc-b704-b3957f0e84e0',
     'Which suit corresponds to the element of Fire?',
     '["Wands","Cups","Swords","Pentacles"]'::jsonb, 0,
     'Wands correspond to Fire — passion, creativity, will, ambition, and the spark of inspired action.', 1),
    (gen_random_uuid(), '92107c41-4df0-48fc-b704-b3957f0e84e0',
     'Cups are associated with which element and domain?',
     '["Water — emotion, relationships, and the inner life","Air — intellect and communication","Earth — material security","Fire — action and ambition"]'::jsonb, 0,
     'Cups correspond to Water — the emotional realm, relationships, intuition, dreams, and the interior life.', 2),
    (gen_random_uuid(), '92107c41-4df0-48fc-b704-b3957f0e84e0',
     'Pentacles represent which element and practical domain?',
     '["Earth — material reality, finances, body, and work","Fire — career ambition","Air — financial planning","Water — investments and security"]'::jsonb, 0,
     'Pentacles (also called Coins or Discs) correspond to Earth — the physical world, money, work, health, and tangible resources.', 3);
  END IF;

  -- Wands and Pentacles (254baf9c)
  IF NOT ('254baf9c-56ec-4fc1-8d0b-6c3fe25b044e'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '254baf9c-56ec-4fc1-8d0b-6c3fe25b044e',
     'The Ace of Wands represents:',
     '["A new spark of creative energy, inspired action, or a new project","Financial opportunity","A new relationship","Intellectual breakthrough"]'::jsonb, 0,
     'Aces are pure potential of their element. The Ace of Wands is the seed of Fire — a new creative impulse, entrepreneurial spark, or inspired beginning.', 1),
    (gen_random_uuid(), '254baf9c-56ec-4fc1-8d0b-6c3fe25b044e',
     'The Ten of Pentacles typically shows:',
     '["Legacy, long-term security, and multi-generational abundance","Financial loss after achievement","The end of a career","Retirement and withdrawal"]'::jsonb, 0,
     'The Ten of Pentacles represents the fullest expression of Earth''s abundance — established legacy, family wealth, and lasting material security passed across generations.', 2),
    (gen_random_uuid(), '254baf9c-56ec-4fc1-8d0b-6c3fe25b044e',
     'The Five of Wands is best read as:',
     '["Conflict, competition, or chaotic energy that can be productive","Failure and defeat","Unwanted change in career","Loss of creative direction"]'::jsonb, 0,
     'The Five of Wands shows five figures with wands in apparent conflict — but this energy can represent healthy competition, lively debate, or creative tension seeking resolution.', 3);
  END IF;

  -- Cups and Swords (d173f50f)
  IF NOT ('d173f50f-9411-4b62-9239-c47d27c04fe4'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'd173f50f-9411-4b62-9239-c47d27c04fe4',
     'The Three of Cups most commonly represents:',
     '["Celebration, friendship, and community","A love triangle","Emotional confusion","Creative partnership"]'::jsonb, 0,
     'The Three of Cups shows three figures raising their cups in celebration — it speaks to joyful community, friendship, and the pleasure of shared abundance.', 1),
    (gen_random_uuid(), 'd173f50f-9411-4b62-9239-c47d27c04fe4',
     'The Ace of Swords represents:',
     '["Mental clarity, truth, and the breakthrough of a new idea","Conflict and aggression","A legal victory","Communication problems"]'::jsonb, 0,
     'The Ace of Swords is the purest expression of Air — a flash of clear thinking, piercing truth, or the birth of a powerful new idea.', 2),
    (gen_random_uuid(), 'd173f50f-9411-4b62-9239-c47d27c04fe4',
     'The Ten of Swords notoriously shows a figure face down with ten swords in their back. This card most accurately represents:',
     '["A painful ending that is complete — the worst is over","Imminent physical danger","Betrayal that is ongoing","A choice to leave a situation"]'::jsonb, 0,
     'Despite its dramatic imagery, the Ten of Swords signals the rock-bottom ending of a cycle. The crisis is complete — there is nowhere lower to go. From here, the only direction is up.', 3);
  END IF;

  -- Court Cards (f76d9dbb)
  IF NOT ('f76d9dbb-bee8-4cf2-8159-d33ffcabf27d'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'f76d9dbb-bee8-4cf2-8159-d33ffcabf27d',
     'Court cards can represent:',
     '["A person in the querent''s life, an aspect of the querent, or an approaching situation","Only the querent themselves","Only other people","Only past influences"]'::jsonb, 0,
     'Court cards are the most versatile and context-dependent cards in the deck — they can represent people, aspects of the querent''s personality, or situational energies.', 1),
    (gen_random_uuid(), 'f76d9dbb-bee8-4cf2-8159-d33ffcabf27d',
     'Which court card rank is associated with the most mature, integrated expression of a suit''s energy?',
     '["Queen or King (both represent mastery)","Page","Knight","Ace"]'::jsonb, 0,
     'Queens and Kings represent the mature, integrated expressions of their element — Queens through inner mastery, Kings through outer authority and direction.', 2),
    (gen_random_uuid(), 'f76d9dbb-bee8-4cf2-8159-d33ffcabf27d',
     'The Knight of Cups is best characterised as:',
     '["The romantic idealist — moving toward emotional dreams with passion","The aggressive warrior seeking conflict","The slow, methodical builder","The messenger of practical news"]'::jsonb, 0,
     'The Knight of Cups is the romantic, emotionally-driven idealist — charging forward in pursuit of their heart''s vision with intense but sometimes impractical passion.', 3);
  END IF;

  -- Single Card and Three Card Spreads (4203fc32)
  IF NOT ('4203fc32-3f59-4f8d-ab3b-fef1e20c25a1'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '4203fc32-3f59-4f8d-ab3b-fef1e20c25a1',
     'The primary advantage of a single-card daily practice is:',
     '["It deepens your relationship with each card through lived, contextual experience","It covers more ground than a three-card spread","It is the most accurate form of divination","It eliminates interpretation ambiguity"]'::jsonb, 0,
     'Pulling one card daily and watching how its theme manifests builds an embodied, personal understanding of the card''s energy that no book can fully convey.', 1),
    (gen_random_uuid(), '4203fc32-3f59-4f8d-ab3b-fef1e20c25a1',
     'When using the Past/Present/Future three-card spread, "Future" most accurately means:',
     '["The probable trajectory if current patterns continue","A fixed, unchangeable destiny","What will definitely happen","The client''s hopes and fears"]'::jsonb, 0,
     'The future position in any spread represents a trajectory, not a fixed outcome. The client''s choices and awareness can alter the course — this framing is essential to communicate.', 2),
    (gen_random_uuid(), '4203fc32-3f59-4f8d-ab3b-fef1e20c25a1',
     'What is the most important technique when interpreting a three-card spread?',
     '["Identifying the connecting thread and relationship between all three cards","Interpreting each card independently","Starting with the middle card","Only reading the dominant element"]'::jsonb, 0,
     'A three-card spread is a narrative, not three separate readings. The relationship and tension between the cards is often where the most meaningful insight lives.', 3);
  END IF;

  -- Creating Custom Spreads (60de131b)
  IF NOT ('60de131b-f478-47ad-9b2d-5836bb8c3c1d'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '60de131b-f478-47ad-9b2d-5836bb8c3c1d',
     'Why should you define the positional meaning of a custom spread BEFORE laying the cards?',
     '["To prevent unconscious post-hoc rationalisation of what each position means","To make the spread more complicated","Because it is required by tarot tradition","To determine how many cards to use"]'::jsonb, 0,
     'Defining positions before drawing prevents you from unconsciously assigning meanings that fit the card you drew rather than the question you are actually asking.', 1),
    (gen_random_uuid(), '60de131b-f478-47ad-9b2d-5836bb8c3c1d',
     'A custom spread is most appropriate when:',
     '["A question has distinct, named components that a standard spread cannot cleanly address","The reader is bored with standard spreads","The client requests something unique","A single card would be too simple"]'::jsonb, 0,
     'Custom spreads serve questions with a specific shape. When a standard spread keeps producing muddled results for a particular type of question, a targeted custom spread will yield cleaner insights.', 2),
    (gen_random_uuid(), '60de131b-f478-47ad-9b2d-5836bb8c3c1d',
     'The recommended first step in custom spread design is:',
     '["Name the question precisely","Choose the card layout shape","Decide how many cards to use","Select a theme for the spread"]'::jsonb, 0,
     'Precision in the question is the foundation of a useful spread. Vague questions produce vague spreads, no matter how elegant the layout.', 3);
  END IF;

  -- ===== Advanced Divination =====

  -- Solar Returns (e906adc3)
  IF NOT ('e906adc3-512f-41c9-b6fe-904dbcb257ea'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'e906adc3-512f-41c9-b6fe-904dbcb257ea',
     'A solar return chart is calculated for:',
     '["The exact moment the transiting Sun returns to its natal position, which occurs near the birthday each year","The moment of the full moon closest to the birthday","The first day of the new year","The start of the client''s Sun sign season"]'::jsonb, 0,
     'A solar return occurs when the transiting Sun reaches the exact same zodiacal degree and minute as the natal Sun — this happens within a day or two of the birthday every year.', 1),
    (gen_random_uuid(), 'e906adc3-512f-41c9-b6fe-904dbcb257ea',
     'The solar return Ascendant indicates:',
     '["The major theme, approach, or energy of the coming year","The client''s most prominent relationship of the year","Career changes in the year ahead","Health challenges to watch for"]'::jsonb, 0,
     'The solar return Ascendant describes the dominant lens through which the year''s experiences will be filtered and the primary energy the client is stepping into.', 2),
    (gen_random_uuid(), 'e906adc3-512f-41c9-b6fe-904dbcb257ea',
     'A solar return chart is most usefully interpreted:',
     '["In dialogue with the natal chart and current transits — not in isolation","As a standalone predictive chart","Using only the outer planets","As identical to the natal chart with updated Ascendant"]'::jsonb, 0,
     'The solar return is meaningful in context — it shows the year''s themes, but those themes operate within the longer arc of natal patterns and current transits.', 3);
  END IF;

  -- Lunar Returns and Eclipses (7065bfa7)
  IF NOT ('7065bfa7-362c-4bb3-9703-5930ff902661'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '7065bfa7-362c-4bb3-9703-5930ff902661',
     'How often does a lunar return occur?',
     '["Approximately once a month — every 27–28 days","Once a year","Every 6 months","Every new moon"]'::jsonb, 0,
     'The Moon completes its orbit in approximately 27.3 days. A lunar return occurs when the Moon returns to its natal degree — roughly monthly.', 1),
    (gen_random_uuid(), '7065bfa7-362c-4bb3-9703-5930ff902661',
     'What makes a solar eclipse more potent than a regular new moon?',
     '["The Moon occludes the Sun, aligning solar, lunar, and nodal energies — triggering karmic new beginnings","Eclipses are physically brighter","They occur on exact degree of the Ascendant","They always involve an outer planet"]'::jsonb, 0,
     'A solar eclipse is a new moon that occurs near the lunar nodes, amplifying the new moon''s seed energy with karmic, fated undertones and longer-lasting activation.', 2),
    (gen_random_uuid(), '7065bfa7-362c-4bb3-9703-5930ff902661',
     'An eclipse that hits a client''s natal planet within 2° is significant because:',
     '["It activates that planet''s natal themes with unusual intensity for up to 6 months","Eclipses only affect the Sun and Moon","It always indicates a major trauma","It cancels out the natal planet''s usual influence"]'::jsonb, 0,
     'When an eclipse falls closely conjunct, opposite, or square a natal planet, it tends to trigger that planet''s domain of life with unusual force — often setting off events or realisations that unfold over the following 6 months.', 3);
  END IF;

  -- Profections and Firdaria (f61885bf)
  IF NOT ('f61885bf-25cc-4b89-acb9-ed1402acb474'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), 'f61885bf-25cc-4b89-acb9-ed1402acb474',
     'In annual profections, each year of life activates:',
     '["One house of the natal chart in sequence, cycling through all 12 houses every 12 years","A new planet each year","A different zodiac sign each year","A progressed chart position"]'::jsonb, 0,
     'Profections advance one house per year of life. Age 0 = 1st house; Age 1 = 2nd house, and so on. Age 12 returns to the 1st house for the second cycle.', 1),
    (gen_random_uuid(), 'f61885bf-25cc-4b89-acb9-ed1402acb474',
     'The "Lord of the Year" in profections is:',
     '["The planet that rules the sign on the activated house cusp","The planet the Sun conjuncts in that year","The chart ruler","Saturn, which always governs time"]'::jsonb, 0,
     'The Lord of the Year is the ruling planet of the profected house''s sign. This planet becomes particularly significant — both its natal condition and its transits throughout the year are heightened.', 2),
    (gen_random_uuid(), 'f61885bf-25cc-4b89-acb9-ed1402acb474',
     'Firdaria is a timing system originating from:',
     '["Medieval Perso-Arabic astrology","Classical Greek astrology","Modern psychological astrology","Vedic/Jyotish astrology"]'::jsonb, 0,
     'Firdaria is a Medieval Arabic predictive technique that divides a life into planetary periods and sub-periods based on Chaldean order, adapted for day and night charts.', 3);
  END IF;

  -- Developing Your Intuition (1b145b79)
  IF NOT ('1b145b79-cb96-4574-95b5-6763c5353fef'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '1b145b79-cb96-4574-95b5-6763c5353fef',
     'What distinguishes genuine intuition from wishful thinking in a reading context?',
     '["Intuition tends to be immediate, specific, and not derived from conscious reasoning; wishful thinking is emotionally motivated","Intuition is always positive; wishful thinking is negative","Intuition involves cards; wishful thinking does not","They are the same thing"]'::jsonb, 0,
     'Intuitive impressions tend to arrive quickly and specifically, often surprising the reader. Wishful thinking is characterised by emotional investment in a particular outcome.', 1),
    (gen_random_uuid(), '1b145b79-cb96-4574-95b5-6763c5353fef',
     'A reliable method for developing intuitive reading skill is:',
     '["Blind practice — draw a card, write your impressions before looking at its traditional meaning, then compare","Only studying card meanings from books","Relying entirely on a single teacher''s interpretations","Avoiding reversed cards to reduce complexity"]'::jsonb, 0,
     'Blind practice trains your innate pattern recognition and symbolic language without immediately collapsing into learned meanings, gradually building your personal vocabulary.', 2),
    (gen_random_uuid(), '1b145b79-cb96-4574-95b5-6763c5353fef',
     'Why is grounding important for an intuitive reader before a session?',
     '["It prevents you from picking up and projecting your own unresolved material onto the client","It makes the cards more accurate","It increases the number of cards you can read","It is a spiritual requirement with no practical basis"]'::jsonb, 0,
     'Grounding practices create a clear, neutral inner state. An ungrounded reader is more likely to project their own emotional material onto the client''s reading.', 3);
  END IF;

  -- Combining Astrology and Tarot (1db253b7)
  IF NOT ('1db253b7-f8ea-4fb1-a837-6a0a1918b571'::uuid = ANY(_existing_lesson_ids)) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), '1db253b7-f8ea-4fb1-a837-6a0a1918b571',
     'When combining astrology and tarot in a session, the most effective approach is:',
     '["Use the birth chart to establish the overarching context; use tarot to illuminate immediate questions and choices","Use tarot first and ignore the chart","Use astrology for predictions and tarot for spiritual advice","Only combine them if the client requests both"]'::jsonb, 0,
     'The birth chart provides the long arc of the soul''s journey and current themes via transits. Tarot zooms in with immediate, symbolic insight about choices and energy in the moment.', 1),
    (gen_random_uuid(), '1db253b7-f8ea-4fb1-a837-6a0a1918b571',
     'Which astrological feature directly maps to the tarot''s four suits?',
     '["The four elements (Fire, Earth, Air, Water)","The four angles of the chart","The four modalities","The four outer planets"]'::jsonb, 0,
     'Wands = Fire, Pentacles = Earth, Swords = Air, Cups = Water — the four suit elements are the same four elements used in astrological sign classification.', 2),
    (gen_random_uuid(), '1db253b7-f8ea-4fb1-a837-6a0a1918b571',
     'A client is experiencing a Pluto transit opposing their natal Venus. Pulling the Tower in a tarot reading about their relationship is:',
     '["Highly congruent — both indicate a structural disruption in love and values that leads to transformation","A contradiction — Pluto and the Tower have nothing in common","Coincidental and should be set aside","A sign to stop the reading"]'::jsonb, 0,
     'Pluto opposing Venus and The Tower both speak to the dismantling of what has been built in love and values — when astrology and tarot align like this, the message is especially clear.', 3);
  END IF;

END $$;


-- =========================================================
-- PART 6: Ethics and Boundaries lesson quiz (already has quiz via existing seed)
-- Verify: 'Ethics and Boundaries' lesson has quiz from existing seed
-- lesson id will vary — skip if already covered
-- =========================================================

-- =========================================================
-- PART 7: Ensure Tarot Mastery duplicate program note
-- "Tarot Mastery" (de3ce0e6) and "Tarot Mastery Track" (1d7b5f74) both exist.
-- They appear intentional (one public self-study, one structured track).
-- Ensure "Tarot Mastery Track" also gets quiz for its lessons if missing.
-- (Already handled above in PART 5 for 12b04e49 and 63d3f1e9)
-- =========================================================

-- =========================================================
-- PART 8: Verify Ethics and Boundaries lesson has quiz
-- (c77557bf is the lesson that already had quiz per audit — keep as-is)
-- =========================================================
