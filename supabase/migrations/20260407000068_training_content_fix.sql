-- =============================================================================
-- Migration: 20260407000062_training_content_sequential_categories.sql
-- Purpose:   Complete the training re-seed — items that did not apply in 000061
--            because the first push errored before the content UPDATEs ran.
--            Specifically:
--            1. is_sequential on 3 programs + their categories
--            2. Content + video_url + pdf_url for 11 lessons
--            3. Lessons for 2 empty categories
--            4. Additional lessons for thin categories (Platform & Tools, Social Advocacy)
-- =============================================================================

-- =========================================================
-- PART 1: Set is_sequential appropriately on programs
-- =========================================================

UPDATE training_programs SET is_sequential = true
WHERE id = 'ade198dd-f73b-4d68-932e-274ff2b02ea5';

UPDATE training_programs SET is_sequential = true
WHERE id = 'ac9be8e4-301a-4595-aab0-7a608108f4dc';

UPDATE training_programs SET is_sequential = true
WHERE id = '1d7b5f74-a332-412b-9f54-7ccea16c02eb';

UPDATE training_categories SET is_sequential = true
WHERE training_id = 'ade198dd-f73b-4d68-932e-274ff2b02ea5';

UPDATE training_categories SET is_sequential = true
WHERE training_id = 'ac9be8e4-301a-4595-aab0-7a608108f4dc';

UPDATE training_categories SET is_sequential = true
WHERE training_id = '1d7b5f74-a332-412b-9f54-7ccea16c02eb';


-- =========================================================
-- PART 2: Lesson content for the 11 lessons with NULL content
-- =========================================================

UPDATE training_lessons SET
  content = $c$## The 12 Zodiac Signs

The zodiac is a belt of sky divided into 12 equal sections of 30 degrees each. Every sign has a distinct elemental nature, modality, and ruling planet that colour how its energy expresses.

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

**Practice**: Write one sentence describing the core energy of each element-modality combination before the next lesson.$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/12-zodiac-signs.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/12-zodiac-signs.pdf',
  updated_at = now()
WHERE id = '451669f3-6c8f-4d97-872c-572716d64221';

UPDATE training_lessons SET
  content = $c$## The 10 Planets

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

Planets in a chart show *what* energies are at play. The sign they occupy shows *how* that energy expresses. The house shows *where* in life it operates.$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/10-planets.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/10-planets.pdf',
  updated_at = now()
WHERE id = '92b17b97-1007-4bbb-89da-43fe4a1d8bc0';

UPDATE training_lessons SET
  content = $c$## The 12 Houses

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

A planet in a house colours how that house''s themes play out in the client''s life.$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/12-houses.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/astro-fundamentals/12-houses.pdf',
  updated_at = now()
WHERE id = 'c2572092-0198-4138-ab1f-0680c2d79891';

UPDATE training_lessons SET
  content = $c$## Booking & Intake Process

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
- Emotional vulnerability signals — prepare grounding language and referral resources.$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/client-comm/booking-intake.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/client-comm/booking-intake.pdf',
  updated_at = now()
WHERE id = 'f31d4a48-5dce-431b-a221-5c497f55128c';

UPDATE training_lessons SET
  content = $c$## Delivering Difficult Readings

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
Vicarious processing is real. Build a 10-minute transition ritual after heavy sessions.$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/client-comm/difficult-readings.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/client-comm/difficult-readings.pdf',
  updated_at = now()
WHERE id = 'e21f1580-2430-4f6e-aa6e-623b66fe44f8';

UPDATE training_lessons SET
  content = $c$## Setting Up Your Diviner Profile

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
Submit your profile for admin review. Approval typically takes 1–2 business days. You will receive a confirmation email once you are live.$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/profile-setup.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/profile-setup.pdf',
  updated_at = now()
WHERE id = '9f065038-b881-4b2c-8fbc-588e226b8385';

