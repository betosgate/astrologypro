-- =============================================================================
-- Migration: 20260407000069_training_new_lesson_quiz.sql
-- Purpose:   Add quiz questions for the 11 new lessons added in 000062/000067/000068.
--            These lessons were newly created (no prior quiz possible).
--            Uses dynamic lookup by category_id + title to get the lesson ID,
--            so this is safe to re-run and works regardless of which UUID was kept.
-- =============================================================================

DO $$
DECLARE
  _lesson_id uuid;
BEGIN

  -- ===== Week 5 — The Hermetic Principles =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = 'b889a866-e331-47cb-b804-6e0ca6139909'
    AND title = 'Week 5 — The Hermetic Principles'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'The Hermetic Principle of Correspondence is summarised as:',
     '["As above, so below; as below, so above","Nothing rests; everything vibrates","Gender is in everything","Every cause has its effect"]'::jsonb,
     0, 'Correspondence holds that the macrocosm and microcosm mirror each other — the birth chart is a concrete application of this principle.', 1),
    (gen_random_uuid(), _lesson_id,
     'According to the Principle of Polarity, hot and cold are:',
     '["Different degrees of the same thing","Opposite and unrelated forces","Fixed states that cannot be changed","Products of the physical plane only"]'::jsonb,
     0, 'Polarity teaches that apparent opposites are the same phenomenon at different degrees — and that understanding this allows transmutation.', 2),
    (gen_random_uuid(), _lesson_id,
     'The Principle of Mentalism states:',
     '["The All is Mind; the Universe is mental","Gender is in everything","Everything has its rhythm","Cause and effect govern all things"]'::jsonb,
     0, 'Mentalism is the first and foundational principle — all manifest reality is an expression of Mind at its most fundamental level.', 3);
  END IF;

  -- ===== Week 6 — Astral Architecture =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = 'b889a866-e331-47cb-b804-6e0ca6139909'
    AND title = 'Week 6 — Astral Architecture and the Inner Planes'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'The astral plane is primarily associated with:',
     '["Feelings, desire, emotion, and dream","Physical matter","Thought and archetype","Unity consciousness"]'::jsonb,
     0, 'The astral (emotional) plane is the realm of feeling, desire, imagination, and the dream state.', 1),
    (gen_random_uuid(), _lesson_id,
     'Why can intuitive readings identify trends but not predict exact outcomes?',
     '["Astral plane patterns have not yet fully crystallised into physical events, and the material plane has its own inertia","Readers are not skilled enough","The cards are random","Birth charts are incomplete"]'::jsonb,
     0, 'Information accessed in a reading exists on the astral/mental planes — it reflects patterns that may or may not solidify depending on choices and circumstances in physical reality.', 2),
    (gen_random_uuid(), _lesson_id,
     'What does grounding the subtle body before a reading session achieve?',
     '["It creates a clear, neutral inner state and reduces projection of personal material onto the client","It improves the accuracy of card pulls","It connects you to spiritual guides","It is a legal requirement for certified readers"]'::jsonb,
     0, 'Grounding centres the practitioner, reducing the risk of confusing their own unresolved emotional material with the client''s field.', 3);
  END IF;

  -- ===== Week 7 — Shadow Work Foundations =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = 'b889a866-e331-47cb-b804-6e0ca6139909'
    AND title = 'Week 7 — Shadow Work Foundations'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'Jung''s concept of the Shadow refers to:',
     '["The unconscious repository of everything we have judged, rejected, or suppressed","Our public persona","The higher self","Our relationship with the anima/animus"]'::jsonb,
     0, 'The Shadow is the storehouse of everything the ego has deemed unacceptable — not only ''negative'' traits but also disowned gifts and potential.', 1),
    (gen_random_uuid(), _lesson_id,
     'Projection occurs when:',
     '["We attribute to others qualities we refuse to own in ourselves","We see others clearly and objectively","We empathise deeply with another person''s situation","We absorb another person''s emotional state"]'::jsonb,
     0, 'Projection is the unconscious attribution of one''s own shadow material to external figures — the trigger reveals the disowned quality.', 2),
    (gen_random_uuid(), _lesson_id,
     'Why is shadow work described as mandatory professional hygiene for diviners?',
     '["Unexamined personal material gets projected onto clients, distorting the reading","It improves card memorisation","It is required by the platform for certification","Clients prefer readers who have done inner work"]'::jsonb,
     0, 'An unexamined reader unconsciously filters the reading through their own wounds and attachments — clients receive their reader''s shadow, not clear insight.', 3);
  END IF;

  -- ===== Week 8 — Ritual Design =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = 'b889a866-e331-47cb-b804-6e0ca6139909'
    AND title = 'Week 8 — Ritual Design and Sacred Space'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'What is the fourth component of the five-component ritual framework?',
     '["Releasing — letting go of the outcome","Purification","The central act","Closing"]'::jsonb,
     0, 'The four components in order are: Purification, Casting the container, The central act, Releasing, Closing. Releasing (step 4) is the surrender of attachment to outcome.', 1),
    (gen_random_uuid(), _lesson_id,
     'Performing ritual on behalf of another person without their explicit consent is:',
     '["An ethical violation, regardless of intention","Acceptable if your intention is for their highest good","Standard practice in mystery school traditions","Only an issue in commercial contexts"]'::jsonb,
     0, 'Consent is mandatory — even rituals for "highest good" require the other person''s knowledge and agreement. Intent does not override consent.', 2),
    (gen_random_uuid(), _lesson_id,
     'From a psychological perspective, why does ritual work?',
     '["It engages the unconscious through symbol, repetition, and embodied action in a way verbal intention does not","It communicates with supernatural forces","The specific symbols used have intrinsic power","It is a form of self-hypnosis"]'::jsonb,
     0, 'Ritual bypasses the critical rational mind and speaks directly to the unconscious through symbol, movement, and repeated sensory cues — making intention visceral rather than merely cognitive.', 3);
  END IF;

  -- ===== The Three-Card Spread in Depth =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = '1b6d4008-9300-492f-a470-63127168d62f'
    AND title = 'The Three-Card Spread in Depth'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'In the three-card spread, what does "The Connecting Thread" technique involve?',
     '["Identifying the narrative relationship between all three cards after reading them individually","Reading each card entirely independently","Reading only the middle card","Choosing which card is most important and ignoring the others"]'::jsonb,
     0, 'The connecting thread is the through-line that binds all three cards into a coherent (or meaningfully contradictory) story — this is where the deepest insight often lives.', 1),
    (gen_random_uuid(), _lesson_id,
     'The "Situation / Action / Outcome" frame for a three-card spread is best used when:',
     '["The client needs to understand what is happening, what is available to do, and where that leads","The client wants a historical overview","The client is experiencing a health challenge","The client is asking about a past relationship"]'::jsonb,
     0, 'Situation/Action/Outcome is ideal for decision-focused readings where the client needs clarity on available paths and their consequences.', 2),
    (gen_random_uuid(), _lesson_id,
     'What is the recommended practice for developing fluency with three-card spreads?',
     '["Pull three cards daily for one week using a different framework each day","Memorise all possible three-card combinations","Only use one framework until it is mastered","Pull cards for others rather than for yourself"]'::jsonb,
     0, 'Daily practice with varied frameworks builds both card knowledge and interpretive flexibility — the practitioner discovers which frames feel most natural and why.', 3);
  END IF;

  -- ===== The Celtic Cross =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = '1b6d4008-9300-492f-a470-63127168d62f'
    AND title = 'The Celtic Cross: Structure and Common Misreadings'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'Position 9 in the Celtic Cross is called Hopes and Fears because:',
     '["What we hope for and what we fear are often the same thing, revealing deep internal truth","It always shows the positive outcome","It represents the future","It shows what the reader thinks will happen"]'::jsonb,
     0, 'Position 9 often shows the deepest tension — the querent''s greatest hope and greatest fear are frequently two faces of the same desire, making it the most revealing position.', 1),
    (gen_random_uuid(), _lesson_id,
     'How should the outcome card (position 10) be framed when presenting it to a client?',
     '["As a probable trajectory if current patterns continue, not a fixed destiny","As a guaranteed prediction","As the only possible outcome","As less important than the other cards"]'::jsonb,
     0, 'The outcome position reflects momentum and trajectory — the client''s choices and awareness can alter the course. Framing it as fixed destiny is both inaccurate and potentially harmful.', 2),
    (gen_random_uuid(), _lesson_id,
     'What does it indicate when multiple cards in a Celtic Cross reading are reversed?',
     '["Internal blockage or resistance that must be addressed before external change is possible","The deck needs to be shuffled again","The reading is invalid","The client is in physical danger"]'::jsonb,
     0, 'Clustered reversals in a spread signal that the primary obstacles are internal — resistance, denial, suppressed emotion, or blocked energy that the client needs to acknowledge.', 3);
  END IF;

  -- ===== Designing Custom Spreads =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = '1b6d4008-9300-492f-a470-63127168d62f'
    AND title = 'Designing Custom Spreads for Client Questions'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'Why must positional meanings be defined BEFORE laying the cards in a custom spread?',
     '["To prevent post-hoc rationalisation — assigning meanings that fit the card drawn rather than the question asked","Because tradition requires it","To make the spread more complicated","To determine how many cards are needed"]'::jsonb,
     0, 'Defining positions first anchors the reading to the intended question. Deciding meaning after seeing the card allows confirmation bias to override honest interpretation.', 1),
    (gen_random_uuid(), _lesson_id,
     'What is the recommended way to validate a new custom spread before using it with clients?',
     '["Test it by pulling cards for your own question and verifying it produces coherent readings","Ask another reader to approve it","Use it immediately with a willing client","Check it against a tarot reference book"]'::jsonb,
     0, 'Self-testing a new spread gives you direct feedback on whether each position does its intended job and whether the spread as a whole generates actionable clarity.', 2),
    (gen_random_uuid(), _lesson_id,
     'A custom spread is most likely to outperform a standard spread when:',
     '["The question has distinct named components with a specific shape that standard spreads cannot cleanly address","The reader is experienced","The client is familiar with tarot","The reading is for a major life decision"]'::jsonb,
     0, 'Custom spreads shine when the question has an inherent structure — multiple dimensions, a decision between specific named options, or a recurring pattern that standard spreads blur together.', 3);
  END IF;

  -- ===== Managing Your Availability and Session Calendar =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = 'b6fc1dfd-6bd2-435a-8ccf-d0d24e8714e6'
    AND title = 'Managing Your Availability and Session Calendar'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'What is the recommended buffer time to set between sessions?',
     '["10–15 minutes","30 minutes","5 minutes","None — back-to-back sessions are fine"]'::jsonb,
     0, 'A 10–15 minute buffer protects against overruns, allows note-taking while the session is fresh, and provides a mental reset before the next client.', 1),
    (gen_random_uuid(), _lesson_id,
     'If a client requests a reschedule inside the 24-hour window, what should you use?',
     '["The platform''s Exception tool — do not communicate directly outside the platform","Text the client directly","Email the client","Simply cancel and ask them to rebook"]'::jsonb,
     0, 'All scheduling changes must go through the platform to create a documented record and prevent disputes about confirmation.', 2),
    (gen_random_uuid(), _lesson_id,
     'Cancelling a session as the Diviner within 2 hours of the start time results in:',
     '["A performance flag on your account","An automatic refund only","Account suspension","Nothing — cancellations are always acceptable"]'::jsonb,
     0, 'Late Diviner cancellations directly harm the client experience and platform trust. Performance flags accumulate and can affect your standing and visibility.', 3);
  END IF;

  -- ===== Video Session Technology =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = 'b6fc1dfd-6bd2-435a-8ccf-d0d24e8714e6'
    AND title = 'Video Session Technology and Troubleshooting'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'Who must open the video session room before the client can enter?',
     '["The Diviner","The client","Either party","The platform automatically opens it"]'::jsonb,
     0, 'The Diviner must start the room. Clients cannot enter until the Diviner opens it — build in 2–3 minutes of early arrival to handle any last-minute tech issues.', 1),
    (gen_random_uuid(), _lesson_id,
     'If the video room freezes for both parties, the recommended first fix is:',
     '["Both parties refresh the browser tab","End the session and reschedule","Switch to a phone call immediately","Wait 5 minutes for it to recover on its own"]'::jsonb,
     0, 'A browser refresh resolves most temporary video glitches caused by network fluctuations or memory pressure. It is faster and less disruptive than escalating immediately.', 2),
    (gen_random_uuid(), _lesson_id,
     'Under what condition may a Diviner record a session?',
     '["Only with explicit prior written consent from the client, added to the intake form","Never under any circumstances","Whenever the Diviner deems it useful","Only for sessions over 60 minutes"]'::jsonb,
     0, 'Session recording requires explicit, documented consent before the session. The platform does not auto-record — any recording is the Diviner''s responsibility and requires a consent clause in the intake form.', 3);
  END IF;

  -- ===== Content Strategy for Advocates =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = '357005b3-6e81-4c71-ae21-c31dc393dc33'
    AND title = 'Content Strategy for Advocates'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'According to the Authenticity Principle, the highest-performing advocates:',
     '["Share personal stories about their genuine experience, not promotional copy","Post promotional content daily","Focus on the commission structure in their content","Target audiences who have never heard of astrology"]'::jsonb,
     0, 'Trust is the advocate''s core asset. Personal stories are credible; promotional copy is distrusted. The shift erodes the relationship that makes advocacy effective.', 1),
    (gen_random_uuid(), _lesson_id,
     'What content type is described as the most powerful conversion driver?',
     '["Authentic before/after transformation stories","Platform feature announcements","Discount codes","Product comparison posts"]'::jsonb,
     0, 'Before/after stories — sharing a real challenge, how a reading helped, and what shifted — combine social proof with emotional resonance, the two strongest conversion factors.', 2),
    (gen_random_uuid(), _lesson_id,
     'What is the recommended posting frequency for advocate content containing a referral link?',
     '["2–4 posts per month","Daily","Once per week","Once per month"]'::jsonb,
     0, 'Consistent but not constant — 2–4 contextual posts per month outperform daily posting, which conditions the audience to ignore the content.', 3);
  END IF;

  -- ===== Compliance, Ethics, and Platform Rules =====
  SELECT id INTO _lesson_id FROM training_lessons
  WHERE category_id = '357005b3-6e81-4c71-ae21-c31dc393dc33'
    AND title = 'Compliance, Ethics, and Platform Rules for Advocates'
  LIMIT 1;
  IF _lesson_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quiz_questions WHERE lesson_id = _lesson_id) THEN
    INSERT INTO quiz_questions (id, lesson_id, question, options, correct_answer, explanation, priority) VALUES
    (gen_random_uuid(), _lesson_id,
     'The FTC requires advocates to disclose their commission relationship because:',
     '["Being paid a commission is a material connection that audiences have a right to know about","Disclosure increases conversion rates","It is optional but recommended","Only required in the European Union"]'::jsonb,
     0, 'FTC guidelines require clear and conspicuous disclosure whenever a material connection (including commission) exists between the recommender and the product. Non-compliance carries legal risk.', 1),
    (gen_random_uuid(), _lesson_id,
     'Which of the following is a claim an advocate MAY make?',
     '["A personal account of their own experience with the platform","This reading will predict your future","Medical benefits of the readings","Guaranteed outcomes from booking a session"]'::jsonb,
     0, 'Personal experience is truthful and protected. Claims about outcomes, benefits, or predictions that go beyond personal experience are prohibited and potentially legally problematic.', 2),
    (gen_random_uuid(), _lesson_id,
     'What happens on a first violation of platform advocate rules?',
     '["A warning is issued","Immediate permanent removal","Account suspension for 30 days","No consequence for first violations"]'::jsonb,
     0, 'The first violation receives a formal warning. Repeated violations result in permanent removal from the advocacy program.', 3);
  END IF;

END $$;
