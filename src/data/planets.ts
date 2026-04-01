export interface CelestialBody {
  slug: string
  name: string
  symbol: string
  type: 'luminary' | 'personal' | 'social' | 'transpersonal' | 'point'
  ruledSigns: string[]
  ruledSignSlugs: string[]
  exaltation: string
  detriment: string
  fall: string
  element?: string
  orbitalPeriod: string
  retrograde: string
  keywords: string[]
  overview: string
  inSigns: string
  inHouses: string
  mythology: string
  retrogradeGuide: string
  faqs: { question: string; answer: string }[]
}

const planets: CelestialBody[] = [
  {
    slug: 'sun',
    name: 'The Sun',
    symbol: '☉',
    type: 'luminary',
    ruledSigns: ['Leo'],
    ruledSignSlugs: ['leo'],
    exaltation: 'Aries',
    detriment: 'Aquarius',
    fall: 'Libra',
    element: 'Fire',
    orbitalPeriod: '365.25 days',
    retrograde: 'The Sun never retrogrades. As the center of our solar system, it is the one body that always moves forward from our geocentric perspective, symbolizing the unwavering core of identity.',
    keywords: ['Identity', 'Vitality', 'Purpose', 'Ego', 'Willpower', 'Creative force'],
    overview: `The Sun is the most fundamental celestial body in astrology, representing the core of who you are — your essential identity, life purpose, and the creative force that animates your entire being. In the birth chart, the Sun sign describes the fundamental qualities of your character, the traits you are developing and expressing throughout your lifetime, and the central theme around which your life story unfolds. It is your conscious self, your ego, and the part of you that seeks recognition and self-actualization.

Astrologically, the Sun governs vitality, willpower, and the drive toward self-expression. It represents the father archetype, authority figures, and the principle of leadership. The Sun's placement by sign, house, and aspect reveals how you shine in the world, what gives you energy and confidence, and where you feel most authentically yourself. A well-aspected Sun suggests a strong sense of purpose and natural confidence, while a challenged Sun may indicate struggles with self-worth or finding one's place in the world.

The Sun spends approximately thirty days in each zodiac sign, creating the twelve Sun signs that form the foundation of popular astrology. However, the Sun sign is just the beginning — its house placement reveals the life arena where your identity needs to shine, and its aspects to other planets show how your core self interacts with other dimensions of your personality. Understanding your Sun is the first step in understanding the full complexity of your birth chart.

In mundane astrology, the Sun represents the head of state, the government, and the vital energy of a nation. In medical astrology, it governs the heart, the spine, and overall vitality. The Sun's annual journey through the zodiac marks the seasons of the year and the rhythmic pulse of life on Earth.`,
    inSigns: `The Sun expresses itself differently through each of the twelve zodiac signs, creating the distinctive personality archetypes that most people are familiar with. In fire signs (Aries, Leo, Sagittarius), the Sun burns brightly with confidence, enthusiasm, and a natural drive to lead and inspire. These are the most overtly "solar" expressions — bold, creative, and energized by the spotlight. In earth signs (Taurus, Virgo, Capricorn), the Sun expresses itself through practical achievement, material mastery, and steady, determined progress toward concrete goals.

Air signs (Gemini, Libra, Aquarius) channel the Sun's energy through the intellect, communication, and social connection. These individuals shine through their ideas, their ability to connect with others, and their contribution to the world of thought. Water signs (Cancer, Scorpio, Pisces) express the Sun through emotional depth, intuition, and the capacity for profound psychological understanding. The Sun in water signs may appear quieter outwardly but possesses a powerful inner luminosity.

The Sun's dignity — whether it is in its ruling sign (Leo), exaltation (Aries), detriment (Aquarius), or fall (Libra) — adds another layer of interpretation. In Leo, the Sun operates at full power with natural confidence and creative authority. In Aries, it is exalted, expressing dynamic initiative and courage. In Aquarius and Libra, the Sun must work harder to express its individuality, learning to shine within the context of group consciousness and partnership.`,
    inHouses: `The Sun's house placement reveals the life arena where you most need to express your identity and find your sense of purpose. In angular houses (1st, 4th, 7th, 10th), the Sun is prominently placed and drives you toward visible achievement — personal identity, home and family, partnership, or career. These are powerful positions that often indicate individuals who make a significant mark on their environment.

In succedent houses (2nd, 5th, 8th, 11th), the Sun focuses your identity through resources, creativity, transformation, or social contribution. The Sun in the Fifth House, for example, is in its natural domain and radiates creative vitality, while the Sun in the Eighth House finds purpose through psychological depth and transformative experiences. In cadent houses (3rd, 6th, 9th, 12th), the Sun expresses itself through learning, service, philosophy, or spiritual pursuits.

The Sun in the Twelfth House is sometimes considered a challenging placement because the identity operates behind the scenes, in the realm of the unconscious. However, this placement can produce profoundly spiritual individuals, gifted healers, and those who find their purpose in quiet service or artistic creation drawn from the depths of the imagination.`,
    mythology: `In virtually every ancient civilization, the Sun was venerated as a supreme deity or principle of life. The Greeks worshipped Apollo, god of light, music, poetry, prophecy, and healing — a perfect embodiment of solar qualities. In Egypt, Ra was the king of the gods, sailing his solar barque across the sky each day and through the underworld each night, symbolizing the eternal cycle of death and rebirth that the Sun enacts daily. The Norse honored Sol, the goddess who drove the chariot of the Sun across the heavens, pursued by the wolf Skoll.

In Vedic astrology, the Sun is Surya, the soul of the cosmos, representing the Atman or divine self within each individual. Across cultures, the Sun symbolizes consciousness, sovereignty, the divine masculine principle, and the creative power that sustains all life. Its mythological associations illuminate the astrological Sun's role as the center of the chart — the source of light around which all other planetary energies orbit and from which they derive their visibility.`,
    retrogradeGuide: `The Sun never appears to move retrograde from Earth's perspective, as it is the center of our solar system. This astronomical fact has profound astrological significance: the Sun represents the one part of your identity that never truly goes backward. While other planetary functions may be internalized during retrograde periods, your core self remains constant and forward-moving.

However, the Sun does participate in important cyclical phenomena. Solar eclipses — which occur when the Moon blocks the Sun's light — function as powerful reset points for identity, purpose, and the areas of life governed by the house where the eclipse falls. These eclipse cycles operate over approximately eighteen-year periods and can mark significant turning points in the expression of your solar identity.`,
    faqs: [
      {
        question: 'Is my Sun sign the most important part of my chart?',
        answer: 'The Sun sign is the most well-known part of the chart, but a complete astrological picture requires the Moon sign (emotions), Rising sign (outward presentation), and the full planetary picture. The Sun represents your core identity, but you are much more than just your Sun sign.',
      },
      {
        question: 'What does it mean if my Sun is in detriment or fall?',
        answer: 'A Sun in detriment (Aquarius) or fall (Libra) does not mean weakness — it means the solar energy expresses itself in less traditionally "solar" ways. Aquarius Sun finds identity through group consciousness and innovation, while Libra Sun finds purpose through partnership and balance. These placements offer unique gifts.',
      },
      {
        question: 'How does the Sun differ from the Rising sign?',
        answer: 'The Sun represents your core identity and essential self — who you are becoming. The Rising sign (Ascendant) represents how you appear to others and your automatic response to new situations. The Sun is the "real you"; the Rising sign is the mask you wear when meeting the world.',
      },
      {
        question: 'Can my Sun sign change over time?',
        answer: 'Your natal Sun sign never changes — it is fixed at the moment of birth. However, the progressed Sun moves forward approximately one degree per year, changing signs every thirty years. This reflects the evolution and maturation of your identity over the course of your life.',
      },
    ],
  },
  {
    slug: 'moon',
    name: 'The Moon',
    symbol: '☽',
    type: 'luminary',
    ruledSigns: ['Cancer'],
    ruledSignSlugs: ['cancer'],
    exaltation: 'Taurus',
    detriment: 'Capricorn',
    fall: 'Scorpio',
    element: 'Water',
    orbitalPeriod: '27.3 days',
    retrograde: 'The Moon never retrogrades. Its rapid orbit around the Earth means it is always moving forward, reflecting the constant flow and change of emotional life.',
    keywords: ['Emotions', 'Instinct', 'Nurturing', 'Memory', 'Habits', 'The unconscious'],
    overview: `The Moon is the second luminary and represents the emotional, instinctive, and unconscious dimensions of the personality. While the Sun is who you are becoming, the Moon is who you already are at the deepest level — your emotional nature, your automatic reactions, your needs for comfort and security, and the patterns imprinted in earliest childhood. The Moon governs the inner world of feelings, memories, and the body's innate wisdom, making it one of the most important placements for understanding someone's emotional landscape.

In the birth chart, the Moon sign reveals how you process and express emotions, what makes you feel safe and nurtured, and your relationship with the feminine, the mother, and the archetype of the caregiver. The Moon's house placement shows where you seek emotional fulfillment and security, while its aspects to other planets reveal how your emotional nature interacts with other dimensions of personality. A well-supported Moon indicates emotional resilience and the ability to nurture both self and others, while a stressed Moon may point to emotional patterns that need conscious attention.

The Moon moves through all twelve signs in approximately twenty-seven days, spending about two and a half days in each sign. This rapid cycle means the Moon sign is highly personal — even people born a day or two apart may have different Moon signs. The Moon also governs the body's rhythmic processes: menstrual cycles, sleep patterns, digestion, and the ebb and flow of energy. In electional and horary astrology, the Moon is often the most significant factor, representing the flow of events and the emotional undercurrent of any situation.

The Moon's phases — new, waxing, full, and waning — add yet another layer of meaning. Your natal lunar phase describes the relationship between your conscious purpose (Sun) and your emotional nature (Moon), revealing a fundamental life rhythm that shapes how you approach growth, action, and release.`,
    inSigns: `The Moon's sign placement describes your emotional temperament and instinctive responses. In fire signs (Aries, Leo, Sagittarius), the Moon is emotionally expressive, spontaneous, and action-oriented. These individuals process feelings by doing something about them — they need outlets for emotional energy and can become restless when forced into passivity. The Moon in fire is warm, generous, and sometimes dramatic in emotional expression.

In earth signs (Taurus, Virgo, Capricorn), the Moon seeks emotional security through the tangible and practical. The Moon is exalted in Taurus, where it finds deep comfort in sensory pleasures, nature, and material stability. In Virgo, emotional processing is analytical and service-oriented. In Capricorn (its detriment), the Moon learns to manage emotions with discipline, though it may suppress vulnerability. Air sign Moons (Gemini, Libra, Aquarius) process emotions through the intellect — talking, analyzing, and seeking perspective. Water sign Moons (Cancer, Scorpio, Pisces) are the most emotionally sensitive and intuitive, experiencing feelings with extraordinary depth and often possessing psychic or empathic abilities.`,
    inHouses: `The Moon's house placement reveals the life area where you seek emotional fulfillment and feel most at home. In angular houses, the Moon's emotional nature is prominent and visible. The Moon in the First House wears its heart on its sleeve; in the Fourth House, emotional life centers on home and family; in the Seventh, emotional needs drive partnership; and in the Tenth, emotional nature becomes publicly visible through career.

In succedent houses, the Moon channels emotional needs through resources (2nd), creativity and children (5th), shared intimacy (8th), or friendships and community (11th). In cadent houses, emotional processing happens through communication and learning (3rd), daily routines and health (6th), philosophy and travel (9th), or the inner spiritual life (12th). The Moon in the Twelfth House is particularly interesting — emotions run deep and private, with a rich unconscious life and powerful intuition.`,
    mythology: `The Moon has been worshipped across all cultures as a symbol of the feminine divine. In Greek mythology, the Moon was associated with three goddesses: Selene (the full Moon), Artemis (the crescent Moon and the huntress), and Hecate (the dark Moon and the mysteries). Each represents a different phase and quality of lunar energy — fullness, independence, and the power of the unseen. In Roman tradition, Diana and Luna embodied the Moon's protective, nurturing, and cyclical qualities.

In Hindu mythology, Chandra is the Moon god, associated with the mind, emotions, and the nectar of immortality. The Moon's association with water, fertility, and the cycles of nature appears in virtually every culture, reflecting humanity's primal recognition that the Moon governs the tides of both ocean and emotion. In astrology, these mythological threads weave together to form the Moon's role as guardian of the inner life, keeper of memory, and mirror of the soul's emotional truth.`,
    retrogradeGuide: `Like the Sun, the Moon never retrogrades. Its ceaseless forward motion through the zodiac symbolizes the constant flow of emotional experience — feelings arise, are felt, and pass, making way for new emotional impressions. The Moon's perpetual forward movement is reflected in its role as the fastest-moving body in the chart, reminding us that emotions are inherently transient and cyclical.

However, the Moon's phases function as a kind of cyclical rhythm that parallels retrograde themes. The waning Moon, from full to new, represents a period of release, introspection, and emotional processing — similar to retrograde energy. The dark Moon (the three days before the new Moon) is a particularly potent time for inner reflection, letting go, and preparing for the emotional renewal that comes with each new lunar cycle.`,
    faqs: [
      {
        question: 'Is the Moon sign more important than the Sun sign?',
        answer: 'Neither is more important — they represent different dimensions of your personality. The Sun is your conscious identity and life direction, while the Moon is your emotional nature and instinctive responses. Many astrologers consider the Moon equally important to the Sun, and some argue it is more relevant to daily emotional experience.',
      },
      {
        question: 'How does the Moon affect my daily mood?',
        answer: 'The transiting Moon changes signs every two and a half days, subtly coloring the emotional atmosphere. When the transiting Moon aspects your natal planets, you may notice shifts in mood, energy, or emotional sensitivity. Tracking the Moon\'s sign can help you understand daily emotional fluctuations.',
      },
      {
        question: 'What does my Moon sign say about my mother?',
        answer: 'The Moon in the birth chart often describes the experience of your mother or primary caregiver — not necessarily who they are objectively, but how you experienced them emotionally. The Moon\'s sign, house, and aspects paint a picture of the maternal relationship and its impact on your emotional development.',
      },
      {
        question: 'Can my Moon sign affect my physical health?',
        answer: 'The Moon governs bodily rhythms, fluid balance, digestion, and the body\'s response to emotional stress. Your Moon sign may indicate physical sensitivities related to its associated body systems. Many people notice that their physical energy and health fluctuate with the lunar cycle.',
      },
    ],
  },
  {
    slug: 'mercury',
    name: 'Mercury',
    symbol: '☿',
    type: 'personal',
    ruledSigns: ['Gemini', 'Virgo'],
    ruledSignSlugs: ['gemini', 'virgo'],
    exaltation: 'Virgo',
    detriment: 'Sagittarius',
    fall: 'Pisces',
    orbitalPeriod: '88 days',
    retrograde: 'Mercury retrogrades approximately three times per year for about three weeks each time. These are among the most well-known astrological events, associated with communication delays, technology glitches, and the need to review and revise.',
    keywords: ['Communication', 'Intellect', 'Learning', 'Logic', 'Adaptability', 'Commerce'],
    overview: `Mercury is the planet of communication, intellect, and the mind's ability to perceive, process, and transmit information. Named after the Roman messenger of the gods, Mercury governs everything related to mental activity — thinking, speaking, writing, reading, negotiating, and analyzing. In the birth chart, Mercury reveals how you think, how you communicate, what interests you intellectually, and how you process the constant stream of information that comprises daily experience.

Mercury rules two signs — Gemini and Virgo — reflecting its dual nature as both the gatherer of information (Gemini) and the analyzer and organizer of information (Virgo). This makes Mercury uniquely versatile, comfortable in both the realm of curiosity and the realm of precision. Mercury also governs short-distance travel, commerce, technology, and the nervous system. In the modern world, Mercury's influence extends to email, texting, social media, coding, and all forms of digital communication.

As the smallest and fastest-moving planet in our solar system, Mercury reflects the quick, nimble quality of thought itself. It is neither masculine nor feminine, neither benefic nor malefic — Mercury takes on the qualities of whatever it touches, amplifying and communicating the energy of the planets it aspects. This chameleon-like quality makes Mercury the ultimate adapter and connector in the chart.

Mercury's condition in the birth chart is particularly important for writers, teachers, salespeople, translators, and anyone whose livelihood depends on the effective exchange of information. Its house placement shows where your mental energy is focused, while its aspects reveal the unique texture and style of your thinking.`,
    inSigns: `Mercury through the signs shapes the style and quality of your thinking and communication. In fire signs (Aries, Leo, Sagittarius), Mercury thinks boldly and communicates with enthusiasm and conviction. These placements favor quick decision-making, inspirational speaking, and a direct communication style, though they may lack patience for details. In earth signs (Taurus, Virgo, Capricorn), Mercury is practical, methodical, and thorough. Mercury is exalted in Virgo, where its analytical powers reach their peak.

In air signs (Gemini, Libra, Aquarius), Mercury is most at home intellectually. Gemini Mercury is quick, curious, and versatile. Libra Mercury weighs both sides of every argument with diplomatic skill. Aquarius Mercury thinks in original, innovative patterns. Water signs (Cancer, Scorpio, Pisces) bring emotional depth and intuition to Mercury's mental function. Cancer Mercury thinks through feelings and memory, Scorpio Mercury penetrates to hidden truths, and Pisces Mercury (its fall) processes information through imagination and empathy rather than pure logic.`,
    inHouses: `Mercury's house placement directs your mental energy toward specific life areas. In the First House, the mind is central to identity — you are known for how you think and communicate. In the Third House (its natural domain), Mercury excels at learning, writing, and connecting with the immediate environment. In the Sixth House, mental energy focuses on work, health analysis, and practical problem-solving.

In angular houses, Mercury's communicative power is prominent and outwardly directed. In succedent houses, mental energy is channeled toward building and sustaining — finances (2nd), creative projects (5th), research (8th), or networking (11th). In cadent houses, Mercury is particularly comfortable, as these houses emphasize learning, communication, and the exchange of ideas. Mercury in the Ninth House produces the philosopher and teacher, while Mercury in the Twelfth House creates a contemplative, introspective thinker with access to unconscious knowledge.`,
    mythology: `Mercury (Greek: Hermes) was the messenger of the gods, the guide of souls to the underworld, and the patron of travelers, merchants, and thieves. Born of Zeus and the nymph Maia, Hermes was a trickster from birth — on his first day of life, he stole Apollo's cattle and invented the lyre. This myth perfectly captures Mercury's astrological nature: clever, quick, resourceful, and comfortable at the boundaries between worlds.

As psychopomp — the guide of souls between the worlds of the living and the dead — Hermes represents Mercury's role as the connector between different levels of consciousness. Mercury is the translator, the go-between, and the one who moves freely across all boundaries. In alchemy, Mercury (quicksilver) represented the volatile, transformative principle that facilitated the Great Work. This mercurial quality — changeable, adaptable, and impossible to pin down — is the essence of the planet's astrological meaning.`,
    retrogradeGuide: `Mercury retrograde is the most discussed astrological event in popular culture, occurring approximately three times each year for about three weeks. During these periods, Mercury appears to move backward through the zodiac from Earth's perspective. Astrologically, this corresponds to a period of internalization — the mental functions governed by Mercury turn inward for review, reflection, and revision. Communication mishaps, technology failures, travel delays, and contractual misunderstandings are commonly reported.

The deeper purpose of Mercury retrograde is not merely inconvenience but recalibration. These periods invite you to slow down, re-examine your ideas and plans, revisit unfinished conversations, and catch errors that might have gone unnoticed. Mercury retrograde is excellent for any activity with a "re-" prefix: review, revise, reconnect, reconsider. Many people find that important information surfaces during these periods — things they missed the first time around. Rather than fearing Mercury retrograde, working with its reflective energy can improve the quality of your thinking and communication when Mercury stations direct.`,
    faqs: [
      {
        question: 'Why does Mercury retrograde affect technology?',
        answer: 'Mercury governs all forms of communication and information exchange, including technology. During retrograde periods, these systems are prone to glitches, misunderstandings, and breakdowns. Back up important data, double-check messages, and allow extra time for technology-dependent tasks.',
      },
      {
        question: 'Can my Mercury sign differ from my Sun sign?',
        answer: 'Yes — because Mercury is never more than 28 degrees from the Sun, your Mercury can only be in the same sign as your Sun, or in the sign immediately before or after it. This means Mercury is always close to your Sun sign but may bring a different communicative style.',
      },
      {
        question: 'What does Mercury in retrograde in my natal chart mean?',
        answer: 'About 20% of people are born during Mercury retrograde. Natal Mercury retrograde suggests an internalized thinking process — you may think before you speak, process information differently from the mainstream, or have a talent for seeing things others miss. It is not a negative placement.',
      },
      {
        question: 'Should I avoid signing contracts during Mercury retrograde?',
        answer: 'Traditional advice is to avoid initiating new contracts or major purchases during Mercury retrograde. However, reviewing and revising existing agreements is favorable. If you must sign during retrograde, read everything carefully and build in flexibility for revisions.',
      },
    ],
  },
  {
    slug: 'venus',
    name: 'Venus',
    symbol: '♀',
    type: 'personal',
    ruledSigns: ['Taurus', 'Libra'],
    ruledSignSlugs: ['taurus', 'libra'],
    exaltation: 'Pisces',
    detriment: 'Aries',
    fall: 'Virgo',
    orbitalPeriod: '225 days',
    retrograde: 'Venus retrogrades approximately every 18 months for about 40 days. Venus retrograde periods are associated with revisiting relationships, reassessing values, and reconnecting with former lovers.',
    keywords: ['Love', 'Beauty', 'Harmony', 'Values', 'Pleasure', 'Attraction'],
    overview: `Venus is the planet of love, beauty, pleasure, and the magnetic force of attraction that draws people and things together in harmony. Named after the Roman goddess of love, Venus governs your romantic nature, your aesthetic sensibilities, your values, and your capacity for enjoying life's pleasures. In the birth chart, Venus reveals what you find beautiful, who you are attracted to, how you express affection, and what brings you the deepest sense of pleasure and contentment.

Venus rules two signs — Taurus and Libra — representing its dual nature as both the appreciator of sensory pleasure and material beauty (Taurus) and the seeker of harmony, partnership, and social grace (Libra). Through Taurus, Venus connects us to the body, the senses, and the tangible world of beauty and comfort. Through Libra, Venus connects us to other people, teaching the arts of compromise, diplomacy, and aesthetic refinement in relationship.

Beyond romance, Venus governs money as it relates to values — what you are willing to spend your resources on, and what brings you a sense of abundance and worth. Venus also rules the arts, fashion, design, and anything that elevates the mundane to the beautiful. A strong Venus in the chart often indicates artistic talent, social charm, and an ability to attract resources and people with seemingly effortless grace.

In the body, Venus governs the kidneys, the venous system, the throat, and the overall sense of physical harmony. In mundane astrology, Venus represents the arts, entertainment, diplomacy, and the financial markets in their more optimistic expressions.`,
    inSigns: `Venus through the signs reveals your love language, aesthetic preferences, and approach to pleasure. In fire signs (Aries, Leo, Sagittarius), Venus is passionate, expressive, and bold in love. Venus in Aries (its detriment) is impulsive and direct in romance; Leo Venus is dramatic and generous; Sagittarius Venus is adventurous and philosophical about love. Fire sign Venus needs excitement and freedom in relationships.

In earth signs (Taurus, Virgo, Capricorn), Venus is sensual, loyal, and deeply invested in building something lasting. Venus in Taurus — its own sign — is at its most luxurious and pleasure-seeking. Air sign placements (Gemini, Libra, Aquarius) bring intellectual connection and social grace to love. Venus in Libra, its other home, is the consummate diplomat and aesthete. Water signs (Cancer, Scorpio, Pisces) make Venus deeply emotional and intuitive in love. Venus is exalted in Pisces, where love becomes transcendent, compassionate, and unconditionally giving.`,
    inHouses: `Venus's house placement shows where you experience love, beauty, and pleasure in your life. In the First House, Venus bestows personal charm and attractiveness. In the Second House, it attracts financial resources and creates refined taste. In the Fifth House, Venus brings romantic joy and creative artistry. In the Seventh House — its natural domain through Libra — Venus is the strongest indicator of a harmonious, loving partnership.

Venus in angular houses makes love and beauty visible themes in your life. In succedent houses, Venus works to build and sustain beauty, pleasure, and loving connections over time. In cadent houses, Venus brings harmony and aesthetic sensitivity to communication (3rd), daily life (6th), philosophy and culture (9th), or the inner spiritual world (12th). Venus in the Twelfth House is a particularly interesting placement — love may feel hidden, sacrificial, or deeply spiritual.`,
    mythology: `Venus (Greek: Aphrodite) was born from the sea foam, emerging fully formed as the most beautiful of all the gods. Her birth from the ocean connects her to the element of water and the realm of emotion and desire. Aphrodite was irresistible to gods and mortals alike, and her stories explore every dimension of love — from the passionate and jealous to the tender and transcendent. Her marriage to Hephaestus (Vulcan) and affair with Ares (Mars) symbolize the eternal tension between beauty and desire, stability and passion.

In Mesopotamian mythology, Inanna/Ishtar was the original Venus figure — goddess of love and war, who descended to the underworld and returned transformed. This myth of descent and return mirrors Venus's astronomical cycle: Venus disappears from the evening sky, passes behind the Sun (conjunct), and reappears as the morning star, symbolically reborn. This cycle connects Venus not only to love and beauty but also to the transformative power of desire and the courage to descend into the depths of the heart.`,
    retrogradeGuide: `Venus retrograde occurs approximately every eighteen months, lasting about forty days. During these periods, the planet of love and beauty turns inward, inviting a deep reassessment of your relationships, values, and aesthetic choices. Ex-partners may reappear, unresolved relationship issues surface, and you may find yourself questioning what you truly value and desire. It is generally advised to avoid starting new relationships, making major purchases, or undergoing cosmetic changes during Venus retrograde, as your sense of value and beauty is in flux.

The deeper purpose of Venus retrograde is to realign your heart with your truest values. Relationships that survive Venus retrograde often emerge stronger, while those that end during this period were likely already misaligned. Venus retrograde is an excellent time for reconnecting with former friends or lovers in a spirit of resolution, for rediscovering art or beauty that once inspired you, and for doing the inner work of understanding what you genuinely need in love versus what you have been conditioned to want.`,
    faqs: [
      {
        question: 'Does Venus only govern romantic love?',
        answer: 'Venus governs all forms of love and attraction, including romantic love, friendship, aesthetic appreciation, and self-love. It also rules values, money (as it relates to what you value), and the arts. Venus is about what brings you pleasure and what you find beautiful in all its forms.',
      },
      {
        question: 'What does Venus retrograde mean for relationships?',
        answer: 'Venus retrograde invites a reassessment of relationship patterns and values. Ex-partners may reappear, and current relationships are tested for authenticity. It is best used for reflection rather than initiating new romantic commitments. Relationships that endure Venus retrograde are often strengthened.',
      },
      {
        question: 'Can my Venus sign be different from my Sun sign?',
        answer: 'Yes — Venus can be up to two signs away from your Sun sign, giving you a different love style than your core Sun sign identity. For example, an Aries Sun with a Pisces Venus combines fiery independence with deeply romantic, compassionate love.',
      },
      {
        question: 'What does it mean if Venus is in detriment or fall?',
        answer: 'Venus in Aries (detriment) or Scorpio (detriment) expresses love more intensely and independently. Venus in Virgo (fall) may be more reserved or analytical in love but develops deep devotion through service and practical care. These placements are not weaknesses but rather unique expressions of love.',
      },
    ],
  },
  {
    slug: 'mars',
    name: 'Mars',
    symbol: '♂',
    type: 'personal',
    ruledSigns: ['Aries', 'Scorpio'],
    ruledSignSlugs: ['aries', 'scorpio'],
    exaltation: 'Capricorn',
    detriment: 'Libra',
    fall: 'Cancer',
    element: 'Fire',
    orbitalPeriod: '687 days',
    retrograde: 'Mars retrogrades approximately every 26 months for about 2.5 months. Mars retrograde periods are associated with frustration, redirected energy, and the internalization of drive and ambition.',
    keywords: ['Action', 'Desire', 'Courage', 'Aggression', 'Energy', 'Assertion'],
    overview: `Mars is the planet of action, desire, and the primal energy that drives you to pursue what you want. Named after the Roman god of war, Mars governs your assertiveness, your physical energy, your competitive drive, and the way you handle conflict and anger. In the birth chart, Mars reveals how you take initiative, what motivates you to act, and the style in which you pursue your goals and desires. It is the planet that gets things done — raw, unrefined energy that needs direction and purpose.

Mars rules two signs — Aries (its diurnal home) and Scorpio (its nocturnal home) — reflecting its dual nature as both the overt warrior and the strategic, intensely focused powerhouse. Through Aries, Mars is direct, impulsive, and bold. Through Scorpio, Mars is calculating, persistent, and willing to go to psychological extremes to achieve its aims. Together, these rulerships describe the full range of Mars energy, from the sprint to the marathon.

In relationships, Mars represents desire, passion, and sexual energy. Your Mars sign and house placement reveal what you find sexually attractive, how you pursue romantic interests, and how you express passion. Mars also governs physical vitality, athleticism, and the body's relationship with adrenaline and testosterone. A strong Mars produces someone who is physically energetic, decisive, and willing to fight for what they believe in.

In the body, Mars rules the muscles, the adrenal glands, the blood, and the male reproductive system. In mundane astrology, Mars governs the military, conflict, accidents, fires, and any expression of collective aggression or competitive energy.`,
    inSigns: `Mars through the signs describes your action style and what ignites your motivation. In fire signs (Aries, Leo, Sagittarius), Mars is at its most dynamic — bold, enthusiastic, and ready to charge forward. Mars in Aries, its own sign, is the purest expression of martial energy: fast, courageous, and sometimes reckless. In Leo, Mars acts with dramatic flair and creative ambition. In Sagittarius, Mars is motivated by adventure, ideals, and the quest for freedom.

In earth signs (Taurus, Virgo, Capricorn), Mars is steady, persistent, and practically focused. Mars is exalted in Capricorn, where disciplined ambition and strategic patience reach their peak. Air signs (Gemini, Libra, Aquarius) intellectualize Mars energy, fighting with words and ideas rather than fists. Mars in Libra (its detriment) struggles with direct confrontation, preferring diplomacy but sometimes becoming passive-aggressive. Water signs (Cancer, Scorpio, Pisces) channel Mars through emotion — these placements are motivated by deep feelings, loyalty, and sometimes by unconscious drives that are difficult to articulate.`,
    inHouses: `Mars's house placement shows where you direct your physical energy, ambition, and competitive drive. In the First House, Mars dominates the personality with assertiveness and physical vitality. In the Sixth House, Mars drives relentless work ethic and can indicate athleticism or health focus. In the Tenth House, Mars powers ambitious career pursuits and a drive for professional achievement.

In angular houses, Mars energy is outwardly directed and highly visible — these are the fighters, competitors, and leaders. In succedent houses, Mars channels energy into building and sustaining — financial pursuit (2nd), creative passion (5th), transformative intensity (8th), or social activism (11th). In cadent houses, Mars energy is directed toward learning, communication, philosophy, or spiritual battle. Mars in the Twelfth House is particularly complex — the warrior operates behind the scenes, sometimes battling hidden enemies or internal demons.`,
    mythology: `Mars (Greek: Ares) was the god of war, feared and respected for his raw, untamed power. Unlike Athena, who represented strategic warfare, Ares embodied the brutal, chaotic fury of battle. He was the lover of Aphrodite (Venus), and their passionate, illicit affair symbolizes the eternal dance between desire and aggression, love and war. The Romans elevated Mars to a more noble position, honoring him as the father of Romulus and Remus — the founders of Rome — and associating him with agricultural fertility alongside martial prowess.

In Vedic astrology, Mars is Mangala or Kuja, associated with courage, property, and the energy of the warrior caste. The planet's blood-red color connects it to the primal forces of life — blood, iron, and the vital energy that sustains physical existence. Mars reminds us that creation requires destruction, that growth requires the courage to fight for what matters, and that the drive to survive and thrive is as essential to human nature as the desire for love and beauty.`,
    retrogradeGuide: `Mars retrograde occurs approximately every twenty-six months, lasting about ten weeks. When the planet of action turns inward, external progress can feel frustratingly slow. Projects stall, motivation wanes, and direct confrontation becomes less effective. This is not a time for launching new initiatives or starting fights — it is a time for reassessing how you use your energy, addressing anger that has been suppressed, and strategically planning your next moves.

Mars retrograde is particularly valuable for examining your relationship with anger, desire, and assertiveness. Are you expressing these energies in healthy ways? Are you fighting the right battles? Are you directing your energy toward goals that truly matter? Physical energy may be lower during this period, making it important to rest, recover, and build strength rather than push through exhaustion. When Mars stations direct, the clarity gained during retrograde allows you to move forward with renewed focus and more effective action.`,
    faqs: [
      {
        question: 'Does Mars indicate anger problems?',
        answer: 'Mars indicates how you handle anger, not whether you have anger problems. A well-aspected Mars expresses anger constructively through assertiveness and healthy competition. A stressed Mars may indicate difficulty managing anger, but awareness and conscious effort can transform any Mars placement into a source of strength.',
      },
      {
        question: 'How does Mars affect sexual compatibility?',
        answer: 'Mars represents desire and sexual energy in both men and women. In synastry (relationship astrology), Mars contacts between two charts indicate physical chemistry and passion. The Mars sign describes what you find sexually attractive and how you pursue intimate connections.',
      },
      {
        question: 'What does it mean to have Mars in a feminine sign?',
        answer: 'Mars in feminine (earth or water) signs expresses its energy more subtly and strategically. Rather than overt aggression, these placements channel Mars through persistence (earth) or emotional intensity (water). Mars in Cancer, for example, fights fiercely to protect loved ones.',
      },
      {
        question: 'Should I avoid starting projects during Mars retrograde?',
        answer: 'New projects started during Mars retrograde may require significant revision. This period is better suited for revisiting stalled projects, reassessing your goals, and building internal strength. When Mars turns direct, you will have greater clarity and energy for new beginnings.',
      },
    ],
  },
  {
    slug: 'jupiter',
    name: 'Jupiter',
    symbol: '♃',
    type: 'social',
    ruledSigns: ['Sagittarius', 'Pisces'],
    ruledSignSlugs: ['sagittarius', 'pisces'],
    exaltation: 'Cancer',
    detriment: 'Gemini',
    fall: 'Capricorn',
    orbitalPeriod: '11.86 years',
    retrograde: 'Jupiter retrogrades annually for about four months. Jupiter retrograde periods internalize the quest for growth, meaning, and expansion, making it a time for philosophical reflection rather than outward expansion.',
    keywords: ['Expansion', 'Abundance', 'Wisdom', 'Faith', 'Opportunity', 'Generosity'],
    overview: `Jupiter is the great benefic of astrology — the planet of expansion, abundance, wisdom, and the benevolent grace that brings opportunity and good fortune into your life. Named after the king of the Roman gods, Jupiter governs your capacity for growth, your philosophical and spiritual outlook, your sense of faith and optimism, and the areas of life where you experience luck, generosity, and abundance. Where Jupiter falls in your chart is where you tend to receive blessings and where life seems to support your aspirations.

Jupiter rules Sagittarius (its diurnal home) and Pisces (its nocturnal home), connecting it to both the quest for intellectual truth and the yearning for spiritual transcendence. Through Sagittarius, Jupiter expresses as the philosopher, the traveler, and the teacher who seeks wisdom through direct experience. Through Pisces, Jupiter manifests as compassion, spiritual faith, and the recognition that all beings are connected. This dual rulership makes Jupiter the bridge between knowledge and wisdom, between understanding and compassion.

As the largest planet in our solar system, Jupiter reflects the principle of expansion in all its forms — physical growth, intellectual broadening, financial increase, and spiritual evolution. However, Jupiter's expansive nature can also manifest as excess, overindulgence, or blind optimism if not tempered by the discipline of Saturn. The balance between Jupiter and Saturn — between growth and structure, faith and realism — is one of the fundamental dynamics in any birth chart.

Jupiter spends approximately one year in each sign, making it a generational marker for twelve-year age groups. Its house placement and aspects are highly personal and reveal where your greatest opportunities for growth and fulfillment lie.`,
    inSigns: `Jupiter through the signs shapes your philosophy, your sense of faith, and the style in which you pursue growth. In fire signs (Aries, Leo, Sagittarius), Jupiter is enthusiastic, confident, and bold in its quest for expansion. Jupiter in Sagittarius — its own sign — is the archetype of the teacher, explorer, and philosopher. In Leo, Jupiter radiates creative generosity. In Aries, Jupiter is the pioneer who grows through courageous action.

In earth signs (Taurus, Virgo, Capricorn), Jupiter seeks tangible, practical growth — wealth building, skill mastery, and measurable achievement. Jupiter in Capricorn (its fall) must work harder for expansion but can achieve lasting results through discipline. Air signs (Gemini, Libra, Aquarius) expand through ideas, social connection, and intellectual exploration. Water signs bring emotional and spiritual depth to Jupiter's quest — Cancer (its exaltation) expands through nurturing and family, Scorpio through psychological transformation, and Pisces through spiritual devotion and universal compassion.`,
    inHouses: `Jupiter's house placement reveals where you experience the greatest growth, luck, and abundance. In the First House, Jupiter expands the personality, creating an optimistic and generous nature. In the Second House, it attracts financial abundance. In the Ninth House — its natural domain — Jupiter brings extraordinary opportunities through education, travel, and philosophical pursuits. In the Tenth House, Jupiter promotes career success and public recognition.

Jupiter in angular houses brings visibly abundant blessings — these individuals are often recognized as lucky, optimistic, and successful in the eyes of the world. In succedent houses, Jupiter builds wealth and resources over time through sustained optimism and wise investment. In cadent houses, Jupiter expands the mind, promoting lifelong learning, spiritual growth, and the ability to find meaning and opportunity in every situation.`,
    mythology: `Jupiter (Greek: Zeus) was the king of the Olympian gods, ruler of the heavens, and the bringer of justice and cosmic order. Zeus overthrew his father Kronos (Saturn) to establish a new era of divine governance, symbolizing Jupiter's astrological role as the force that expands beyond Saturn's limitations. Zeus was known for his generosity, his love of freedom, and his many love affairs — reflecting Jupiter's association with abundance, pleasure, and the sometimes excessive pursuit of experience.

In Vedic astrology, Jupiter is Guru or Brihaspati — the teacher of the gods, the preceptor of divine wisdom. This association with the guru principle emphasizes Jupiter's role not just as the bringer of luck, but as the bestower of wisdom, moral guidance, and spiritual understanding. Jupiter represents the part of us that seeks to understand the grand design of the universe and to grow toward our highest potential.`,
    retrogradeGuide: `Jupiter retrogrades annually for approximately four months, making it a relatively common retrograde that affects everyone on a regular cycle. During Jupiter retrograde, the normally outward-expanding energy of the planet turns inward. External opportunities may slow down, but internal growth accelerates. This is an excellent time for deepening your philosophical understanding, revisiting educational goals, and reflecting on whether your current path of expansion is truly aligned with your values.

Jupiter retrograde is not a time of bad luck, but rather a period when the universe asks you to grow inwardly rather than outwardly. Spiritual practices, reading, journaling, and quiet reflection are favored. You may reassess your beliefs, question assumptions you have taken for granted, and develop a more mature, personally tested faith. When Jupiter stations direct, the insights gained during the retrograde period become fuel for a new phase of outward expansion and opportunity.`,
    faqs: [
      {
        question: 'Is Jupiter always beneficial in astrology?',
        answer: 'Jupiter is traditionally the great benefic, but its expansive energy can also manifest as excess, overconfidence, or overindulgence. A challenging Jupiter aspect might bring opportunities that overwhelm, or growth in areas where more restraint would be wise. Jupiter\'s gifts are most positive when balanced with Saturn\'s discipline.',
      },
      {
        question: 'What is a Jupiter return?',
        answer: 'A Jupiter return occurs when transiting Jupiter returns to the same position it held at your birth, approximately every 12 years (ages 12, 24, 36, 48, etc.). These are periods of renewal, opportunity, and the beginning of new growth cycles. Each Jupiter return opens a fresh chapter of expansion.',
      },
      {
        question: 'How long does Jupiter stay in each sign?',
        answer: 'Jupiter spends approximately one year in each zodiac sign, taking about 12 years to complete a full cycle through all twelve signs. This makes your Jupiter sign a generational marker shared with people born within the same year.',
      },
      {
        question: 'Does Jupiter in my birth chart show where I am lucky?',
        answer: 'Jupiter\'s house placement and sign do indicate areas of natural abundance and ease. However, "luck" with Jupiter is better understood as the ability to recognize and seize opportunities, maintain optimism, and trust the process of growth. Jupiter rewards faith with expansion.',
      },
    ],
  },
  {
    slug: 'saturn',
    name: 'Saturn',
    symbol: '♄',
    type: 'social',
    ruledSigns: ['Capricorn', 'Aquarius'],
    ruledSignSlugs: ['capricorn', 'aquarius'],
    exaltation: 'Libra',
    detriment: 'Cancer',
    fall: 'Aries',
    orbitalPeriod: '29.5 years',
    retrograde: 'Saturn retrogrades annually for about 4.5 months. Saturn retrograde internalizes the themes of discipline, responsibility, and karmic lessons, making it a period for restructuring from within.',
    keywords: ['Discipline', 'Structure', 'Responsibility', 'Limitation', 'Maturity', 'Karma'],
    overview: `Saturn is the great teacher of the zodiac — the planet of discipline, structure, limitation, and the hard-won wisdom that comes through time, effort, and experience. Named after the Roman god of time and agriculture, Saturn governs your relationship with authority, your sense of duty and responsibility, your ambitions in the material world, and the lessons you must master in order to achieve lasting success. Where Jupiter expands, Saturn contracts; where Jupiter promises, Saturn delivers — but only after requiring the work.

Saturn rules Capricorn (its diurnal home) and Aquarius (its nocturnal home), connecting it to both worldly achievement and social responsibility. Through Capricorn, Saturn builds the structures, institutions, and hierarchies that organize society. Through Aquarius, Saturn establishes the rules and principles that govern collective life and social progress. This dual rulership reveals that Saturn is not merely the restrictor but the architect — the force that gives form to vision and substance to dreams.

Saturn's cycle of approximately twenty-nine and a half years creates the most important timing cycle in astrology: the Saturn return. Occurring around ages 29, 58, and 87, the Saturn return marks periods of profound maturation, accountability, and the restructuring of your life around what is real and sustainable. Many people describe their first Saturn return as the true beginning of adulthood — the moment when you stop living according to others' expectations and start building your own authentic life.

In the body, Saturn governs the skeletal system, the skin, the teeth, and the knees. In mundane astrology, Saturn represents the government, authority, tradition, and the established order. Saturn may be feared, but it is ultimately the planet that builds your life into something that endures.`,
    inSigns: `Saturn through the signs describes the nature of your deepest challenges and the qualities you must develop through discipline and time. In fire signs (Aries, Leo, Sagittarius), Saturn challenges you to temper impulsiveness with patience and to earn the confidence and authority you seek. Saturn in Aries (its fall) must learn to act with discipline rather than react impulsively. In Leo, Saturn develops authentic leadership through humility. In Sagittarius, Saturn tests beliefs through real-world experience.

In earth signs (Taurus, Virgo, Capricorn), Saturn is in its element — building real, tangible structures through steady effort. Saturn in Capricorn — its own sign — is the master builder, achieving through patience and strategic planning. Air signs present Saturn with challenges around communication, relationship, and social responsibility. Saturn in Libra (its exaltation) develops the highest form of fairness and partnership wisdom. Water signs ask Saturn to structure emotions and develop emotional maturity — Cancer Saturn (its detriment) particularly struggles to balance vulnerability with responsibility.`,
    inHouses: `Saturn's house placement reveals the life area where you face your greatest challenges and ultimately achieve your most significant accomplishments. In the First House, Saturn builds a disciplined, responsible personality through early hardship. In the Fourth House, family responsibilities and emotional foundations require serious attention. In the Seventh House, partnership requires patience and commitment. In the Tenth House — Saturn's natural domain — career achievement comes through sustained effort and earned authority.

Saturn in angular houses creates visibly structured, ambitious individuals who take responsibility seriously in their public life. In succedent houses, Saturn builds slowly but surely in matters of resources (2nd), creative discipline (5th), deep transformation (8th), or social responsibility (11th). In cadent houses, Saturn brings seriousness and depth to communication (3rd), health and daily routine (6th), education and belief (9th), or spiritual practice and inner work (12th).`,
    mythology: `Saturn (Greek: Kronos) was the titan who ruled during the Golden Age, a mythical era of peace and abundance. Kronos devoured his own children to prevent the prophecy that he would be overthrown — a powerful symbol of time consuming all things and the fear of being superseded. When Zeus (Jupiter) eventually overthrew Kronos, the myth symbolizes the necessary transcendence of limitation through growth and the courage to claim your own authority.

In Roman culture, Saturn was honored during Saturnalia, the winter festival of liberation and reversal — slaves and masters exchanged roles, gifts were given, and social hierarchy was temporarily dissolved. This tradition reveals a deeper truth about Saturn: through fully accepting its discipline and limitations, one ultimately achieves genuine freedom. Saturn's lesson is paradoxical — by embracing restriction, you discover what is truly essential and build a life of authentic substance and enduring value.`,
    retrogradeGuide: `Saturn retrogrades annually for approximately four and a half months — nearly a third of the year. During Saturn retrograde, the external structures and responsibilities of your life turn inward for reassessment. You may feel the weight of responsibilities more heavily, question your career direction, or revisit commitments you have made. Saturn retrograde is not a time when discipline fails but rather when you must examine whether you are building the right structures in your life.

The constructive use of Saturn retrograde involves honest self-assessment. Are your goals realistic? Are the structures you have built serving your authentic self or merely meeting external expectations? This is an excellent period for internal restructuring — reorganizing your priorities, releasing commitments that no longer serve you, and developing a more mature relationship with authority, time, and responsibility. When Saturn stations direct, you are better equipped to move forward with a clearer sense of what truly deserves your long-term effort.`,
    faqs: [
      {
        question: 'What is a Saturn return and why does it matter?',
        answer: 'The Saturn return occurs when transiting Saturn returns to its natal position, approximately every 29.5 years. The first Saturn return (ages 28-30) marks the transition into true adulthood. It is a period of reckoning where you are called to take responsibility for your life and build something authentic.',
      },
      {
        question: 'Is Saturn always negative in astrology?',
        answer: 'Saturn is challenging but deeply rewarding. While it brings restriction, delay, and hard lessons, it also gives structure, discipline, and lasting achievement. The areas where Saturn pushes you hardest are often where you ultimately build your greatest accomplishments.',
      },
      {
        question: 'How does Saturn affect my career?',
        answer: 'Saturn governs career ambition, authority, and professional reputation. Its natal placement shows where you must earn your way through discipline and effort. Saturn transits to career-related houses and planets often mark significant professional milestones — promotions, changes, or increased responsibility.',
      },
      {
        question: 'What does it mean to have Saturn in my First House?',
        answer: 'Saturn in the First House often indicates early life challenges with self-confidence, health, or identity that ultimately forge a strong, disciplined, and mature personality. These individuals often look younger as they age and come into their power in the second half of life.',
      },
    ],
  },
  {
    slug: 'uranus',
    name: 'Uranus',
    symbol: '♅',
    type: 'transpersonal',
    ruledSigns: ['Aquarius'],
    ruledSignSlugs: ['aquarius'],
    exaltation: 'Scorpio',
    detriment: 'Leo',
    fall: 'Taurus',
    orbitalPeriod: '84 years',
    retrograde: 'Uranus retrogrades annually for about five months. Uranus retrograde internalizes the urge for freedom and revolution, making it a period for internal breakthroughs rather than external rebellion.',
    keywords: ['Revolution', 'Innovation', 'Freedom', 'Awakening', 'Disruption', 'Originality'],
    overview: `Uranus is the great awakener of the zodiac — the planet of revolution, innovation, sudden change, and the lightning bolt of insight that shatters old structures to make way for the new. Discovered in 1781, coinciding with the American and French Revolutions, Uranus embodies the spirit of radical change, individual freedom, and the relentless march of progress. In the birth chart, Uranus reveals where you are most original, where you resist conformity, and the areas of life where unexpected changes serve to liberate you from outgrown patterns.

Uranus rules Aquarius, the sign of the visionary, the humanitarian, and the eccentric individualist. Through this association, Uranus governs technology, science, social reform, and all forms of collective awakening. It is the planet of genius — the sudden flash of insight that comes from nowhere and changes everything. Uranus energy is electric, unpredictable, and impossible to control, which is precisely the point: Uranus teaches that true freedom requires the willingness to let go of security and embrace the unknown.

Because Uranus takes approximately eighty-four years to orbit the Sun, spending about seven years in each sign, it is considered a generational planet. Your Uranus sign describes the area of collective revolution that defines your generation's approach to progress and innovation. However, Uranus's house placement and aspects to personal planets create highly individual experiences of awakening, disruption, and liberation.

In the body, Uranus governs the nervous system, the ankles, and the bioelectric field. In mundane astrology, Uranus represents technology, innovation, earthquakes, revolutions, and the collective urge for freedom.`,
    inSigns: `Uranus through the signs describes generational approaches to revolution and innovation. Because Uranus spends approximately seven years in each sign, entire age cohorts share the same Uranus sign. Uranus in fire signs (Aries, Leo, Sagittarius) drives revolutionary courage, creative disruption, and the quest for individual freedom. Uranus in Aries (2010-2018) brought a wave of radical individualism and technological self-empowerment. In earth signs, Uranus disrupts material and environmental systems — Uranus in Taurus (2018-2026) is revolutionizing finance, agriculture, and our relationship with the planet.

Air signs amplify Uranus's natural affinity for ideas and social change — Uranus in Aquarius (its own sign) produces generations particularly gifted in technology and collective organizing. Water signs channel Uranus through emotional and spiritual revolution — Uranus in Pisces (2003-2010) disrupted spiritual institutions and brought mystical experiences into the mainstream through technology and social media. The personal impact of your Uranus sign is best understood through its house placement and aspects.`,
    inHouses: `Uranus's house placement shows where you are most original, rebellious, and prone to sudden change. In the First House, Uranus creates a uniquely individualistic personality — these people stand out and refuse to conform. In the Fourth House, home life is unconventional and may involve frequent disruptions or unusual living arrangements. In the Seventh House, relationships require freedom and may follow unconventional patterns. In the Tenth House, the career path is non-traditional and may involve technology, innovation, or social reform.

In angular houses, Uranus's disruptive energy is prominently visible in the person's life. In succedent houses, Uranus revolutionizes resources (2nd), creative expression (5th), shared intimacy (8th), or social circles (11th — its natural domain). In cadent houses, Uranus brings innovative thinking (3rd), unconventional health approaches (6th), revolutionary philosophy (9th), or spiritual awakening (12th).`,
    mythology: `Uranus (Greek: Ouranos) was the primordial sky god, the first ruler of the cosmos, and the father of the Titans. He was castrated by his son Kronos (Saturn) with a sickle, and from his blood and the sea foam, Aphrodite (Venus) was born. This violent myth symbolizes the revolutionary principle that Uranus embodies: old structures must be disrupted — sometimes violently — for new beauty and new possibilities to emerge. The overthrow of Ouranos by Kronos, and later Kronos by Zeus, represents the cosmic cycle of revolution and change.

The discovery of Uranus in 1781 by William Herschel coincided with a period of unprecedented global revolution — the American Revolution, the French Revolution, and the dawn of the Industrial Revolution. This synchronicity perfectly captures Uranus's astrological meaning: the sudden, irreversible breakthrough that changes the course of history and consciousness. Uranus reminds us that progress often comes through disruption, and that the freedom to evolve requires the courage to break with the past.`,
    retrogradeGuide: `Uranus retrogrades annually for approximately five months, meaning it is retrograde nearly half the year. During Uranus retrograde, the urge for external change and rebellion turns inward. Rather than making dramatic breaks with the past, this period favors internal revolution — examining where you have been conforming unconsciously, identifying the beliefs and habits that keep you stuck, and preparing for the changes you will make when Uranus stations direct.

Uranus retrograde can feel frustrating if you are eager for change, as external progress may stall or take unexpected turns. However, the internal breakthroughs that occur during this period are often more profound than any external disruption. Many people experience sudden insights, shifts in perspective, or the quiet dissolution of beliefs they once held unquestioningly. When Uranus stations direct, these internal revolutions become the foundation for decisive, authentic action in the outer world.`,
    faqs: [
      {
        question: 'What is the Uranus opposition and why is it significant?',
        answer: 'The Uranus opposition occurs around age 42, when transiting Uranus reaches the point directly opposite its natal position. This is a classic "midlife crisis" transit that prompts a reevaluation of the life you have built and a desire for greater authenticity and freedom. It is a crucial awakening point.',
      },
      {
        question: 'Does Uranus always bring negative disruption?',
        answer: 'Uranus brings change, which can feel disruptive in the moment but is ultimately liberating. Sudden job changes, relationship shifts, or life upheavals triggered by Uranus often lead to greater freedom and authenticity. The key is to remain flexible and open to new possibilities.',
      },
      {
        question: 'How does Uranus differ from other outer planets?',
        answer: 'Uranus operates through sudden, electric breakthroughs and external disruption. Neptune works through gradual dissolution and spiritual transcendence. Pluto transforms through intensity, crisis, and deep psychological change. Each outer planet facilitates evolution, but through very different mechanisms.',
      },
      {
        question: 'What does it mean to have Uranus prominent in my chart?',
        answer: 'A prominent Uranus — conjunct an angle, the Sun, or the Moon — indicates someone who is naturally innovative, independent, and often ahead of their time. These individuals may feel like outsiders but ultimately serve as catalysts for change in their communities.',
      },
    ],
  },
  {
    slug: 'neptune',
    name: 'Neptune',
    symbol: '♆',
    type: 'transpersonal',
    ruledSigns: ['Pisces'],
    ruledSignSlugs: ['pisces'],
    exaltation: 'Cancer',
    detriment: 'Virgo',
    fall: 'Capricorn',
    orbitalPeriod: '164.8 years',
    retrograde: 'Neptune retrogrades annually for about five months. Neptune retrograde lifts the fog slightly, allowing you to see through illusions and gain clarity about spiritual and creative matters.',
    keywords: ['Spirituality', 'Imagination', 'Illusion', 'Compassion', 'Transcendence', 'Dreams'],
    overview: `Neptune is the planet of dreams, spirituality, imagination, and the dissolving of boundaries between self and the infinite. Named after the Roman god of the sea, Neptune governs everything that is formless, boundless, and beyond the reach of rational understanding — mystical experience, artistic inspiration, unconditional love, psychic sensitivity, and the yearning to merge with something greater than the individual self. Neptune is the mist that softens hard edges and the ocean that dissolves all distinctions.

Neptune rules Pisces, the final sign of the zodiac, which represents the dissolution of individual identity into universal consciousness. Through this association, Neptune governs the arts (especially music, film, and photography), spirituality and mysticism, hospitals and institutions of compassion, and all substances and experiences that alter consciousness. Neptune's gifts are extraordinary — boundless creativity, profound empathy, and spiritual illumination — but they come with the risk of escapism, delusion, addiction, and the loss of boundaries.

Discovered in 1846, Neptune was found during a period of rising Romanticism, the growth of photography and anesthesia, and the expansion of utopian socialist movements — all perfectly Neptunian themes. As the second transpersonal planet, Neptune operates primarily on the collective level, spending approximately fourteen years in each sign and creating generational experiences of spiritual and cultural evolution.

Neptune's challenge is discernment. In a Neptune-influenced life, the task is to access the transcendent without losing touch with reality, to open the heart without losing the self, and to channel creative inspiration into tangible form. Understanding Neptune in your chart reveals where you are most inspired, most vulnerable, and most capable of touching the divine.`,
    inSigns: `Neptune through the signs describes generational spiritual and cultural trends. Because Neptune spends approximately fourteen years in each sign, entire generations share the same Neptune sign. In fire signs, Neptune inspires spiritual idealism and creative vision on a grand scale. In earth signs, Neptune dissolves material certainties — Neptune in Capricorn (1984-1998) eroded trust in traditional institutions. Neptune in Taurus dissolves attachment to material security, often coinciding with financial crises.

Air signs channel Neptune through ideas and communication — Neptune in Aquarius (1998-2012) brought the dissolution of information boundaries through the internet and social media. Neptune in Libra (1942-1957) idealized partnership and created the collective romantic ideals that defined postwar culture. Water signs amplify Neptune's natural affinity for emotion and intuition — Neptune in Pisces (2011-2026) represents the purest expression of Neptunian energy, bringing a collective spiritual awakening alongside widespread confusion, escapism, and the blurring of truth and fiction.`,
    inHouses: `Neptune's house placement reveals where you experience inspiration, idealization, and the potential for both transcendence and confusion. In the First House, Neptune creates an ethereal, chameleon-like personality that absorbs the energies of the environment. In the Fourth House, home life may be idealized or confused, with family secrets or spiritual influences shaping the domestic atmosphere. In the Seventh House, partnerships are idealized and may involve sacrifice or disillusionment. In the Tenth House, the career path may involve art, healing, or spiritual service, but professional direction can be unclear.

In angular houses, Neptune's dissolving influence is visible in the major areas of life. In succedent houses, Neptune affects resources (2nd — financial confusion or spiritual values), creativity (5th — extraordinary artistic gifts), intimacy (8th — boundary dissolution in deep relationships), or social ideals (11th — utopian visions for the future). In cadent houses, Neptune enhances imagination in communication (3rd), healing sensitivity in daily life (6th), spiritual seeking (9th), or the mystical inner life (12th — its most natural placement).`,
    mythology: `Neptune (Greek: Poseidon) was the god of the sea, earthquakes, and horses — ruler of the vast, unpredictable ocean that surrounded and permeated the ancient world. Poseidon's domain was everything beneath the surface, both literally (the ocean depths) and figuratively (the unconscious, the hidden, the unknown). His trident symbolized his triple power over the seas, and his moods — calm or tempestuous — reflected the ocean's unpredictable nature.

The mythological association between Neptune and the sea perfectly captures the planet's astrological meaning. The ocean dissolves all boundaries, contains infinite depth, and reflects whatever light falls upon its surface. Neptune in astrology operates the same way — dissolving the boundaries of the ego, revealing the infinite depths of the unconscious, and reflecting the divine light of spiritual reality. The danger of Neptune, like the sea, is drowning — losing yourself in the boundless waters of illusion, addiction, or escapism.`,
    retrogradeGuide: `Neptune retrogrades annually for approximately five months. During this period, the planet's normally outward-dissolving energy turns inward. The veil of illusion thins slightly, and you may gain clarity about situations where you have been deceiving yourself or being deceived. Neptune retrograde is an excellent time for spiritual practice, creative reflection, and honest assessment of where idealism has crossed the line into escapism.

The subtle nature of Neptune retrograde means its effects are often felt more in retrospect than in the moment. You may gradually realize that a relationship, job, or belief system is not what it appeared to be. Creative projects that felt inspired may need grounding in practical reality. Addictive patterns may become more visible. When Neptune stations direct, the insights gained during retrograde can help you navigate the Neptunian realms with greater wisdom and discernment, accessing inspiration without losing your footing in reality.`,
    faqs: [
      {
        question: 'Does Neptune indicate psychic ability?',
        answer: 'Neptune is strongly associated with psychic sensitivity, intuition, and the ability to perceive beyond the five senses. A prominent Neptune — especially conjunct the Moon, Ascendant, or Midheaven — often indicates heightened psychic receptivity. However, developing this sensitivity constructively requires grounding and discernment.',
      },
      {
        question: 'Is Neptune connected to addiction?',
        answer: 'Neptune governs all forms of escape from ordinary reality, including substances, fantasies, and compulsive behaviors. A stressed Neptune can indicate vulnerability to addiction, but this same sensitivity can also fuel extraordinary creative and spiritual gifts when channeled constructively.',
      },
      {
        question: 'How does Neptune affect relationships?',
        answer: 'Neptune in relationship contexts brings idealization, romance, and deep spiritual connection, but also the risk of seeing what you want to see rather than what is actually there. Neptune can create soulmate experiences but also codependency and disillusionment when the fog lifts.',
      },
      {
        question: 'What does it mean to have a strong Neptune in my chart?',
        answer: 'A prominent Neptune indicates heightened sensitivity to music, art, spirituality, and the emotions of others. You may be naturally creative, empathic, and drawn to healing or artistic work. The challenge is maintaining boundaries and staying grounded while honoring your sensitivity.',
      },
    ],
  },
  {
    slug: 'pluto',
    name: 'Pluto',
    symbol: '♇',
    type: 'transpersonal',
    ruledSigns: ['Scorpio'],
    ruledSignSlugs: ['scorpio'],
    exaltation: 'Aries',
    detriment: 'Taurus',
    fall: 'Libra',
    orbitalPeriod: '248 years',
    retrograde: 'Pluto retrogrades annually for about five months. Pluto retrograde internalizes the transformative process, inviting deep psychological work and the confrontation of inner power dynamics.',
    keywords: ['Transformation', 'Power', 'Rebirth', 'Intensity', 'Shadow', 'Regeneration'],
    overview: `Pluto is the planet of profound transformation, power, death, and rebirth — the force that destroys what is decayed and outworn so that something more authentic and powerful can take its place. Named after the Roman god of the underworld, Pluto governs the deepest psychological processes: the confrontation with the shadow self, the experience of crisis as a catalyst for evolution, and the phoenix-like capacity for regeneration that exists within every human being. Pluto does not make gentle suggestions — it demands transformation.

Pluto rules Scorpio, the sign of intensity, depth, and the willingness to descend into the darkness in search of truth. Through this association, Pluto governs the taboo, the hidden, and the profound — death, sexuality, power dynamics, psychological manipulation, shared resources, and the mysteries that lie beneath the surface of polite society. Pluto energy is not comfortable, but it is authentic. It strips away pretense, reveals hidden motivations, and forces confrontation with realities that other planetary energies might prefer to avoid.

Discovered in 1930, coinciding with the rise of psychoanalysis, nuclear power, totalitarianism, and organized crime, Pluto's cultural context perfectly reflects its astrological meaning. It is the atomic energy of the psyche — immensely powerful, potentially destructive, and capable of generating extraordinary transformation when harnessed consciously. Pluto's orbit is the longest of any planetary body used in astrology, taking approximately 248 years to complete a full cycle. Its influence operates on the deepest collective level, shaping the evolutionary agenda of entire civilizations.

Understanding Pluto in your chart reveals where you have the capacity for the most profound personal transformation, where you may encounter power struggles, and where your greatest evolutionary potential lies.`,
    inSigns: `Pluto through the signs describes generational experiences of collective transformation. Due to its elliptical orbit, Pluto spends between twelve and thirty years in each sign, creating broad generational cohorts. Pluto in fire signs drives transformations of identity, creative expression, and leadership. Pluto in Leo (1937-1958) transformed entertainment, creativity, and the concept of personal power. Pluto in Sagittarius (1995-2008) transformed religion, travel, and higher education.

Earth signs bring Plutonian transformation to material reality and institutions. Pluto in Virgo (1956-1972) transformed health care, work, and daily life. Pluto in Capricorn (2008-2024) demolished and rebuilt governmental and corporate structures worldwide. Air signs channel Pluto through ideas and social systems — Pluto in Libra (1971-1984) transformed marriage, partnerships, and gender relations. Pluto in Aquarius (2023-2044) is bringing transformation to technology, social structures, and collective consciousness. Water signs intensify Pluto's psychological and emotional impact — Pluto in Scorpio (1983-1995) was the most intense expression, creating a generation deeply attuned to psychological truth, power dynamics, and cultural taboos.`,
    inHouses: `Pluto's house placement reveals where you experience the most intense transformation and where power dynamics play out most dramatically. In the First House, Pluto creates a magnetic, intense personality capable of profound self-reinvention. In the Fourth House, family dynamics are intensely transformative and may involve secrets or power struggles. In the Seventh House, partnerships are deeply transformative and may involve power dynamics that demand evolution. In the Eighth House — its natural domain — Pluto's power is at maximum intensity, driving toward psychological depth and transformation.

In angular houses, Pluto's transformative power is visible and unavoidable — these individuals often serve as agents of change in their environment. In succedent houses, Pluto transforms resources (2nd), creative expression (5th), shared intimacy (8th), or group dynamics (11th). In cadent houses, Pluto drives transformation through communication (3rd), health crisis and regeneration (6th), philosophical revolution (9th), or deep spiritual transformation and shadow work (12th).`,
    mythology: `Pluto (Greek: Hades) was the ruler of the underworld — the realm of the dead, of hidden wealth, and of the unconscious. Unlike the fearsome, evil figure of popular imagination, Hades in Greek mythology was a solemn, just ruler who presided over the necessary processes of death, transformation, and the recycling of souls. His abduction of Persephone and her subsequent role as Queen of the Underworld is one of the most powerful myths in astrology, symbolizing the descent into darkness that precedes rebirth, and the integration of light and shadow that constitutes true wholeness.

The name Pluto actually means "the wealthy one," reflecting the ancient understanding that the greatest riches lie hidden beneath the surface — in the earth, in the psyche, and in the depths of human experience. Pluto's astrological symbolism draws on this mythological depth: true power comes not from dominating others but from the willingness to descend into your own underworld, confront what lies buried there, and emerge transformed.`,
    retrogradeGuide: `Pluto retrogrades annually for approximately five months, making it retrograde nearly half the year. During Pluto retrograde, the normally outward-expressing transformative energy turns inward. External power dynamics may shift or temporarily ease, but the real work of transformation moves to the psychological level. This is a powerful time for therapy, shadow work, and confronting the unconscious patterns that control your behavior from below the surface of awareness.

Pluto retrograde often coincides with the resurfacing of deep psychological material — memories, emotions, and patterns that you thought you had resolved may return for a deeper level of processing. This is not regression but rather the spiral nature of transformation: each time you revisit core material, you do so with greater awareness and capacity for integration. When Pluto stations direct, the internal transformations crystallize into tangible changes in your external life — power dynamics shift, old structures fall away, and the new growth that began in the underground makes its way into the light.`,
    faqs: [
      {
        question: 'Is Pluto still considered a planet in astrology?',
        answer: 'Yes. While astronomers reclassified Pluto as a dwarf planet in 2006, astrologers continue to use Pluto as a major planetary body. Its effects in the birth chart and by transit remain among the most powerful and transformative in astrological practice.',
      },
      {
        question: 'What is a Pluto transit and how long does it last?',
        answer: 'Pluto transits are the longest of any planet, potentially lasting two to three years when Pluto aspects a natal planet. These transits are associated with profound, life-changing transformation in the areas of life governed by the contacted planet and house.',
      },
      {
        question: 'Does Pluto indicate obsession?',
        answer: 'Pluto is associated with intensity, compulsion, and obsession — the drive to penetrate to the core of any matter. These tendencies can manifest as unhealthy obsession if unconscious, but when channeled constructively, they become the focused power that drives deep research, healing work, and transformative achievement.',
      },
      {
        question: 'How does Pluto in Aquarius affect the world?',
        answer: 'Pluto in Aquarius (2023-2044) brings transformation to technology, social structures, democracy, and collective consciousness. This transit is expected to revolutionize artificial intelligence, decentralize power structures, and fundamentally reshape how humanity organizes itself socially and technologically.',
      },
    ],
  },
  {
    slug: 'chiron',
    name: 'Chiron',
    symbol: '⚷',
    type: 'point',
    ruledSigns: ['Virgo'],
    ruledSignSlugs: ['virgo'],
    exaltation: 'Sagittarius',
    detriment: 'Pisces',
    fall: 'Gemini',
    orbitalPeriod: '50.7 years',
    retrograde: 'Chiron retrogrades annually for about five months. Chiron retrograde turns the healing journey inward, inviting you to revisit old wounds with greater compassion and understanding.',
    keywords: ['Wound', 'Healing', 'Teaching', 'Bridge', 'Vulnerability', 'Wisdom'],
    overview: `Chiron is known as the "Wounded Healer" — a small celestial body orbiting between Saturn and Uranus that represents your deepest wound and your greatest capacity for healing. Discovered in 1977, Chiron occupies a unique position in astrology as a bridge between the personal planets (Saturn and inward) and the transpersonal planets (Uranus and outward). This bridge function is central to Chiron's meaning: it connects the personal experience of suffering with the transpersonal gift of healing wisdom.

In the birth chart, Chiron's sign and house placement reveal the nature of your core wound — a deep, often early-life experience of pain, inadequacy, or alienation that never fully heals but becomes the source of your greatest wisdom and ability to help others. The paradox of Chiron is that the wound you cannot fully heal in yourself becomes the very thing that enables you to heal others. This is not a punishment but a gift: through your own suffering, you develop the empathy, insight, and skill to guide others through similar pain.

Chiron's orbital period of approximately fifty years means the Chiron return — occurring around age fifty — is a significant milestone marking a deep reassessment of your relationship with wounding and healing. This transit often brings a renewed commitment to the healing work that your wound has prepared you for, along with greater acceptance and integration of the vulnerability that Chiron represents.

Chiron in the chart does not promise an easy life, but it does promise meaning. The areas of life touched by Chiron are where you feel most vulnerable but also where you have the most to offer. Understanding your Chiron placement can transform your relationship with suffering, revealing the hidden purpose in your pain and the healer that lives within your wound.`,
    inSigns: `Chiron through the signs describes the generational flavor of the wound-healing dynamic. Because Chiron spends between two and eight years in each sign (its orbit is highly eccentric), different generations carry different collective wounds. Chiron in fire signs (Aries, Leo, Sagittarius) creates wounds around identity, self-expression, and the right to exist boldly. Chiron in Aries specifically wounds the sense of self and personal courage, while Chiron in Leo wounds creative confidence and the ability to receive love.

In earth signs (Taurus, Virgo, Capricorn), Chiron wounds relate to material security, physical embodiment, and worldly achievement. Chiron in Virgo may manifest as wounds around health, perfectionism, or feeling useful. Air signs (Gemini, Libra, Aquarius) carry Chiron wounds related to communication, relationship, and belonging. Chiron in Gemini may create difficulties with learning or self-expression, while Chiron in Aquarius wounds the sense of belonging to the collective. Water signs (Cancer, Scorpio, Pisces) carry the deepest emotional Chiron wounds — related to family, intimacy, and spiritual connection.`,
    inHouses: `Chiron's house placement reveals the specific life area where your wound manifests and where your healing gifts emerge. In the First House, the wound relates to self-image and personal identity — but you become someone who helps others find their authentic self. In the Fourth House, family wounds run deep, but you develop extraordinary ability to heal family dynamics. In the Seventh House, partnership wounds teach you to facilitate healing in others' relationships. In the Tenth House, career wounds eventually produce a healer, teacher, or guide in the public sphere.

In angular houses, Chiron's wound and healing gifts are prominent and visible to others. In succedent houses, Chiron works through resources (2nd), creativity (5th), shared intimacy (8th), or community (11th). In cadent houses, Chiron channels its healing wisdom through communication and teaching (3rd), daily service and health practices (6th), philosophy and mentorship (9th), or spiritual healing and the unconscious (12th).`,
    mythology: `In Greek mythology, Chiron was a centaur — half-human, half-horse — but unlike the wild, unruly centaurs, Chiron was wise, civilized, and compassionate. He was the tutor of heroes including Achilles, Asclepius (the god of medicine), and Heracles. Chiron taught medicine, music, prophecy, and the art of archery. Despite his extraordinary healing abilities, Chiron was wounded by a poisoned arrow from Heracles — and because he was immortal, his wound could never heal. He suffered endlessly until he chose to exchange his immortality for the freedom of Prometheus.

This myth is the perfect encapsulation of Chiron's astrological meaning: the healer who cannot heal himself, the teacher whose deepest wisdom comes from his own suffering, and the one who ultimately transforms his wound into a gift for humanity. Chiron's story teaches that some wounds are not meant to be cured — they are meant to be carried with grace and transformed into the capacity to alleviate the suffering of others. The wounded healer is one of the most powerful archetypes in human experience, and Chiron brings this archetype to life in the birth chart.`,
    retrogradeGuide: `Chiron retrogrades annually for approximately five months, turning the healing journey inward. During Chiron retrograde, old wounds may resurface — not to torment you, but to offer the opportunity for a deeper level of healing and integration. You may find yourself revisiting painful memories, re-examining relationship patterns, or confronting the ways in which your core wound still influences your daily life. This is not regression but the spiral path of healing, where each return to the wound brings greater understanding and self-compassion.

Chiron retrograde is an excellent time for therapy, energy healing, and reflective practices that address deep-seated pain. Rather than seeking external validation or trying to "fix" the wound, this period invites acceptance and the recognition that your vulnerability is actually your greatest strength. When Chiron stations direct, the inner healing work translates into a renewed capacity to serve others from a place of authentic understanding and hard-won wisdom.`,
    faqs: [
      {
        question: 'Is Chiron a planet or an asteroid?',
        answer: 'Chiron is classified as a centaur — a small body orbiting between Saturn and Uranus. It shares characteristics with both asteroids and comets. In astrology, its classification matters less than its powerful symbolic meaning as the wounded healer and bridge between personal and transpersonal experience.',
      },
      {
        question: 'What is a Chiron return?',
        answer: 'The Chiron return occurs around age 50-51, when transiting Chiron returns to its natal position. This is a significant life passage that brings a deep reassessment of your core wound and healing journey. Many people experience a profound shift in their relationship with suffering and their capacity for healing work.',
      },
      {
        question: 'Can Chiron indicate physical health issues?',
        answer: 'Chiron can indicate areas of chronic health sensitivity, particularly when placed in the Sixth House or aspecting health-related points. However, Chiron\'s wound is more commonly psychological or emotional in nature. Physical symptoms may serve as messengers pointing to deeper emotional healing needs.',
      },
      {
        question: 'How does Chiron work in synastry?',
        answer: 'Chiron contacts between two charts often indicate a powerful healing dynamic in the relationship. One person\'s planet touching the other\'s Chiron can activate deep healing — but also deep vulnerability. These relationships serve as catalysts for growth, though they may also trigger painful material that needs attention.',
      },
    ],
  },
  {
    slug: 'north-node',
    name: 'North Node',
    symbol: '☊',
    type: 'point',
    ruledSigns: ['Leo'],
    ruledSignSlugs: ['leo'],
    exaltation: 'Gemini',
    detriment: 'Aquarius',
    fall: 'Sagittarius',
    orbitalPeriod: '18.6 years',
    retrograde: 'The North Node is almost always in retrograde motion, moving backward through the zodiac. This perpetual retrograde reflects its nature as a karmic point that draws us forward by looking to the past.',
    keywords: ['Destiny', 'Growth', 'Purpose', 'Karma', 'Evolution', 'Life direction'],
    overview: `The North Node of the Moon — also called the Dragon's Head or Rahu in Vedic astrology — is not a physical body but a mathematical point where the Moon's orbit crosses the ecliptic moving northward. In astrology, the North Node represents your soul's evolutionary direction — the qualities, experiences, and life themes you are growing toward in this lifetime. It points to unfamiliar territory that feels challenging but ultimately fulfilling, the path of greatest growth and the compass pointing toward your destiny.

The North Node always has an opposite point, the South Node (Dragon's Tail or Ketu), which represents the qualities and patterns you bring from past experience — whether understood as past lives, childhood conditioning, or deeply ingrained habits. The South Node is your comfort zone, the default setting you fall back on when stressed. The North Node is the stretch — the new territory your soul needs to explore for genuine evolution. The tension between these two points creates the fundamental growth axis of your chart.

The Nodes of the Moon move backward through the zodiac, completing a full cycle approximately every eighteen and a half years. This means the nodal return — when the transiting North Node returns to its natal position — occurs around ages 18-19, 37-38, 56-57, and 75. These are pivotal moments of destiny and realignment with your soul's purpose.

Understanding your North Node can bring remarkable clarity to the question "What am I here to do?" It does not describe a career path so much as a quality of being — the way of showing up in the world that brings the deepest fulfillment and contributes most to your spiritual evolution. The North Node is where life rewards you for taking the road less traveled.`,
    inSigns: `The North Node through the signs describes the qualities your soul is growing toward. North Node in fire signs (Aries, Leo, Sagittarius) indicates a destiny involving courage, self-expression, and the development of individual power. The South Node in the opposite air sign represents a default pattern of intellectualizing, people-pleasing, or losing yourself in the collective. North Node in Aries specifically calls for the development of independence and self-assertion; in Leo, for creative self-expression and authentic leadership.

Earth sign North Nodes (Taurus, Virgo, Capricorn) point toward destiny through grounding, practical achievement, and building something tangible. The opposite water sign South Nodes suggest default patterns of emotional dependence or escapism. Air sign North Nodes (Gemini, Libra, Aquarius) call for growth through communication, partnership, and social contribution, with fire sign South Nodes indicating defaults of self-centeredness or impulsiveness. Water sign North Nodes (Cancer, Scorpio, Pisces) direct the soul toward emotional depth, intimacy, and spiritual connection, with earth sign South Nodes suggesting over-attachment to material security.`,
    inHouses: `The North Node's house placement reveals the specific life arena where your soul's growth is directed. In the First House, your destiny involves developing a strong sense of self and personal initiative — moving away from over-dependence on partnerships (South Node in 7th). In the Fourth House, growth comes through building deep emotional roots and a secure home base. In the Seventh House, destiny lies in learning to partner, compromise, and truly see the other person. In the Tenth House, your path leads toward public achievement and taking responsibility for your place in the world.

In angular houses, the North Node places destiny front and center in the most visible areas of life. In succedent houses, growth comes through developing new relationships with resources (2nd), creativity (5th), intimacy and power (8th), or community and vision (11th). In cadent houses, the North Node directs evolution through communication (3rd), service (6th), expanding consciousness (9th), or spiritual surrender and trust (12th).`,
    mythology: `The Nodes of the Moon are described in Hindu mythology as the head and tail of a great dragon or serpent demon called Rahu (North Node) and Ketu (South Node). According to legend, during the churning of the cosmic ocean, the demon Svarbhanu disguised himself among the gods to drink the nectar of immortality. The Sun and Moon detected his deception and alerted Vishnu, who severed the demon with his divine discus — but not before the nectar had been swallowed. The head (Rahu) and tail (Ketu) became immortal, forever pursuing the Sun and Moon across the sky, periodically swallowing them during eclipses.

This myth captures the Nodes' astrological meaning beautifully. Rahu (North Node) is the insatiable head — always hungry, always reaching for more, representing the desires and direction of evolutionary growth. Ketu (South Node) is the headless tail — instinctive, reflexive, and carrying the wisdom (and baggage) of past experience. Together they represent the karmic axis that defines the soul's journey from where it has been to where it is going.`,
    retrogradeGuide: `The North Node is almost always retrograde — moving backward through the zodiac is its natural state. This perpetual retrograde motion is not experienced the same way as a personal planet retrograde. Instead, it reflects the fundamental nature of the Nodes: destiny is found by moving against the grain of habit and comfort. The backward motion symbolizes that growth requires returning to, and integrating, the past rather than simply rushing forward.

When the North Node occasionally stations direct (for very brief periods), there can be a subtle sense of alignment — a feeling that your life is flowing in the direction of your destiny with unusual ease. However, the real work of the Nodes is the perpetual retrograde journey: the continuous process of recognizing old patterns (South Node), releasing attachment to them, and consciously choosing the growth-oriented path of the North Node, even when it feels unfamiliar and uncomfortable.`,
    faqs: [
      {
        question: 'What is the difference between the North Node and the South Node?',
        answer: 'The North Node represents where you are growing toward — your destiny and soul purpose. The South Node (always directly opposite) represents where you come from — past-life gifts and default patterns. Growth comes from moving toward the North Node while wisely integrating, not abandoning, the South Node\'s gifts.',
      },
      {
        question: 'Do the Nodes indicate past lives?',
        answer: 'Many astrologers interpret the Nodes through the lens of reincarnation, with the South Node representing past-life skills and the North Node representing the current life\'s evolutionary direction. Even without a belief in reincarnation, the Nodes describe deep psychological patterns and the direction of greatest personal growth.',
      },
      {
        question: 'What is a nodal return and when does it happen?',
        answer: 'A nodal return occurs approximately every 18.6 years (ages 18-19, 37-38, 56-57, etc.) when the transiting North Node returns to its natal position. These are pivotal moments of destiny, often bringing significant life changes, karmic encounters, and realignment with your soul\'s purpose.',
      },
      {
        question: 'How do eclipses relate to the Nodes?',
        answer: 'Eclipses always occur near the Nodes of the Moon, which is why they are so powerful in astrology. Solar and lunar eclipses activate the nodal axis, accelerating karmic lessons and bringing fated events. Eclipses near your natal Nodes or personal planets are particularly significant turning points.',
      },
    ],
  },
]

export default planets