UPDATE training_lessons SET
  content = $c$## Week 1 — The Call to the Mysteries

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
- Keep a dedicated journal for this program.$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/mystery-school/foundation/week-01-call-to-mysteries.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/mystery-school/foundation/week-01-workbook.pdf',
  updated_at = now()
WHERE id = '56c29054-3ce9-41aa-a379-da307826c9f2';

UPDATE training_lessons SET
  content = $c$## Week 2 — Sacred Geometry Primer

Sacred geometry is the study of the mathematical patterns that underlie all physical form. Every tradition — Greek, Egyptian, Islamic, Hindu, and indigenous — encodes cosmological truth in geometric language.

**The Core Principles**
- **The Point**: pure potential, the unmanifest source. Before form, there is point.
- **The Line**: division, duality, the first movement from unity.
- **The Circle**: wholeness, eternity, the divine container. No beginning, no end.
- **The Triangle**: the number three — spirit manifesting in matter through a third force.
- **The Square**: the four elements, cardinal directions, material reality.
- **The Pentagon / Phi Spiral**: life, growth, and the golden ratio (1.618) that appears in shells, galaxies, and the human body.

**The Flower of Life**
This pattern of overlapping circles contains within it the Fruit of Life, the Tree of Life, the Platonic Solids, and Metatron''s Cube. It is considered a master template of creation.

**This Week''s Practice**
Draw a Vesica Piscis (two overlapping circles of equal radius, each passing through the other''s centre) by hand. Sit with it for five minutes and write: what does this shape evoke in you?

Sacred geometry is not superstition — it is applied mathematics in service of spiritual cognition.$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/mystery-school/foundation/week-02-sacred-geometry.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/mystery-school/foundation/week-02-workbook.pdf',
  updated_at = now()
WHERE id = '45cddaac-b290-4f82-b549-1d3cd6ed3721';

UPDATE training_lessons SET
  content = $c$## The Fool to The Chariot (Cards 0–VII)

The first eight cards of the Major Arcana trace the journey from pure potential to the first mastery of will.

**0 — The Fool**: Pure potential, new beginnings, the leap of faith before experience. Element: Air. No number — outside the cycle, or encompassing it.

**I — The Magician**: Willpower applied to the material world. Has all four suit tools on the table — wands, cups, swords, pentacles. Element: Air / Mercury.

**II — The High Priestess**: Hidden knowledge, intuition, the unconscious. She holds what the Magician cannot yet access. Element: Water / Moon.

**III — The Empress**: Abundance, fertility, creative embodiment, the natural world. Element: Earth / Venus.

**IV — The Emperor**: Structure, authority, paternal order, civilisation. Element: Fire / Aries.

**V — The Hierophant**: Tradition, institution, spiritual transmission through lineage. Element: Earth / Taurus.

**VI — The Lovers**: Choice, values alignment, union. Not merely romance — the deeper decision of who you are in relationship. Element: Air / Gemini.

**VII — The Chariot**: Mastery of opposing forces through focused will. Victory through discipline, not domination. Element: Water / Cancer.

**Pattern to Notice**: The journey moves from pure spirit (Fool) through the structures of mind (Magician, Hierophant) into the first integration of self-mastery (Chariot).$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/major-arcana/cards-0-7.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/major-arcana/cards-0-7-reference.pdf',
  updated_at = now()
WHERE id = '12b04e49-4e65-4c71-ac90-3c0f70942535';

UPDATE training_lessons SET
  content = $c$## Strength to The World (Cards VIII–XXI)

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

**XXI — The World**: Completion of a cycle, wholeness, integration. The Fool has become the World. Element: Earth / Saturn.$c$,
  video_url = 'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/major-arcana/cards-8-21.mp4',
  pdf_url   = 'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/major-arcana/cards-8-21-reference.pdf',
  updated_at = now()
WHERE id = '63d3f1e9-c27e-4df5-9572-33beb4544747';

UPDATE training_lessons SET
  content = $c$## Your Referral Link & Commission Dashboard

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
- Add a personal note when sharing: why you use and trust the platform.$c$,
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
   'The Seven Hermetic Principles from the Kybalion and their practical application.',
   $c$## Week 5 — The Hermetic Principles

