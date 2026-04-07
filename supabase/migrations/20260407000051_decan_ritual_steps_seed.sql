-- Migration: Seed ritual steps for all 36 astrological decans
-- Each decan receives 5 ordered steps: invocation, gate, instruction, affirmation, closing

-- ─── Decan 1: Aries I (Mars) ─────────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 1;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mars, the Red Warrior, first light of the cardinal fire that births all motion. Summon the raw, unbroken force of new beginnings — the spark before the flame, the breath before the cry. Let the god of action and will stand at your right hand as you cross this threshold.'),
    (v_id, 2, 'gate', 'You stand at the very first gate of the zodiacal wheel, where the ecliptic kisses the vernal equinox and all creation restarts. The iron door before you is hot to the touch — it has been waiting for your courage. Push it open with the full weight of your intention and step into the fire of becoming.'),
    (v_id, 3, 'instruction', 'Place both feet on the floor and feel the earth beneath you as you breathe three sharp, deliberate breaths into the belly — each one an act of will, not habit. On the third exhale, speak aloud one clear desire you are willing to fight for this season. Write it in red ink if you have it, in bold strokes that claim space on the page.'),
    (v_id, 4, 'affirmation', 'I am the first fire. I move before I am ready, and my movement makes me ready. My will is clean, my direction is true, and the force of Mars walks with me into every new beginning I dare to claim.'),
    (v_id, 5, 'closing', 'Press your right fist gently to your sternum and feel the heat of your own heartbeat — this is Mars confirmed in your body. Exhale fully, releasing any residue of hesitation into the earth below. The gate of Aries I remains open behind you; you carry its initiating fire forward into all that follows.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 2: Aries II (Sun) ──────────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 2;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Sun, sovereign light at the apex of cardinal fire, the radiant king who illuminates purpose and burns away pretense. Here the Sun pours its noon-strength into Aries, fusing identity with visibility. Invite the solar force to stand within your chest as living gold.'),
    (v_id, 2, 'gate', 'You stand at the second threshold of Aries, where the initial burst of will deepens into the declaration of self. The gate here is golden and open to the sky — there is no hiding in this light. Step forward and allow yourself to be fully seen, even by the parts of you that prefer shadow.'),
    (v_id, 3, 'instruction', 'Sit facing east or toward natural light and hold your gaze softly open for three minutes without looking away — this is the practice of solar witness. When the time has passed, write down what you noticed about your own inner weather. The Sun in Aries asks you to be honest about the gap between who you present and who you are becoming.'),
    (v_id, 4, 'affirmation', 'I am worthy of my own full light. I do not shrink from visibility; I grow into it deliberately and without apology. The Sun confirms my identity, and I walk forward as someone who has been seen and has not flinched.'),
    (v_id, 5, 'closing', 'Place both palms over your face for a moment, then draw them outward and away — a gesture of unveiling. Breathe the light back into the room. The solar gate of Aries II is sealed in your cells; its warmth is yours to carry into every act of courageous self-expression.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 3: Aries III (Venus) ───────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 3;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Venus, the bright goddess of desire and beauty, as she moves through the culminating fires of Aries. This is the tension of opposites meeting — the warrior sign and the planet of love — forging a force of passionate, decisive creation. Invite Venus to temper your iron will with the warmth of what you truly love.'),
    (v_id, 2, 'gate', 'You stand at the third and final gate of Aries, where the season of fire prepares to hand itself to earth. Here the question is not only what you will fight for, but what you find beautiful enough to sustain your effort. Step through this gate carrying both a sword and a rose.'),
    (v_id, 3, 'instruction', 'Take something beautiful — a flower, a stone, a piece of music — and spend five minutes in full sensory contact with it. Notice what this beauty activates in you: longing, gratitude, desire, memory. Then write one sentence about what you are building that is worth pouring beauty into. Venus in Aries insists that creation must be loved, not only forced.'),
    (v_id, 4, 'affirmation', 'I fight for what I love and I love what I fight for. My desire is a compass, not a distraction, and Venus refines my will into something worth the effort. I carry beauty forward as both shield and offering.'),
    (v_id, 5, 'closing', 'Touch your lips gently — a Venusian seal — and breathe out slowly. Let the fire of Aries settle into the warmth of appreciation rather than urgency. The third gate has refined your fire into something that can both burn and nourish; this is the gift you carry into Taurus.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 4: Taurus I (Mercury) ──────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 4;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mercury, the quick-minded messenger, as he enters the fixed earth of Taurus — a surprising pairing that asks intellect to root itself in the body. Here the mind must learn to speak through sensation, not abstraction. Invite Mercury to sharpen your capacity to name what you sense and value what you know.'),
    (v_id, 2, 'gate', 'You stand at the opening of Taurus, where the volcanic urgency of Aries cools into fertile, receptive earth. The gate here is made of dark soil and green stone, and it asks you to slow down enough to feel it. Step through with deliberate weight, pressing each foot into the ground as you cross the threshold.'),
    (v_id, 3, 'instruction', 'Remove your shoes and stand or sit on the earth, grass, or floor with full attention on the soles of your feet for five minutes. Notice every texture, temperature, and subtle pressure. Then open a journal and write in precise, concrete language — not metaphor — exactly what you sensed. Mercury in Taurus asks you to make the invisible tangible through naming.'),
    (v_id, 4, 'affirmation', 'My mind is grounded and my senses are wise. I translate experience into understanding without losing the fullness of the felt reality. Mercury gives me words; Taurus gives me roots; together they give me knowledge I can stand on.'),
    (v_id, 5, 'closing', 'Press both palms flat on the surface beneath you and let the earth receive any excess mental energy. Breathe slowly, settling your awareness downward from your head toward your feet. The first gate of Taurus is sealed in your body; carry its patient, observant intelligence forward.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 5: Taurus II (Moon) ────────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 5;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Moon in her exaltation, for Taurus is the sign where lunar power reaches its fullest expression — here feeling and form unite, and the tide of emotion finds a vessel that holds it without spilling. Invite the Moon to bring your emotional body into coherence with your physical one. Let her silver light move through you like sap through a tree.'),
    (v_id, 2, 'gate', 'You stand at the deep center of Taurus, where fixed earth becomes almost mineral in its patience and density. The gate here is low and intimate, asking you to bow your head to enter — to acknowledge that true security grows inward before it grows outward. Step through in humility and receive what this gate offers: stillness that is also alive.'),
    (v_id, 3, 'instruction', 'Prepare something nourishing — tea, a meal, a piece of fruit — and eat or drink it in complete silence and presence. With each swallow, consciously receive the nourishment as an act of self-worth, not mere sustenance. Afterward, place one hand on your abdomen and notice what emotional tone lives there; write it down without judgment.'),
    (v_id, 4, 'affirmation', 'I am worthy of the nourishment I seek. My emotional needs are not burdens — they are the tide that shapes me. The Moon confirms that what I feel is real, and Taurus confirms that I have what I need to be sustained.'),
    (v_id, 5, 'closing', 'Bring both hands to your heart and breathe there for three slow breaths, letting each exhale carry any accumulated tension downward and out. The lunar gate of Taurus II has deepened your capacity for receptive, embodied comfort. Carry this rootedness forward as a form of quiet strength.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 6: Taurus III (Saturn) ─────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 6;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Saturn, the lord of time, structure, and earned mastery, as he draws the final boundary of Taurus. This is the decan where pleasure must justify itself, where accumulated value is assessed against the cost of its maintenance. Invite Saturn to show you what in your life has been built to last — and what still needs the discipline of your hands.'),
    (v_id, 2, 'gate', 'You stand at the culminating threshold of Taurus, where the season of spring earth prepares to give way to the winds of Gemini. This gate is ancient stone, worn smooth by centuries of passage — it asks you to acknowledge what you have built before you leave it. Step through only after you have named one thing you have genuinely earned.'),
    (v_id, 3, 'instruction', 'Make a physical inventory: walk through one space in your home or life and assess what is in order, what is neglected, and what can finally be released. Do not rush this; Taurus and Saturn together demand unhurried honesty. Write three commitments to structure — one for your body, one for your finances or resources, one for a creative or spiritual practice.'),
    (v_id, 4, 'affirmation', 'I honor what I have built and I build only what I can sustain. Saturn teaches me that true wealth is created through consistent effort over time, and I am willing to do the unglamorous work that enduring things require.'),
    (v_id, 5, 'closing', 'Stand tall and feel the full length of your spine — this is your own inner Saturn: the column that upholds you. Breathe into that column, vertebra by vertebra, and acknowledge your own capacity for endurance. The third gate of Taurus has sealed its discipline into your bones; carry it forward as earned authority.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 7: Gemini I (Jupiter) ──────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 7;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Jupiter, the great expander, as he ignites the first winds of mutable air in Gemini — a pairing of vast philosophy and restless curiosity, the mind set free to roam the entire horizon of ideas. Invite Jupiter to open the doors of your perception, to make every question a doorway and every conversation a map to undiscovered territory.'),
    (v_id, 2, 'gate', 'You stand at the opening of Gemini, where the solid certainties of Taurus dissolve into a thousand shimmering possibilities. The gate here is a crossroads — roads extending in every direction, each one calling to you. Step forward knowing you cannot take all paths at once, but your willingness to be curious is itself the journey.'),
    (v_id, 3, 'instruction', 'Spend twenty minutes in free-associative writing — begin with a single word and follow every connection that arises without censoring, structuring, or concluding. Let the Gemini mind play at full velocity. At the end, circle three ideas that excited you most, and ask Jupiter''s question of each one: What does this make possible that was not possible before?'),
    (v_id, 4, 'affirmation', 'My curiosity is a gift, not a liability. Every question I ask opens a world, and Jupiter walks with me through the archives of all human knowing. I am a student of everything, and my restless mind is the engine of my expansion.'),
    (v_id, 5, 'closing', 'Take three quick, liberating breaths — let them be spontaneous, even joyful. Let your shoulders drop and your face relax into an expression of open interest. The first gate of Gemini has set your mind in motion; carry its quicksilver delight forward as an act of intellectual generosity.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 8: Gemini II (Mars) ────────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 8;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mars, the warrior of focused will, as he enters the middle current of Gemini''s air — here the sword of intellect is sharpened, and words become weapons of precision and persuasion. Invite Mars to give your thinking direction, to help you cut through confusion and argument to the essential truth. Let the blade of your mind be both swift and purposeful.'),
    (v_id, 2, 'gate', 'You stand at the central threshold of Gemini, where the initial excitement of ideas must now be tested against opposition and debate. The gate here vibrates — it is made of sound, of dialogue, of two voices in tension. Step through prepared to both speak and be contradicted; this is how the mind is made strong.'),
    (v_id, 3, 'instruction', 'Choose one belief you hold firmly and write the strongest possible counter-argument against it — not to abandon your view, but to understand its edges. Mars in Gemini demands intellectual courage: the willingness to let your ideas be attacked so they can emerge either proven or improved. When you finish, write what has been sharpened by this friction.'),
    (v_id, 4, 'affirmation', 'I welcome the challenge of a well-reasoned argument because it makes my thinking stronger. My words carry intention and my mind moves with precision. Mars has given me the courage to say what is true even when it cuts against the grain.'),
    (v_id, 5, 'closing', 'Take one deliberate breath through the nose and exhale sharply through the mouth — a warrior''s reset. Let your jaw unclench and your thoughts settle like a sword returned to its sheath. The middle gate of Gemini has sharpened your mind; carry its incisive clarity forward as disciplined expression.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 9: Gemini III (Sun) ────────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 9;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Sun in the final passage of Gemini, where the multiplicity of the twins is brought back to a single, luminous center — the point where all threads of knowing weave into understanding. Invite the Sun to illuminate which of your many thoughts and roles is most essentially you. Let solar clarity burn through the chatter and reveal the signal beneath the noise.'),
    (v_id, 2, 'gate', 'You stand at the final gate of Gemini, where the season of air prepares to pour itself into the waters of Cancer. Here the mind must choose: carry everything forward, or distill the journey into its essential insight. Step through this gate holding only what is true — leave the noise behind.'),
    (v_id, 3, 'instruction', 'Review the last month of your thinking: your ideas, your conversations, your plans, your changes of direction. Write the one sentence that best captures the insight your mind has arrived at. This is a solar practice — the Sun in Gemini asks you to synthesize, to find the thread that connects the scattered points into a coherent story of where you have been and where you are going.'),
    (v_id, 4, 'affirmation', 'I am more than my thoughts, but my thoughts reflect my truth. The Sun illuminates my core intelligence, and I carry that clarity into every conversation and decision. I know what I know, and I speak from that knowing with warmth and confidence.'),
    (v_id, 5, 'closing', 'Let your eyes close briefly and rest your gaze behind them — a moment of solar synthesis in the dark. Breathe once into the fullness of everything you have explored in this air season. The third gate of Gemini has gathered your scattered knowing into light; carry that light forward as the gift of a well-trained, illuminated mind.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 10: Cancer I (Venus) ───────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 10;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Venus, the goddess of love and beauty, as she enters the cardinal waters of Cancer — here desire becomes devotion, and love becomes the act of tending. Invite Venus to open the soft chambers of your heart, to teach you the difference between attachment and genuine care, between longing and true belonging. Let her light move through you like moonlight on water.'),
    (v_id, 2, 'gate', 'You stand at the opening threshold of Cancer, where the solstice sun turns and the light begins its long return inward. The gate here is made of water and memory — it asks you to be willing to feel what you have been carrying. Step through with your arms open, not to grasp, but to receive.'),
    (v_id, 3, 'instruction', 'Create a small altar or gathering of objects that represent the people, places, and sources of love in your life — photographs, tokens, symbols. Sit with this arrangement for ten minutes and allow yourself to feel, without censoring, the full spectrum of what these connections carry: tenderness, grief, gratitude, longing. Write a letter, unsent if needed, to someone who first taught you what love feels like.'),
    (v_id, 4, 'affirmation', 'I am capable of deep, devoted love, and I am worthy of receiving it in kind. Venus in Cancer teaches me that vulnerability is not weakness but the very substance of connection. I open my heart with care and trust the tides of feeling to carry me home.'),
    (v_id, 5, 'closing', 'Cross your arms gently over your chest in a self-embrace — not performance, but genuine self-holding. Breathe into the warmth you create there and let it be enough for this moment. The first gate of Cancer has opened your capacity for tender love; carry that opening as a quiet, nourishing presence in everything you do.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 11: Cancer II (Mercury) ────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 11;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mercury as he navigates the deep, instinctual waters of Cancer''s middle passage — here the mind learns to think in images, in memory, in the language of feeling-tones that words can only approximate. Invite Mercury to become your translator between the conscious and the unconscious, to help you articulate what the body already knows. Let your dreams speak and your waking mind listen.'),
    (v_id, 2, 'gate', 'You stand at the center of Cancer, in the deep interior of the sign''s emotional landscape where the tides are strongest and the pull of the past is most palpable. The gate here is made of water-worn glass — translucent but distorting, showing you the past through the lens of now. Step through prepared to see old stories with new eyes.'),
    (v_id, 3, 'instruction', 'Spend fifteen minutes in automatic writing beginning with the prompt: "What I have never said aloud about my family, my origins, or my belonging is..." Allow Mercury''s quick pen to move faster than your editing mind. When you finish, read what you have written as if a trusted friend wrote it — with compassion and curiosity, not judgment. Underline one sentence that surprises you.'),
    (v_id, 4, 'affirmation', 'My inner life is rich with wisdom I have not yet fully spoken. Mercury gives me the language, and Cancer gives me the courage to be honest about what I carry from the past. I translate my emotional truth into words that heal rather than wound.'),
    (v_id, 5, 'closing', 'Place one hand over your solar plexus and breathe slowly, letting the rhythm of your breath become the rhythm of the tide. Feel the ebb and flow — letting in, letting go. The second gate of Cancer has given your inner world a voice; carry its translated wisdom forward with both tenderness and clarity.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 12: Cancer III (Moon) ──────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 12;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Moon in her home sign, moving through Cancer''s final waters in the fullness of her own domain — this is the Moon at her most sovereign, most instinctual, most complete. Invite the Moon to bring all cycles to their natural conclusion, to show you what is ready to be released and what is ready to be received in the fullness of the turning tide.'),
    (v_id, 2, 'gate', 'You stand at the final gate of Cancer, where the season of water reaches its maximum depth before the sun begins its ascent into Leo''s fire. The gate here is submerged — to pass through it, you must let go of standing on solid ground. Step into the water of full surrender and allow yourself to be held by the element itself.'),
    (v_id, 3, 'instruction', 'Draw a bath or sit near water if possible; if not, fill a bowl and place your hands in it. Spend ten minutes in complete emotional surrender — not trying to solve anything, simply feeling the totality of your current inner state. Afterward, journal on: what am I ready to release from the past, and what am I inviting to be born in its place? The Moon asks you to honor the full cycle.'),
    (v_id, 4, 'affirmation', 'I trust the tide of my own emotional life — its ebbing is not loss, and its flowing is not chaos. The Moon confirms that I belong to cycles larger than my fear, and I release what is complete with gratitude and grace. The past has shaped me; it does not own me.'),
    (v_id, 5, 'closing', 'Let your hands rest in your lap, palms open and upward — a posture of complete reception and release simultaneously. Breathe the fullness of this watery completion into your body and exhale it gently into the world. The third gate of Cancer has brought you to the deepest shore of feeling; carry the wisdom of those waters forward as emotional intelligence that flows without drowning.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 13: Leo I (Saturn) ─────────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 13;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Saturn, the lord of discipline and legacy, as he enters the fixed fire of Leo — a powerful tension between the need for authentic self-expression and the demand for earned, enduring authority. Invite Saturn to show you the difference between performance and genuine sovereignty, between the mask of confidence and its hard-won reality. Let the old teacher stand at your side and ask: have you truly earned the crown you wear?'),
    (v_id, 2, 'gate', 'You stand at the opening gate of Leo, where fire takes on a fixed, concentrated quality — not the wild spark of Aries, but the sustained blaze of a sun at its height. The gate here is regal and demanding: it asks you to arrive as someone who has done the inner work of self-mastery, not merely the outer work of self-presentation. Enter with the dignity of someone who knows their worth.'),
    (v_id, 3, 'instruction', 'Sit upright in a posture of genuine authority — not stiffness, but the ease of someone at home in their own sovereignty. Write for twenty minutes on this question: In what area of my life have I been performing confidence rather than inhabiting it? What would it take to close that gap? Saturn in Leo demands this honest reckoning; it is the foundation upon which real self-expression is built.'),
    (v_id, 4, 'affirmation', 'My authority is earned, not assumed. Saturn and Leo together teach me that lasting radiance comes from the discipline of showing up as my truest self even when it is uncomfortable. I am building a sovereignty that does not depend on applause to sustain it.'),
    (v_id, 5, 'closing', 'Draw yourself to full height — seated or standing — and feel the dignity of your own spine. Breathe three deep, sovereign breaths that fill your entire chest and descend to your belly. The first gate of Leo has challenged you to be real; carry that reckoning forward as the bedrock of a self-expression that endures.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 14: Leo II (Jupiter) ───────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 14;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Jupiter, the great benefic, as he expands through the blazing center of Leo — here generosity meets brilliance, and the self becomes a vessel for something larger than personal glory. Invite Jupiter to open your heart to the joy of giving your gifts freely, to the abundance that flows when talent is deployed in service of something genuinely great. Let the philosopher-king awaken in you.'),
    (v_id, 2, 'gate', 'You stand at the magnificent center of Leo, where fixed fire burns at its most luminous and generous. The gate here is an arch of golden light — the kind of entrance made for ceremony and celebration. Step through it not in pride, but in the joy of someone who knows they have something real to contribute and is unafraid to offer it.'),
    (v_id, 3, 'instruction', 'Identify one gift, talent, or quality in yourself that you have been withholding — from the world, from a specific person, or from your own life out of fear of being too much. Spend fifteen minutes writing about what it would look like to offer that gift fully, without hedge or apology. Jupiter in Leo asks: what would you create, say, or become if generosity of spirit were your only operating principle?'),
    (v_id, 4, 'affirmation', 'I am generous with my gifts because they were given to be shared. Jupiter expands what Leo ignites, and together they remind me that my greatest act of service is to become more fully myself. I give freely, and in giving, I receive the fullness of what I am.'),
    (v_id, 5, 'closing', 'Extend both arms open and wide — a gesture of expansive offering — and hold that openness for three breaths before letting them settle back. Feel the warmth of your own fire radiating outward without diminishing what remains within. The central gate of Leo has opened your generosity; carry that warmth forward as a light that illuminates without consuming.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 15: Leo III (Mars) ─────────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 15;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mars, the warrior of purposeful action, as he takes the torch of Leo''s final fire and runs with it toward the horizon. Here the creative self becomes a force of decisive action — the artist who not only envisions but builds, the leader who not only inspires but moves. Invite Mars to ignite your will to complete, to bring the fullness of your creative power into the world through bold, committed acts.'),
    (v_id, 2, 'gate', 'You stand at the final threshold of Leo, where the summer sun begins its turn toward harvest and the fire of self-expression must prove itself through what it actually produces. The gate here burns with a directed heat — not scattered, but aimed. Step through carrying the full force of your accumulated creative fire, aimed at a single worthy target.'),
    (v_id, 3, 'instruction', 'Choose one creative or personal project that has been gestating and take one bold, physical action toward it today — not planning, not preparation, but actual doing. Write in your journal both what you did and what it felt like to act from the full creative power available to you. Mars in Leo demands that vision becomes deed; the ritual is the act itself.'),
    (v_id, 4, 'affirmation', 'My creativity is not decoration — it is a force that changes the world. Mars in Leo confirms that my passion has direction and my direction has power. I act boldly in service of what I am creating, and the world reflects back the fire I bring to it.'),
    (v_id, 5, 'closing', 'Make a fist with your dominant hand, then release it slowly — effort transformed into completion. Breathe the fire of Leo''s final gate through your entire body and let it settle as a warm, satisfied glow in your chest. The third gate of Leo has forged your creativity into action; carry that completed force forward as the confidence of someone who finishes what they start.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 16: Virgo I (Sun) ──────────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 16;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Sun in the opening passage of Virgo, where the diffuse light of late summer sharpens into the focused clarity of discernment. Here the solar force of identity is poured into the mutable earth of analysis, refinement, and dedicated service. Invite the Sun to illuminate your highest purpose — not as performance, but as the quiet, daily practice of offering your best self to the work that truly matters.'),
    (v_id, 2, 'gate', 'You stand at the threshold of Virgo, where the great harvest season begins and everything that was grown in fire and water must now be sorted, measured, and made useful. The gate here is humble and precise — it asks you to set aside grandiosity and enter in service of excellence. Step through with attention turned fully to the quality of what you offer, not the size of the recognition it brings.'),
    (v_id, 3, 'instruction', 'Choose one area of your daily life and analyze it with genuine care — your health routine, your creative practice, your work processes. Identify one specific, concrete improvement you can make this week that requires no grand gesture, only consistent attention. Write the improvement as a small daily protocol: what you will do, when, and how you will know it is working.'),
    (v_id, 4, 'affirmation', 'I find my purpose in the quality of my daily offering. The Sun in Virgo teaches me that true identity is revealed through the precision and care I bring to ordinary things. I am in service to something real, and that service is its own illumination.'),
    (v_id, 5, 'closing', 'Bow your head briefly — not in submission, but in the focused attention of someone who takes their craft seriously. Breathe cleanly into the front of your chest and let any self-criticism dissolve in the light of genuine discernment. The first gate of Virgo has set you on the path of purposeful refinement; carry that focus forward as dedicated, joyful excellence.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 17: Virgo II (Venus) ───────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 17;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Venus in the fertile middle of Virgo, where love becomes the act of service, and beauty is discovered in the fine-grained detail of how things are made and tended. Here Venus teaches you that devotion is not about grand passion alone, but about the exquisite attention you bring to what and whom you care for. Invite her to show you where love is already living in your ordinary gestures.'),
    (v_id, 2, 'gate', 'You stand at the deep center of Virgo, where mutable earth reaches its most potent expression of craftsmanship and care. The gate here is adorned with simple, perfect things — a single flower, a well-made tool, a line of handwriting. Step through it with the reverence of someone who understands that beauty lives in the well-made thing, not only the spectacular one.'),
    (v_id, 3, 'instruction', 'Spend thirty minutes doing one thing with complete, loving attention: mending something broken, cooking with care, writing by hand, tending a plant or a space. Let the quality of your attention be the offering. When you finish, sit for five minutes and write about where in your relationships you might offer this same quality of devoted, practical presence.'),
    (v_id, 4, 'affirmation', 'I love through the quality of my attention. Venus in Virgo teaches me that care made visible in small, consistent acts is among the most profound forms of devotion I can offer. I bring beauty to the practical, and the practical is made sacred by my care.'),
    (v_id, 5, 'closing', 'Rub your hands together gently — feeling the heat of your own craft — then rest them on your lap or the surface before you. Breathe in appreciation for the work of your hands and the love they carry. The second gate of Virgo has taught you that devotion lives in detail; carry that gift forward as a love that shows up, reliably, in the texture of every ordinary day.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 18: Virgo III (Mercury) ────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 18;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mercury, lord of language and discernment, in his home sign''s final passage — here the master craftsman of the mind reaches the apex of analytical power. Virgo''s Mercury is the editor, the healer, the diagnostician: the one who can see exactly where the flaw lives and knows precisely how to correct it. Invite Mercury to sharpen your capacity for self-assessment without self-destruction.'),
    (v_id, 2, 'gate', 'You stand at the final gate of Virgo, where the harvest season draws to its close and everything must be weighed, sorted, and assessed before the scales of Libra arrive. The gate here is marked with lists and measurements — it asks: what have you learned, what have you refined, what are you carrying forward? Enter only with what is truly worth keeping.'),
    (v_id, 3, 'instruction', 'Conduct a rigorous self-review of one skill or practice you have been developing. Write an honest assessment: what has improved, what gap remains, and what one specific technique would most efficiently close that gap. This is Mercury in Virgo at its most powerful — the intelligent practitioner who neither inflates nor deflates, but sees clearly and acts precisely.'),
    (v_id, 4, 'affirmation', 'My capacity for honest self-assessment is a gift I give to my own growth. Mercury in Virgo teaches me that clarity about imperfection is not cruelty — it is the intelligence that makes mastery possible. I see myself clearly and I improve without shame.'),
    (v_id, 5, 'closing', 'Tap your temples gently with your fingertips — a gesture of alert, grounded intelligence — and breathe a long, steady exhale. Let any residue of perfectionism dissolve, leaving only the clean, practical commitment to do the work well. The final gate of Virgo has perfected your discernment; carry its precision forward as the gift of a mind that serves growth rather than judgment.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 19: Libra I (Moon) ─────────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 19;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Moon as she enters the cardinal air of Libra, where feeling meets form and the tides of emotion are asked to become the architects of harmony. Here the Moon''s instinctual wisdom flows into the domain of relationship, beauty, and balance — the heart learning the grammar of fair exchange. Invite the Moon to help you feel your way toward genuine equilibrium, not the performance of peace.'),
    (v_id, 2, 'gate', 'You stand at the threshold of Libra, where the autumnal equinox holds day and night in perfect balance and the world pauses to recalibrate. The gate here is a pair of scales, exquisitely sensitive to even the smallest addition or removal of weight. Step through prepared to be weighed — and to honestly feel the places where you are not yet in balance.'),
    (v_id, 3, 'instruction', 'Draw a simple two-column list: on one side, write what you are currently giving in your most important relationship (to a person, a practice, or yourself). On the other, write what you are receiving. Sit with the imbalance, if any, without immediately fixing it — the Moon in Libra asks you to feel the tilt before you adjust the scale. Write what the imbalance tells you about an unmet need.'),
    (v_id, 4, 'affirmation', 'I feel my way toward balance with sensitivity and honesty. The Moon in Libra teaches me that true harmony is not the suppression of my needs but the courageous act of naming them in relationship. I give and receive with open eyes and an open heart.'),
    (v_id, 5, 'closing', 'Hold both hands at your sides, level with the earth, and feel for a moment of stillness — the equinox within. Breathe in the quality of balance and breathe out the tension of holding everything together alone. The first gate of Libra has opened your capacity for relational honesty; carry its felt sense of fairness forward as the foundation of every connection you build.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 20: Libra II (Saturn) ──────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 20;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Saturn, the lawgiver and lord of consequence, in the deepening heart of Libra''s air — here justice becomes more than preference, and fairness is enforced by the weight of principle rather than the lightness of social grace. Invite Saturn to give your commitments backbone, to help you build structures of relationship and engagement that are honest enough to endure. Let the old lawgiver teach you that true harmony has a spine.'),
    (v_id, 2, 'gate', 'You stand at the demanding center of Libra, where the ideals of beauty and balance must be tested against the reality of time, effort, and consequence. The gate here is a hall of judgment — not punitive, but honest. Step through only if you are willing to be accountable for the agreements you have made and the ones you have avoided making.'),
    (v_id, 3, 'instruction', 'Identify one commitment — to a person, a practice, or a standard — that you have been half-keeping. Write honestly about why the half-commitment persists: is it fear, confusion, competing priorities, or genuine misalignment? Then write what a full, Saturn-worthy commitment to this thing would actually require of you. Decide clearly: deepen or release, but do not continue the ambiguity.'),
    (v_id, 4, 'affirmation', 'I honor my commitments because they are the architecture of my integrity. Saturn in Libra teaches me that fair exchange requires both parties to be accountable, starting with myself. I build relationships on the solid ground of honest agreements, kept with care.'),
    (v_id, 5, 'closing', 'Place both feet flat on the ground and feel the weight of your own accountability — not as burden, but as ballast. Breathe steadily and feel the solidity of a person who keeps their word. The middle gate of Libra has strengthened your relational spine; carry that structural integrity forward as the gift of someone who can truly be relied upon.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 21: Libra III (Jupiter) ────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 21;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Jupiter, the great philosopher-king, as he moves through Libra''s final air — here the pursuit of harmony becomes the pursuit of wisdom, and the question of fair exchange expands to encompass the whole of how we ought to live together. Invite Jupiter to elevate your sense of justice beyond personal comfort into the realm of true ethical vision. Let the expansive teacher show you how your relationships are a microcosm of the world you are helping to build.'),
    (v_id, 2, 'gate', 'You stand at the final gateway of Libra, where the season of relation prepares to give way to Scorpio''s depth and transformation. The gate here is vast and open, like the entrance to a great hall — it asks you to think beyond your immediate circle to the wider implications of how you choose to live in relation to others. Step through as a citizen of something larger than your own story.'),
    (v_id, 3, 'instruction', 'Write for twenty minutes on this question: What is my vision of a fair, beautiful, and just way for people to live together — in my immediate community, and more broadly? Jupiter in Libra asks you to expand your ethical imagination. Then identify one concrete act this week that aligns your personal choices with this vision, however small the gesture.'),
    (v_id, 4, 'affirmation', 'I am part of a larger story of how human beings learn to live together well. Jupiter in Libra expands my sense of justice and beauty beyond what benefits me alone. I carry the vision of fair relation outward into the world as an act of philosophical generosity.'),
    (v_id, 5, 'closing', 'Open your arms wide and then bring your hands together at your heart — gathering the expansive and returning it to center. Breathe in the fullness of Libra''s completed season and let it distill to its essential gift: the knowledge that how we treat each other is how we build the world. The third gate of Libra has expanded your vision; carry that ethical imagination forward as a force for genuine harmony.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 22: Scorpio I (Mars) ───────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 22;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mars, the traditional ruler of Scorpio, in the opening descent into fixed water — here the warrior''s energy turns inward, and the battle is no longer with external obstacles but with the hidden territories of the psyche. Mars in Scorpio does not charge; it penetrates. Invite this fierce, focused energy to help you go deeper than comfort allows, to find the truth that lives beneath the surface of what you think you know about yourself.'),
    (v_id, 2, 'gate', 'You stand at the first gate of Scorpio, where the world goes underground and the bright certainties of autumn air must surrender to the dark waters of transformation. The gate here is black iron, sealed until you speak the password — which is simply your willingness to be changed. Step through without the armor of your preferred self-image; this sign will not allow pretense to survive it.'),
    (v_id, 3, 'instruction', 'Sit in darkness or near-darkness for ten minutes in complete stillness. Let whatever surfaces in the silence be present without being solved — the fear, the desire, the grief, the power you have not yet claimed. When you return to the light, write for fifteen minutes on: What do I most want that I am afraid to admit I want? Mars in Scorpio demands this kind of fierce honesty about desire.'),
    (v_id, 4, 'affirmation', 'I have the courage to go where others will not look within themselves. Mars gives me the warrior''s will and Scorpio gives me the depth; together they make me someone who can face my own darkness and emerge with genuine power. I do not flinch from my own truth.'),
    (v_id, 5, 'closing', 'Press both thumbs into the center of your palms — a point of focus and concentration — and breathe deeply into your lower abdomen. Feel the subterranean power that lives in your own body, the force that predates all your stories about yourself. The first gate of Scorpio has opened the deep; carry its penetrating awareness forward as the gift of someone who is not afraid to know themselves fully.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 23: Scorpio II (Sun) ───────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 23;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Sun as it moves through the deepest waters of Scorpio''s center — this is the Sun in its most tested form, where the light of consciousness must illuminate what has long lived in shadow. The Sun is in its fall here, humbled by the depth it is asked to enter, and in that humbling it becomes something more profound than triumph. Invite this solar light to illuminate your hidden self without judgment, only clarity.'),
    (v_id, 2, 'gate', 'You stand at the heart of Scorpio, in the place where transformation is not a metaphor but a lived dismemberment of what you were. The gate here is invisible — you know you have crossed it only when something in you has genuinely died and something else has not yet arrived to replace it. Enter this threshold prepared for the between-time, the liminal space that is the true center of this sign.'),
    (v_id, 3, 'instruction', 'Write a letter from your shadow self — the part of you that carries what has been rejected, denied, or hidden. Let this voice speak honestly, without your conscious editor correcting it. Then write a response from your highest self: not to fix or dismiss what the shadow said, but to acknowledge it and ask what it needs in order to become integrated rather than projected. The Sun in Scorpio asks you to meet your whole self in the light.'),
    (v_id, 4, 'affirmation', 'I shine my light into the places I have avoided, and I am not destroyed by what I find there. The Sun in Scorpio teaches me that true illumination includes shadow, and that my deepest power lives in the wholeness of what I have dared to know about myself. I am complete, even in my complexity.'),
    (v_id, 5, 'closing', 'Let your eyes close and rest in the quiet darkness behind them — feeling simultaneously the light of your awareness and the depth of what it illuminates. Breathe until these two feel like partners rather than opposites. The second gate of Scorpio has shown you your own whole light; carry that integrated illumination forward as a wisdom that has been forged in genuine depth.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 24: Scorpio III (Venus) ────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 24;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Venus in Scorpio''s final waters, where love has been stripped of illusion and only what is truly binding remains. Venus is in her detriment here — the goddess of beauty and pleasure in the sign of death and transformation — and yet this is precisely where love becomes sacred rather than merely pleasant. Invite Venus to show you a love that has survived loss, a beauty that has been forged in grief, a desire that knows its own depth.'),
    (v_id, 2, 'gate', 'You stand at the final gate of Scorpio, where the work of transformation reaches its culmination and what could not be destroyed has become indestructible. The gate here is covered in roses growing from bone — beauty and death intertwined without apology. Step through as someone who has loved and lost and loved again, and knows the difference between attachment and genuine union.'),
    (v_id, 3, 'instruction', 'Write about a love — for a person, a place, a version of yourself — that has been transformed by loss, change, or time. Describe not only what was lost, but what remains, what was purified, what became precious only because of the transformation. Venus in Scorpio asks you to honor the love that has survived its own crisis; this is the ritual of alchemical devotion.'),
    (v_id, 4, 'affirmation', 'My capacity for love is made more powerful by what it has survived. Venus in Scorpio teaches me that desire which has passed through transformation is no longer need — it is devotion. I love from the fullness of someone who has been changed by love and is grateful for the change.'),
    (v_id, 5, 'closing', 'Bring both hands to your heart and feel there the particular warmth of love that has been tested and has endured. Breathe into that warmth without trying to protect it from future change. The third gate of Scorpio has transformed your love into something unbreakable; carry that depth of devotion forward as the most precious thing the underworld has given you.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 25: Sagittarius I (Mercury) ────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 25;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mercury, the messenger of the gods, as he enters the mutable fire of Sagittarius — an unexpected but potent pairing of the particular and the universal, the detail and the vast horizon. Here Mercury is asked to think beyond categories, to find the message that matters across every boundary of language and culture. Invite Mercury to carry your ideas beyond your familiar territory into the wilder country of philosophical adventure.'),
    (v_id, 2, 'gate', 'You stand at the opening of Sagittarius, where the dark waters of Scorpio give way to a sudden, liberating expanse of sky — the archer''s arrow already nocked and aimed at the farthest visible point. The gate here is an open field beneath open sky; there are no walls, only directions. Step through in the direction of your highest question, the one you have not yet had the courage to fully pursue.'),
    (v_id, 3, 'instruction', 'Choose a text, teaching, or tradition from outside your familiar worldview — a different culture, philosophy, or spiritual path — and spend thirty minutes genuinely engaging with it: reading, watching, or listening. Let Mercury''s curiosity move through Sagittarius''s wide-angle lens. Write three questions this encounter opens in you, questions you do not yet know how to answer but are excited to pursue.'),
    (v_id, 4, 'affirmation', 'My mind is a pilgrim, not a prisoner. Mercury in Sagittarius gives me the language of adventure, and I follow my highest questions across every border of familiar thinking. I am a seeker, and the seeking itself is the sacred act.'),
    (v_id, 5, 'closing', 'Look up — literally, lift your gaze toward the sky or ceiling — and hold that upward orientation for three full breaths. Feel the expansive quality of Sagittarian fire in your chest, the energy of someone who has just sighted the horizon they were born to ride toward. The first gate of Sagittarius has opened your mind to the wider world; carry that philosophical appetite forward as a gift to every conversation you enter.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 26: Sagittarius II (Moon) ──────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 26;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Moon in the expanding center of Sagittarius, where the instinctual tides of feeling are asked to stretch beyond personal need into the territory of universal belonging. Here the Moon learns that home is not only a place — it is a felt sense of being part of something larger than the self. Invite the Moon to carry your emotional wisdom beyond the familiar shore into the open ocean of spiritual feeling.'),
    (v_id, 2, 'gate', 'You stand at the wide center of Sagittarius, where the archer has already released the arrow and now waits in the breathless moment between action and arrival. The gate here is made of starlight and memory — it asks you to trust that your emotional truth, fully felt, is also a kind of philosophy. Step through in the trust that your personal experience is a doorway to universal understanding.'),
    (v_id, 3, 'instruction', 'Spend twenty minutes outdoors or near a window with a wide view, and allow yourself to feel — fully and without narration — whatever emotion arises in contact with the natural world. Then write: what does this feeling tell you about your relationship to something larger than your individual story? The Moon in Sagittarius asks that your emotional life expand into the dimension of meaning, not just comfort.'),
    (v_id, 4, 'affirmation', 'My emotions are not just personal — they are my access point to the shared human experience. The Moon in Sagittarius teaches me that to feel deeply is to understand widely, and that my inner life is a map to the territory of universal truth. I trust my feelings as philosophical intelligence.'),
    (v_id, 5, 'closing', 'Look at the sky — day or night — and breathe until your breath matches the scale of what you are seeing. Feel your emotional body expand to meet the vastness outside you, and rest in the paradox of being small and held at once. The middle gate of Sagittarius has expanded your feeling into philosophy; carry that widened compassion forward as the wisdom of someone who has felt beyond themselves.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 27: Sagittarius III (Saturn) ───────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 27;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Saturn, the lord of mastery and consequence, as he closes the season of Sagittarius''s fire with the sobering question: of all that you have sought, what are you willing to commit to? Saturn in Sagittarius is the philosopher who has finished wandering and is now building the school — turning wisdom into form, vision into structure, belief into an actual life. Invite Saturn to help you ground your highest ideals into disciplines that will last beyond the inspiration that sparked them.'),
    (v_id, 2, 'gate', 'You stand at the final threshold of Sagittarius, where the season of philosophical fire must prove itself in the cold, honest light of practical consequence. The gate here is the last border before the high mountain of Capricorn — it asks: are you prepared to live what you believe, not just believe it? Step through only if you are ready to let your vision become a vow.'),
    (v_id, 3, 'instruction', 'Write your personal philosophical credo — the beliefs about life, meaning, and how to live that you would be willing to be held accountable to. Do not write what sounds good; write what you actually live by, including the tensions and contradictions. Saturn in Sagittarius asks: what spiritual or philosophical commitments are you willing to structure your actual daily life around, when the inspiration has faded and the discipline remains?'),
    (v_id, 4, 'affirmation', 'My beliefs are not decorations — they are the architecture of my life. Saturn in Sagittarius asks me to build something enduring from the fire of my ideals, and I am equal to that task. I commit to living my philosophy, not just professing it, and my integrity is the proof.'),
    (v_id, 5, 'closing', 'Stand with your feet hip-width apart and feel the full gravity of your own commitment — the weight of what you have chosen to stand for. Breathe into the solidity of that stance and let it be a form of prayer. The third gate of Sagittarius has forged your vision into vow; carry that integrity forward as the life of someone who has promised themselves to what they believe.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 28: Capricorn I (Jupiter) ──────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 28;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Jupiter in the opening cardinal earth of Capricorn — here the great expander meets the great builder, and ambition is given both vision and scale. Jupiter in Capricorn asks: what are you willing to build that is larger than your own lifetime? Invite this pairing of philosopher and architect to show you the grandest, most enduring version of what you are capable of creating in the material world.'),
    (v_id, 2, 'gate', 'You stand at the threshold of Capricorn, where the winter solstice marks the longest night and the quiet, stubborn beginning of the returning light. The gate here is the base of a mountain — enormous, demanding, and magnificent. Step through prepared for the long climb; the summit is real, but the ascent is the entire story.'),
    (v_id, 3, 'instruction', 'Write a ten-year vision: not a fantasy, but a concrete, ambitious picture of what you are building in the material world — career, legacy, mastery, contribution. Let Jupiter''s expansiveness widen what you think is possible; let Capricorn''s cardinal earth make it practical and structured. Then identify the three foundational actions you can take this month that would move you toward this vision.'),
    (v_id, 4, 'affirmation', 'I am building something that will endure beyond my immediate needs. Jupiter in Capricorn expands my vision of what is possible through sustained, intelligent effort, and I am both ambitious and patient enough to build it. I climb this mountain because the view from the summit serves more than just myself.'),
    (v_id, 5, 'closing', 'Feel the weight of your own body — the solidity and substance of the instrument you have been given to do your work in the world. Breathe into that physical reality with respect and resolve. The first gate of Capricorn has set you at the base of your mountain; carry Jupiter''s expansive vision forward as the compass that keeps you climbing even when the path is steep and the summit is out of sight.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 29: Capricorn II (Mars) ────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 29;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mars in the demanding center of Capricorn''s fixed-natured fixed earth, where the warrior''s energy is channeled not into battle but into the relentless, unglamorous labor of building something real. Mars in Capricorn is at his most effective: strategic, disciplined, and fueled by ambition rather than anger. Invite this Mars to be your energy in the long middle of whatever you are building, the force that keeps you working when the initial inspiration has burned away.'),
    (v_id, 2, 'gate', 'You stand at the heart of the winter mountain, in the deepest cold and the most demanding section of the climb. The gate here has no decoration — it is simply a narrow pass that requires both hands and full concentration to navigate. Step through with the soldier''s focus: no excess movement, no wasted breath, only the next necessary action.'),
    (v_id, 3, 'instruction', 'Choose the hardest, most avoided task in your current work or project — the one you have been circling without engaging. Set a timer for forty-five minutes and do only that task, with full concentration and no interruption. When the timer ends, record what you completed and how it felt to bring disciplined force to bear. Mars in Capricorn rewards the practitioner who can sustain effort through resistance.'),
    (v_id, 4, 'affirmation', 'I have the discipline to do the difficult work that my vision requires. Mars in Capricorn teaches me that real power is the capacity for sustained, strategic effort — and I am developing that power every time I choose the hard work over the comfortable avoidance. My ambition is backed by action.'),
    (v_id, 5, 'closing', 'Take a long, full breath and let it out in a slow, steady stream — the breath of someone who has worked and is not yet done but is not yet defeated. Feel the satisfaction of genuine effort in your muscles and your mind. The middle gate of Capricorn has tested your endurance; carry that proven discipline forward as the foundation of everything you are determined to build.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 30: Capricorn III (Sun) ────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 30;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Sun as he reaches the summit of Capricorn''s final earth — here the light of identity and purpose is revealed in the full dignity of achieved mastery. This is the Sun at the peak of the mountain, where the long climb justifies itself in the clarity of the view. Invite the solar force to illuminate everything you have built and show you, without false modesty, the genuine authority you have earned through sustained effort and integrity.'),
    (v_id, 2, 'gate', 'You stand at the final gate of Capricorn, where the long winter''s discipline has shaped you into someone capable of carrying real responsibility in the world. The gate here is at the summit — open sky in every direction, and the full weight of your achieved purpose visible before you. Step through as someone who has earned the right to be here.'),
    (v_id, 3, 'instruction', 'Write an acknowledgment letter to yourself — not a celebration of what you hope to do, but a genuine reckoning with what you have actually accomplished through effort, persistence, and integrity. Name three specific things you have built or become that you did not find easy. The Sun in Capricorn asks you to see your own achievement clearly, neither inflating nor diminishing it — this is the foundation of true authority.'),
    (v_id, 4, 'affirmation', 'I have earned what I carry. The Sun in Capricorn illuminates my genuine authority — the kind that comes from having done the work and kept the faith with my own highest standards. I carry my accomplishments with dignity, not arrogance, and I offer the mastery I have earned in service of those who come after me.'),
    (v_id, 5, 'closing', 'Sit in the posture of someone who has arrived — not exhausted, but complete. Breathe the summit air of this achieved passage and let the full weight of your earned identity settle into your bones. The final gate of Capricorn has confirmed your mastery; carry that authority forward into Aquarius as a contribution to something beyond your own story.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 31: Aquarius I (Venus) ─────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 31;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Venus, the goddess of beauty and relationship, as she enters the fixed air of Aquarius — here love expands beyond the personal into the collective, and beauty becomes the vision of a world made better through the quality of human connection. Invite Venus to help you love not just those close to you, but the idea of humanity itself, to find the beauty in the strange and unconventional, to appreciate what is genuinely original.'),
    (v_id, 2, 'gate', 'You stand at the threshold of Aquarius, where the hard-won mastery of Capricorn is offered back to the community that made it possible. The gate here is charged with electricity — it buzzes with the frequency of ideas whose time has come. Step through as someone who has moved beyond purely personal goals into genuine care for the whole.'),
    (v_id, 3, 'instruction', 'Identify one place in your community — local, professional, or extended — where your particular gifts could make a genuine contribution to the collective good. Write specifically what you would offer, how you would offer it, and what you imagine the impact might be over time. Venus in Aquarius asks: what would it look like to love the world through the expression of your particular beauty and talent?'),
    (v_id, 4, 'affirmation', 'My love extends beyond the personal into the universal. Venus in Aquarius teaches me that genuine beauty is found in the revolutionary, the unconventional, and the humanizing. I offer my gifts to the collective with an open hand, and I find my deepest joy in connection that crosses every boundary of sameness.'),
    (v_id, 5, 'closing', 'Feel the charge of your own original frequency — the particular way you are different from everyone else, the gift that is uniquely yours to offer. Let that frequency radiate outward from your body for three breath-cycles without apology. The first gate of Aquarius has connected your love to the collective good; carry that universal warmth forward as the electricity of someone who dares to care beyond the familiar.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 32: Aquarius II (Mercury) ──────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 32;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mercury in the crackling center of Aquarius''s fixed air — here the messenger god moves at the speed of electricity, carrying ideas across networks, building the architecture of shared understanding. Mercury in Aquarius thinks in systems, in patterns that transcend the individual, in the language of the future. Invite this mercurial intelligence to help you see the pattern behind the noise, the system behind the chaos, the network that connects what appears separate.'),
    (v_id, 2, 'gate', 'You stand at the electric heart of Aquarius, where the fixed air crackles with the tension of ideas held in suspension, ready to discharge into the world as innovation. The gate here is a live circuit — you must become part of the current to pass through it. Step in without insulating yourself; let the charge of collective intelligence move through you.'),
    (v_id, 3, 'instruction', 'Map a system that affects your life — a social structure, an organizational pattern, a community dynamic — as a visual diagram with nodes and connections. Spend twenty minutes identifying what the system optimizes for, where it breaks down, and what a small intervention at a high-leverage point might change. Mercury in Aquarius asks you to think like a systems designer: find the elegant intervention that changes the whole.'),
    (v_id, 4, 'affirmation', 'My mind moves at the speed of the collective future. Mercury in Aquarius gives me the capacity to see systems, networks, and patterns that are invisible to those thinking only of themselves. I contribute my intelligence to the larger architecture of what we are building together.'),
    (v_id, 5, 'closing', 'Tap your fingertips together — ten points of electric contact — and feel the network of your own nervous intelligence. Breathe until the hum of ideas settles into the quiet certainty of someone who understands what they are seeing. The middle gate of Aquarius has attuned your mind to the collective signal; carry that systems intelligence forward as a contribution to the future that is trying to arrive.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 33: Aquarius III (Moon) ────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 33;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon the Moon in the final passage of Aquarius, where the deepest tension of the sign reaches its culmination: the conflict between the need to belong to the collective and the need to remain an individual, between the universal and the profoundly personal. Here the Moon asks you to feel the loneliness and the liberation of being genuinely original. Invite her to help you find the emotional coherence that allows you to be fully yourself within a community that does not fully understand you.'),
    (v_id, 2, 'gate', 'You stand at the final threshold of Aquarius, where the season of air and collective intelligence prepares to dissolve into the oceanic empathy of Pisces. The gate here is a paradox: it is both a crowd and a solitary vigil. Step through having made peace with the particular way you belong and do not belong — with both your fellowship and your singularity.'),
    (v_id, 3, 'instruction', 'Write honestly about the tension between belonging and authenticity in your own life: where do you change yourself to fit in, and where do you hold your originality at the cost of connection? The Moon in Aquarius asks you to feel this tension without resolving it prematurely. Then write: what would it mean to be fully yourself AND genuinely connected — not despite your difference, but because of it?'),
    (v_id, 4, 'affirmation', 'I belong to the human family precisely because I am fully myself within it. The Moon in Aquarius teaches me that my emotional uniqueness is not an obstacle to connection — it is my most genuine offering to the collective. I feel my way toward community that welcomes my whole, original self.'),
    (v_id, 5, 'closing', 'Let your arms hang loose at your sides — neither reaching for company nor pulling away — and breathe in the quality of self-sufficient belonging. Feel that you are complete in this moment, connected to everything, dependent on nothing to validate your existence. The third gate of Aquarius has brought you to a peace with your own originality; carry that emotional freedom forward as the gift of someone who belongs to the whole human story.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 34: Pisces I (Saturn) ──────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 34;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Saturn, the lord of structure and time, as he enters the mutable waters of Pisces — the most demanding crossing in the zodiac for the old taskmaster, who must now govern what is by nature ungovernable: the ocean of spirit, feeling, and dream. Saturn in Pisces asks: can you build a container large enough to hold the infinite? Invite this pairing to help you give form to your spiritual life, to make your mystical experience real through disciplined practice rather than passive drift.'),
    (v_id, 2, 'gate', 'You stand at the opening of Pisces, where the wheel of the zodiac nears its completion and the boundaries between self and everything else begin to dissolve. The gate here is made of water — you cannot see what lies beyond it, only feel its pull. Step through knowing that the loss of certainty you experience here is not failure but the beginning of a deeper navigation.'),
    (v_id, 3, 'instruction', 'Establish a minimal daily spiritual practice that requires no inspiration to maintain — five minutes of meditation, a brief prayer, a single line of gratitude in a journal. Write it down as a contract with yourself: what it is, when it happens, and how you will honor it even on the days when it feels meaningless. Saturn in Pisces teaches that the container of practice makes spiritual experience possible; without the form, the water simply spreads and is lost.'),
    (v_id, 4, 'affirmation', 'I give my spiritual life the structure it deserves. Saturn in Pisces teaches me that devotion expressed through discipline is more enduring than inspiration alone. I build the container, show up to it faithfully, and trust that the ocean will fill it in its own time and its own way.'),
    (v_id, 5, 'closing', 'Sit in complete stillness for one minute — not meditating, just being, with no agenda. Let Saturn''s structure and Pisces''s dissolution hold you simultaneously. Breathe until you feel the paradox as grace rather than contradiction. The first gate of Pisces has given your spiritual life a floor; carry that disciplined devotion forward as the practice that sustains you when the mystical experience has ebbed.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 35: Pisces II (Jupiter) ────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 35;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Jupiter, the traditional ruler of Pisces, in the deep center of his home waters — this is the decan of maximum spiritual abundance, where the philosopher''s expansiveness meets the mystic''s oceanic dissolution, and the result is grace. Jupiter in Pisces is the most generous of all configurations: boundless compassion meeting boundless wisdom. Invite this energy to open you beyond the small self into the vast, forgiving intelligence of universal love.'),
    (v_id, 2, 'gate', 'You stand at the heart of Pisces, submerged in the waters of the collective unconscious, where every human story swims and every spiritual tradition takes its source. The gate here has no door — it is simply a point of deepening, where you can choose to go further in than you have yet allowed yourself. Step through in the trust that the deeper you go, the more you find that you are held.'),
    (v_id, 3, 'instruction', 'Spend thirty minutes in any form of devotional practice that moves you beyond personal concern: prayer, meditation, contemplative reading, time in nature with your full attention given to something greater than yourself. Let Jupiter''s generosity move through you as a quality of radical openness. Afterward, write: what did you receive in the dissolution of your usual preoccupations? What became visible when the self stepped aside?'),
    (v_id, 4, 'affirmation', 'I am held by an intelligence more vast than my understanding. Jupiter in Pisces opens me to the grace that is always already present, waiting for my willingness to stop managing and begin receiving. I trust the ocean. I let myself be moved. I am not diminished by this surrender — I am expanded beyond what I could have constructed alone.'),
    (v_id, 5, 'closing', 'Let your breath become as slow and deep as you can manage — the breath of someone fully at rest in the ocean of being. Feel the warmth of Jupiter''s generosity as something you are swimming in rather than seeking. The middle gate of Pisces has opened you to grace; carry that spacious, compassionate openness forward as the quality that transforms every encounter into a meeting of souls.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;

-- ─── Decan 36: Pisces III (Mars) ──────────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM decans WHERE decan_number = 36;
  INSERT INTO decan_rituals (decan_id, step_order, step_type, content) VALUES
    (v_id, 1, 'invocation', 'You call upon Mars, the warrior of purposeful will, in the final waters of the zodiac — this is the last and most mysterious of all decans, where the blade of Mars is not drawn against an enemy but plunged into the ocean of dissolution, where all weapons are relinquished, all battles completed, and all that remains is the warrior''s naked soul returned to the source. Invite Mars to give you the courage to complete, to release, to let the entire cycle end gracefully so that the new fire of Aries can begin again, cleaner.'),
    (v_id, 2, 'gate', 'You stand at the very last gate of the zodiacal wheel, at the point where the path runs out and the ocean begins — the place where every journey ends and every soul prepares for its return to the original fire. The gate here is the horizon at sea: not a door but a vanishing point. Step into it without knowing what lies beyond, trusting only that your willingness to complete is the finest act available to you.'),
    (v_id, 3, 'instruction', 'Conduct a ritual of completion: review the year or the cycle you are closing and write down everything you are releasing — unfinished grief, unfulfilled expectations, identities that have served their purpose and must now be relinquished. Then burn the list, bury it, or surrender it to water. Mars in Pisces asks you to be a warrior of endings: to cut what needs to be cut, with compassion, so that the new beginning has room to be genuinely new.'),
    (v_id, 4, 'affirmation', 'I complete what I have begun, and I release what has run its course. Mars in Pisces gives me the courage to surrender, which is the hardest and most courageous act of all. I stand at the end of the wheel grateful for every gate I have crossed, and I return to the source with everything I have learned, ready to be born again.'),
    (v_id, 5, 'closing', 'Bow your head fully, letting the back of your neck stretch long — a gesture of the deepest possible completion and return. Breathe the entire zodiacal journey through your body one last time: fire, earth, air, water, and back to fire. The final gate of Pisces, the thirty-sixth and last gate of the wheel, is sealed. You carry every decan''s wisdom forward into the new beginning that is always, already, beginning.')
  ON CONFLICT (decan_id, step_order) DO NOTHING;
END $$;