The Kybalion, published in 1908 by "Three Initiates," codifies seven principles attributed to Hermes Trismegistus. These principles appear in virtually every esoteric tradition under different names.

**The Seven Principles**

1. **Mentalism** — "The All is Mind; the Universe is mental." Everything that exists is a manifestation of mind at its most fundamental level.

2. **Correspondence** — "As above, so below; as below, so above." The macrocosm and the microcosm mirror each other. Your birth chart is a correspondence map.

3. **Vibration** — "Nothing rests; everything moves; everything vibrates." Solid matter is dense vibration; thought is faster vibration.

4. **Polarity** — "Everything is dual; everything has poles." Hot and cold are degrees of the same thing. Understanding polarity allows transmutation.

5. **Rhythm** — "Everything flows, out and in; everything has its tides." Recognising the rhythm allows you to not be enslaved by it.

6. **Cause and Effect** — "Every cause has its effect; every effect has its cause." Nothing happens by chance — chance is a name for unknown law.

7. **Gender** — "Gender is in everything; everything has its masculine and feminine principles." Generative principle and receptive principle present in all creation.

**This Week''s Practice**: Choose one principle. For 7 days, observe only that principle in your daily life and record one example each evening.$c$,
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-05-hermetic-principles.mp4',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-05-workbook.pdf',
   50, 1, true),

  (gen_random_uuid(), 'b889a866-e331-47cb-b804-6e0ca6139909',
   'Week 6 — Astral Architecture and the Inner Planes',
   'The structure of the inner planes, subtle body awareness, and working consciously with non-physical reality.',
   $c$## Week 6 — Astral Architecture and the Inner Planes

Every esoteric tradition posits that visible, physical reality is only one level of a multilayered cosmos. The inner planes are the non-physical dimensions of existence that interpenetrate and influence the material world.

**The Planes of Existence (simplified map)**

| Plane | Also called | Nature |
|-------|-------------|--------|
| Physical | Material | The world of solid, liquid, gas, and plasma |
| Etheric | Vital body | The life-force matrix just behind the physical |
| Astral | Emotional plane | The world of feelings, desire, and dream |
| Mental | Causal | The world of thought and archetype |
| Spiritual | Buddhic | Unity consciousness, the soul level |

**Practical Relevance for Diviners**
When you perform a reading, you are accessing information from the astral and mental planes — patterns of energy that have not yet fully crystallised into physical events. This is why intuitive readings can identify trends but cannot predict exact outcomes with certainty: the material plane has its own inertia.

**The Subtle Body**
Your subtle body is your non-physical vehicle of perception. Keeping your energy field clear and grounded is professional hygiene for any practitioner.

**This Week''s Practice**: Each night before sleep, do a 5-minute body scan from feet to crown, noting any areas of tension or density.$c$,
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-06-astral-architecture.mp4',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-06-workbook.pdf',
   55, 2, true),

  (gen_random_uuid(), 'b889a866-e331-47cb-b804-6e0ca6139909',
   'Week 7 — Shadow Work Foundations',
   'Jungian shadow, the role of projection, and structured practices for integrating unconscious material.',
   $c$## Week 7 — Shadow Work Foundations

Carl Jung identified the Shadow as the unconscious repository of everything we have judged, rejected, or suppressed about ourselves. Mystery school traditions have always known it by other names — the dweller on the threshold, the guardian of the gate — but the work is the same: you cannot pass into deeper initiation without first meeting what you have hidden from yourself.

**Why Shadow Work Is Mandatory for Practitioners**
An unexamined reader projects their own material onto clients. If death terrifies you, you will unconsciously avoid 8th house themes. Shadow work is not optional — it is professional responsibility.

**The Mechanics of Projection**
What we refuse to own in ourselves, we attribute to others. The person who most triggers your anger is often showing you something about yourself you have not acknowledged. This is information, not blame.

**A Structured Practice: The Projection Inventory**
1. Think of someone who irritates, repels, or infuriates you.
2. Write 5 specific qualities that bother you about them.
3. For each quality, ask: *"Where and how do I also do this?"*
4. The resistance you feel is the shadow.

This practice is not comfortable. It is profoundly liberating.$c$,
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-07-shadow-work.mp4',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-07-workbook.pdf',
   60, 3, true),

  (gen_random_uuid(), 'b889a866-e331-47cb-b804-6e0ca6139909',
   'Week 8 — Ritual Design and Sacred Space',
   'The components of effective ritual, designing your own ceremony, and the ethics of ritual practice.',
   $c$## Week 8 — Ritual Design and Sacred Space

Ritual is the technology of intention. It uses symbol, timing, physical action, and focused attention to communicate with the deeper layers of the psyche and — depending on your cosmology — with non-physical intelligences.

**Why Ritual Works**
Ritual engages the unconscious mind through symbol, repetition, and embodied action in a way that purely verbal intention-setting does not. You are not just thinking about a change — you are enacting it.

**The Five Components of Effective Ritual**
1. **Purification** — clearing the space and yourself. Smoke, salt water, sound, breathwork.
2. **Casting the container** — defining the sacred space.
3. **The central act** — what you are doing and why. Writing, burning, planting, speaking.
4. **Releasing** — letting go of the outcome. Attachment collapses the ritual.
5. **Closing** — grounding back into ordinary reality. Eat something. Thank the space.

**Ethics of Ritual**
- Never perform ritual on behalf of another person without explicit, informed consent.
- Rituals for others'' "highest good" still require their awareness and agreement.

**Capstone Assignment**: Design a personal ritual for any intention of your choosing. Write it out in full using the five-component framework. You will perform it before Week 9.$c$,
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-08-ritual-design.mp4',
   'https://cdn.divineinfinitebeing.com/training/mystery-school/intermediate/week-08-workbook.pdf',
   65, 4, true)
ON CONFLICT (id) DO NOTHING;


-- "Spread Design & Readings" (1b6d4008) — Tarot Mastery Track
INSERT INTO training_lessons (id, category_id, title, description, content, video_url, pdf_url, duration_mins, priority, is_active)
VALUES
  (gen_random_uuid(), '1b6d4008-9300-492f-a470-63127168d62f',
   'The Three-Card Spread in Depth',
   'Master the workhorse spread: past-present-future, mind-body-spirit, and how to customise it.',
   $c$## The Three-Card Spread in Depth

The three-card spread is not a beginner''s spread — it is the most versatile structure in the reader''s toolkit. Its power lies in its flexibility: any three-position framework can be layered onto it.

**Classic Interpretations**
- **Past / Present / Future**: Where did this come from? Where is it now? Where is it heading?
- **Situation / Action / Outcome**: What is the situation? What action is available? What outcome does that action lead to?
- **Mind / Body / Spirit**: Intellectual dimension, physical dimension, spiritual dimension.
- **What to embrace / What to release / What to cultivate**: A growth-focused frame.

**Reading Technique: The Connecting Thread**
After interpreting each card individually, always identify the *relationship* between the three. Do the cards form a coherent narrative? Do they contradict each other? Contradiction is information — it signals internal conflict or competing forces.

**Timing the Three-Card Spread**
When using Past/Present/Future, be clear with the client that *future* means the trajectory *if current patterns continue*, not a fixed outcome.

**Practice Assignment**
Pull three cards daily for one week using a different three-card framework each day. Record your interpretations.$c$,
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/three-card-spread.mp4',
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/three-card-spread.pdf',
   40, 1, true),

  (gen_random_uuid(), '1b6d4008-9300-492f-a470-63127168d62f',
   'The Celtic Cross: Structure and Common Misreadings',
   'The ten positions, their traditional meanings, and the three most common errors readers make.',
   $c$## The Celtic Cross: Structure and Common Misreadings

The Celtic Cross is the most recognised tarot spread in the Western tradition. Its ten positions provide a comprehensive snapshot of a situation.

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
3. **Ignoring reversals when they cluster** — multiple reversals indicate internal blockage that must be addressed.$c$,
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/celtic-cross.mp4',
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/celtic-cross-reference.pdf',
   55, 2, true),

  (gen_random_uuid(), '1b6d4008-9300-492f-a470-63127168d62f',
   'Designing Custom Spreads for Client Questions',
   'A framework for creating purpose-built spreads and knowing when a custom spread serves better than a standard one.',
   $c$## Designing Custom Spreads for Client Questions

Standard spreads are starting points, not constraints. When a client''s question has a specific shape, a custom spread built around that question will often yield a cleaner, more actionable reading.

**When to Use a Custom Spread**
- The question has distinct, named components (e.g. "Should I take Job A or Job B?" — two parallel columns)
- The client is working through a specific decision tree
- Standard spreads keep producing unclear results on this topic for this client

**The Design Framework**
1. **Name the question precisely** — vague questions produce vague spreads.
2. **Identify the key dimensions** — what aspects of the situation must be illuminated for the client to act?
3. **Assign one card per dimension** — each position should do exactly one job.
4. **Define the positional meaning before you lay the cards** — never decide what a position means after you see the card.
5. **Test it yourself** — pull cards for your own question using the new spread.

**Example: "Career Pivot" Spread (6 positions)**
1. Current path and its honest trajectory
2. What I am being called toward
3. The skill or resource I am underestimating
4. The fear blocking the move
5. A concrete first step available now
6. What this decision is really about at the soul level

Keep custom spread templates in your practitioner notebook.$c$,
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/custom-spreads.mp4',
   'https://cdn.divineinfinitebeing.com/training/tarot-mastery-track/spreads/custom-spreads-worksheet.pdf',
   45, 3, true)
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- PART 4: Additional lessons for thin categories
-- =========================================================

-- "Platform & Tools" (b6fc1dfd) currently has 1 lesson — add 2 more
INSERT INTO training_lessons (id, category_id, title, description, content, video_url, pdf_url, duration_mins, priority, is_active)
VALUES
  (gen_random_uuid(), 'b6fc1dfd-6bd2-435a-8ccf-d0d24e8714e6',
   'Managing Your Availability and Session Calendar',
   'How to configure your calendar, block times, set buffers, and handle rescheduling requests.',
   $c$## Managing Your Availability and Session Calendar

Your calendar is the engine of your practice. Clients book directly based on your displayed availability — if it is not accurate, you will experience no-shows, double-bookings, and frustrated clients.

**Connecting Your Calendar**
The platform integrates with Google Calendar and Apple Calendar via CalDAV. Go to **Settings → Calendar** and connect your preferred calendar. Conflicts in your connected calendar will automatically block availability in the platform.

**Setting Weekly Availability**
Use the availability grid to set your standard hours. Best practice: only set times you can reliably hold. It is better to have fewer slots with high consistency than many slots you frequently cancel.

**Buffer Times**
Always set a 10–15 minute buffer after each session. This protects you from back-to-back sessions when a reading runs long, and gives you time to write notes while the session is fresh.

**Handling Rescheduling**
Clients can reschedule up to 24 hours before a session. If a client requests a reschedule inside that window, use the platform''s "Exception" tool — do not communicate directly outside the platform as this can create disputes.

**Cancellation Policy**
Your cancellation policy is set in your Diviner profile. Platform minimum is 24-hour notice for a full refund. Sessions cancelled by you (the Diviner) within 2 hours of start time incur a performance flag on your account.$c$,
   'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/calendar-management.mp4',
   'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/calendar-management.pdf',
   20, 2, true),

  (gen_random_uuid(), 'b6fc1dfd-6bd2-435a-8ccf-d0d24e8714e6',
   'Video Session Technology and Troubleshooting',
   'How the video session room works, pre-session checklist, and what to do when technical issues arise mid-session.',
   $c$## Video Session Technology and Troubleshooting

The Divine Infinite Being platform uses a browser-based video room. No app installation is required for clients.

**Pre-Session Checklist (run 5 minutes before every session)**
- Wired or strong Wi-Fi connection (minimum 10 Mbps up/down)
- Camera and microphone tested (use the in-platform test room under Settings > Video)
- Background: clean, uncluttered, consistent with your brand
- Lighting: light source in front of you, not behind
- Phone on Do Not Disturb
- Intake form reviewed

**Starting the Room**
You (the Diviner) must start the session room — the client cannot enter until you open it. Open the room 2–3 minutes early to resolve any last-minute tech issues.

**Common Issues and Fixes**

| Issue | First Fix |
|-------|-----------|
| No audio from client | Ask them to check browser microphone permissions |
| Video freezing | Both parties: refresh the browser tab |
| Room will not load | Switch to incognito/private window |
| Persistent failure | Use the "Switch to Phone" fallback in the session room |

**Session Recording**
You may not record sessions without explicit, prior written consent from the client. The platform does not auto-record. If you wish to record, add a consent clause to your intake form.$c$,
   'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/video-tech-troubleshooting.mp4',
   'https://cdn.divineinfinitebeing.com/training/diviner-cert/platform-tools/video-tech-guide.pdf',
   25, 3, true)
ON CONFLICT (id) DO NOTHING;

-- "Getting Started as an Advocate" (357005b3) — add 2 more lessons
INSERT INTO training_lessons (id, category_id, title, description, content, video_url, pdf_url, duration_mins, priority, is_active)
VALUES
  (gen_random_uuid(), '357005b3-6e81-4c71-ae21-c31dc393dc33',
   'Content Strategy for Advocates',
   'How to create authentic content that converts referrals without feeling promotional.',
   $c$## Content Strategy for Advocates

The most effective advocates are not marketers — they are authentic voices who share genuine experiences. The platform''s highest-performing advocates share personal stories, not promotional copy.

**Content Types That Work**
1. **Experience posts**: "I just had a reading with [Diviner name] and here''s what came up for me…" — specific, personal, and credible.
2. **Educational content**: "I used to think astrology was about sun signs. Here''s what a full natal reading actually covers…" — positions you as knowledgeable, not just promotional.
3. **Before/after**: Share a challenge you were navigating, how you used a reading as a tool for clarity, and what shifted.
4. **Behind-the-scenes**: What is the booking experience like? What questions did you bring? Normalise the process for people who are curious but hesitant.

**What Not to Do**
- Do not make healing or transformation claims ("this reading will change your life").
- Do not spam your link — share it contextually, not as a standalone promotional post.
- Do not tag Diviners without their permission.

**Posting Frequency**
2–4 posts per month that include your referral link is more effective than daily posts that condition your audience to scroll past.$c$,
   'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/content-strategy.mp4',
   'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/content-strategy.pdf',
   20, 2, true),

  (gen_random_uuid(), '357005b3-6e81-4c71-ae21-c31dc393dc33',
   'Compliance, Ethics, and Platform Rules for Advocates',
   'FTC disclosure requirements, what you can and cannot claim, and how to stay within platform and legal guidelines.',
   $c$## Compliance, Ethics, and Platform Rules for Advocates

As an advocate earning commission, you have legal and ethical obligations. Violations can result in account suspension and, in some cases, legal exposure.

**FTC Disclosure (US Requirement)**
The US Federal Trade Commission requires that you disclose any material connection to a product or service you recommend. Being paid a commission is a material connection.

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
- You may not offer discounts or incentives not sanctioned by the platform.
- Violations receive a warning on first offence; repeated violations result in permanent removal.$c$,
   'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/compliance-ethics.mp4',
   'https://cdn.divineinfinitebeing.com/training/social-advocacy/getting-started/compliance-guide.pdf',
   25, 3, true)
ON CONFLICT (id) DO NOTHING;
