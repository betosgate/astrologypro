export interface AstrologicalHouse {
  slug: string
  name: string
  number: number
  nickname: string
  rulingSign: string
  rulingSignSlug: string
  rulingPlanet: string
  rulingPlanetSlug: string
  element: string
  modality: string
  lifeAreas: string[]
  overview: string
  planetsInHouse: string
  signsOnCusp: string
  transits: string
  faqs: { question: string; answer: string }[]
}

const houses: AstrologicalHouse[] = [
  {
    slug: '1st-house',
    name: 'First House',
    number: 1,
    nickname: 'House of Self',
    rulingSign: 'Aries',
    rulingSignSlug: 'aries',
    rulingPlanet: 'Mars',
    rulingPlanetSlug: 'mars',
    element: 'Fire',
    modality: 'Cardinal',
    lifeAreas: [
      'Physical appearance',
      'Self-identity',
      'First impressions',
      'Personal initiative',
      'Vitality and health',
      'Outward personality',
    ],
    overview: `The First House, known as the Ascendant or Rising Sign, is the most personal point in the entire birth chart. It represents the eastern horizon at the exact moment of your birth and sets the stage for every other house that follows. This house governs your physical body, your outward demeanor, and the mask you wear when meeting the world for the first time. It is the lens through which all of your other planetary energies are filtered and expressed.

In traditional astrology, the First House is associated with Aries and its ruler Mars, giving it a quality of initiation, courage, and self-assertion. The sign on your First House cusp — your Rising Sign — shapes how others perceive you before they get to know the deeper layers of your chart. It influences your physical constitution, your general approach to life, and the spontaneous reactions you have to new situations. Many astrologers consider the Rising Sign equally important to the Sun sign in chart interpretation.

The First House is ultimately about identity formation and self-discovery. It answers the fundamental question: "Who am I, and how do I present myself to the world?" Planets placed here gain tremendous prominence in the native's life, often becoming defining features of the personality. A strong First House suggests someone who leads with personal presence, while an empty First House simply means the Rising Sign itself carries the full weight of self-expression.`,
    planetsInHouse: `When planets occupy the First House, they become central to the native's identity and are often visible to others at first glance. The Sun here creates a powerful, self-assured individual whose core identity and outward presentation are closely aligned. The Moon in the First House produces someone emotionally transparent — their feelings are written on their face. Mercury here sharpens the mind and communication style, while Venus bestows physical grace and a naturally charming demeanor. Mars in its natural house amplifies physical energy, competitiveness, and a bold approach to life.

Jupiter in the First House expands the personality, often giving an optimistic and generous disposition along with a larger-than-life presence. Saturn here can indicate early life challenges that build extraordinary discipline and a serious, mature bearing. The outer planets bring generational flavors to the personal identity: Uranus creates the eccentric individualist, Neptune lends an ethereal or elusive quality, and Pluto grants an intense, magnetic presence that others find both compelling and intimidating.

When multiple planets cluster in the First House — known as a stellium — the individual's personality becomes extraordinarily complex and multifaceted. These people often have a strong sense of personal destiny and may feel compelled to forge their own path regardless of external expectations.`,
    signsOnCusp: `The sign on the First House cusp, your Ascendant, is arguably the most important single factor in chart interpretation after the Sun and Moon. Fire signs (Aries, Leo, Sagittarius) on the Ascendant produce individuals who are energetic, direct, and naturally confident in new situations. Earth signs (Taurus, Virgo, Capricorn) create a more grounded, pragmatic first impression — these people appear steady, reliable, and composed. Air signs (Gemini, Libra, Aquarius) on the cusp produce communicative, sociable, and intellectually engaging personalities. Water signs (Cancer, Scorpio, Pisces) rising give an emotionally perceptive, intuitive, and sometimes guarded exterior.

Each Rising Sign also determines the planetary ruler of your entire chart, called the Chart Ruler. For example, a Libra Rising makes Venus your Chart Ruler, and Venus's house placement and aspects become critically important for understanding your life direction. The Ascendant degree is also sensitive to transits and progressions, with major life changes often coinciding with significant planetary contacts to this point.`,
    transits: `Transits through the First House mark periods of personal reinvention and heightened self-awareness. When a slow-moving planet like Saturn crosses your Ascendant and moves through the First House, you may feel a profound call to take yourself more seriously, redefine your goals, and shed anything inauthentic about your self-presentation. Jupiter transiting the First House brings a year of expanded confidence, new opportunities, and often physical changes like a new style or fitness routine.

The outer planet transits through the First House are truly life-altering. Uranus here disrupts your sense of identity and pushes you toward radical authenticity. Neptune dissolving the Ascendant can blur your self-image temporarily, inviting spiritual growth but sometimes confusion about who you really are. Pluto's transit through the First House — which can last over a decade — represents a complete transformation of identity, stripping away old personas and forcing you to confront your deepest truths about who you are and who you are becoming.`,
    faqs: [
      {
        question: 'What does it mean if my First House is empty?',
        answer:
          'An empty First House is completely normal and does not mean you lack personality or self-expression. It simply means the Rising Sign itself carries the full expression of your outward identity without additional planetary influences modifying it. Look to the ruling planet of your Ascendant sign and its placement for more insight.',
      },
      {
        question: 'Is my Rising Sign the same as my First House?',
        answer:
          'Your Rising Sign is the zodiac sign on the cusp (beginning) of your First House. While they are closely related, the First House itself encompasses a range of degrees and may contain planets that further shape your self-expression. The Rising Sign sets the tone, but First House planets add complexity.',
      },
      {
        question: 'How does the First House affect physical appearance?',
        answer:
          'The First House and its ruling sign have traditionally been associated with physical constitution and appearance. The Rising Sign can influence body type, facial features, and overall bearing. Planets in the First House further modify this — Venus may add attractiveness, Mars may give an athletic build, and Saturn can create a lean, angular appearance.',
      },
      {
        question: 'What happens when planets transit my First House?',
        answer:
          'Transiting planets through the First House spotlight your personal identity and self-presentation. Fast-moving transits (Moon, Mercury, Venus) bring brief shifts in mood or style. Slow-moving transits (Saturn, Pluto) bring profound periods of personal transformation that can reshape how you see yourself and how the world sees you.',
      },
    ],
  },
  {
    slug: '2nd-house',
    name: 'Second House',
    number: 2,
    nickname: 'House of Possessions',
    rulingSign: 'Taurus',
    rulingSignSlug: 'taurus',
    rulingPlanet: 'Venus',
    rulingPlanetSlug: 'venus',
    element: 'Earth',
    modality: 'Fixed',
    lifeAreas: [
      'Personal finances',
      'Material possessions',
      'Self-worth and values',
      'Earning capacity',
      'Physical senses',
      'Resource management',
    ],
    overview: `The Second House governs the material dimension of life — your money, possessions, and the resources you accumulate through your own efforts. Naturally associated with Taurus and Venus, this house speaks to what you value, both in the tangible and intangible sense. It reveals your relationship with money, your earning potential, and your attitudes toward financial security. Beyond mere wealth, the Second House addresses the deeper question of self-worth and what you consider truly valuable in life.

In the birth chart, the Second House shows how you naturally attract and manage resources. A well-aspected Second House often indicates someone with a natural talent for building financial stability, while challenging aspects may point to lessons around spending, saving, or recognizing one's own value. This house also governs the physical senses — taste, touch, smell, sight, and hearing — and the pleasures derived from the material world. People with prominent Second House energy often have a refined appreciation for quality, comfort, and beauty.

The Second House is fundamentally about security and sustenance. It asks: "What do I need to feel safe and supported in the physical world?" The answers to this question shape your approach to career choices, financial planning, and even relationships. Understanding your Second House can reveal hidden talents that could become sources of income, as well as unconscious patterns around money that may need to be addressed for greater prosperity and peace of mind.`,
    planetsInHouse: `Planets in the Second House strongly color your financial life and sense of personal value. The Sun here places tremendous importance on financial achievement and material security — self-esteem is closely tied to what you earn and own. The Moon in the Second House creates emotional attachment to possessions and financial fluctuations tied to moods and emotional states. Mercury here suggests income through communication, writing, or intellectual pursuits, along with a talent for financial analysis.

Venus in its natural house bestows an appreciation for luxury and often attracts money with relative ease, though spending can be equally generous. Mars in the Second House drives aggressive earning habits and a competitive approach to financial matters. Jupiter here is classically considered one of the most fortunate placements for wealth, expanding earning potential and bringing a generally optimistic relationship with money.

Saturn in the Second House often indicates early financial hardship or a cautious approach to money that eventually builds substantial long-term wealth through discipline. Uranus brings financial unpredictability — sudden gains and losses. Neptune can create confusion around money or income through artistic and spiritual pursuits. Pluto here suggests a deep, sometimes obsessive relationship with resources and the potential for dramatic financial transformation.`,
    signsOnCusp: `The sign on the Second House cusp reveals your instinctive approach to earning and managing money. Fire signs (Aries, Leo, Sagittarius) here suggest bold, entrepreneurial earning styles — these individuals are willing to take financial risks and often prefer self-employment or commission-based income. Earth signs (Taurus, Virgo, Capricorn) on the cusp produce methodical, practical approaches to finances with a strong desire for material stability and tangible results.

Air signs (Gemini, Libra, Aquarius) on the Second House cusp indicate income through ideas, communication, or social connections. These individuals may have multiple income streams or earn through intellectual property. Water signs (Cancer, Scorpio, Pisces) here suggest an intuitive approach to finances, with earning power often connected to emotional intelligence, caregiving, or creative endeavors. The ruling planet of the cusp sign and its condition further refine how financial matters unfold in your life.`,
    transits: `Transits through the Second House activate financial themes and questions of self-worth. Jupiter passing through brings a period of increased income potential, financial optimism, and opportunities for material growth. Saturn's transit through the Second House — lasting roughly two and a half years — demands financial discipline, realistic budgeting, and a hard look at whether your income truly reflects your value. It may feel restrictive but ultimately builds a more solid financial foundation.

Uranus transiting the Second House can completely revolutionize your relationship with money, sometimes through unexpected windfalls or losses that force you to redefine security. Neptune's passage may dissolve financial boundaries — watch for idealistic spending or confusion about money — but it can also open doors to income through creative or spiritual work. Pluto's lengthy transit through this house transforms your entire value system, potentially destroying old financial structures so that something more authentic can emerge.`,
    faqs: [
      {
        question: 'Does the Second House only relate to money?',
        answer:
          'While finances are a major theme, the Second House also governs self-worth, personal values, material possessions, physical senses, and natural talents. It represents everything you value and the resources — both material and intangible — that provide you with security.',
      },
      {
        question: 'Can the Second House show how wealthy I will be?',
        answer:
          'The Second House shows your natural relationship with money and earning potential, but wealth depends on many chart factors including aspects to Second House planets, the condition of its ruling planet, and the interplay with the Eighth and Tenth Houses. No single house determines absolute wealth.',
      },
      {
        question: 'What does it mean to have many planets in the Second House?',
        answer:
          'Multiple planets in the Second House (a stellium) indicate that financial matters and questions of self-worth are central themes in your life. You may have complex financial experiences, multiple income streams, or a particularly nuanced relationship with material security and personal values.',
      },
      {
        question: 'How is the Second House different from the Eighth House?',
        answer:
          'The Second House governs your own earned income and personal resources, while the Eighth House (its opposite) deals with shared resources, inherited wealth, debt, and other people\'s money. Together they form the financial axis of the chart.',
      },
    ],
  },
  {
    slug: '3rd-house',
    name: 'Third House',
    number: 3,
    nickname: 'House of Communication',
    rulingSign: 'Gemini',
    rulingSignSlug: 'gemini',
    rulingPlanet: 'Mercury',
    rulingPlanetSlug: 'mercury',
    element: 'Air',
    modality: 'Mutable',
    lifeAreas: [
      'Communication and speech',
      'Siblings and neighbors',
      'Short-distance travel',
      'Early education',
      'Mental processes',
      'Writing and media',
    ],
    overview: `The Third House is the realm of the mind in its most immediate, everyday expression. Associated with Gemini and Mercury, it governs how you think, communicate, and process information. This is the house of conversation, correspondence, short journeys, and all forms of mental exchange. It represents your intellectual curiosity, your learning style, and the way you gather and share information with the people in your immediate environment.

Beyond pure intellect, the Third House also governs your relationships with siblings, neighbors, and your local community. These are the people you interact with on a daily basis, and the nature of these relationships is reflected in this house. Traditionally, the Third House is also associated with early education — the formative years of schooling that shape your mental habits and communication patterns for life. It reveals whether you are a natural storyteller, a careful analyst, a poetic thinker, or a blunt communicator.

The Third House is ultimately about connection through language and ideas. In the modern world, it extends to social media, blogging, podcasting, texting, and all digital communication. A strong Third House often indicates a gifted communicator, writer, or teacher. Understanding this house in your chart can reveal your natural learning style, your relationship with your immediate community, and the mental patterns that shape your perception of everyday reality.`,
    planetsInHouse: `Planets in the Third House profoundly shape your mental life and communication style. The Sun here creates someone whose identity is closely tied to intellectual pursuits and the exchange of ideas — these are natural teachers, writers, and speakers. The Moon in the Third House gives an emotionally colored thinking style, with a strong memory and intuitive communication. Mercury in its natural house sharpens mental agility and verbal dexterity, often producing gifted linguists or prolific writers.

Venus in the Third House lends grace and diplomacy to communication, with a talent for saying the right thing at the right time. Mars here makes the mind assertive, argumentative, and quick — debate and intellectual competition are energizing. Jupiter expands mental horizons, bringing enthusiasm for learning and a philosophical bent to everyday thinking. Saturn in the Third House can indicate early learning challenges that ultimately produce a disciplined, methodical thinker.

Uranus here creates an original, unconventional mind with flashes of brilliant insight. Neptune in the Third House gives a poetic, imaginative communication style but may struggle with factual precision. Pluto grants deep, penetrating mental powers and an ability to uncover hidden truths through research and investigation.`,
    signsOnCusp: `The sign on the Third House cusp shapes your fundamental communication style and mental approach. Fire signs here (Aries, Leo, Sagittarius) produce enthusiastic, direct communicators who think quickly and speak boldly. They are often drawn to leadership roles in media, teaching, or public speaking. Earth signs (Taurus, Virgo, Capricorn) on the Third House cusp create practical, methodical thinkers who prefer concrete information and well-organized communication.

Air signs (Gemini, Libra, Aquarius) are naturally at home in the Third House, producing versatile, curious, and socially adept communicators. These individuals thrive in intellectual environments and often excel at networking. Water signs (Cancer, Scorpio, Pisces) on the cusp give an intuitive, emotionally perceptive communication style. These people read between the lines, picking up on unspoken feelings and subtle cues in conversation.`,
    transits: `Transits through the Third House stimulate mental activity, communication opportunities, and local connections. Jupiter here brings a year of intellectual expansion, writing opportunities, and positive developments with siblings or neighbors. It is an excellent transit for studying, taking courses, or launching communication projects. Saturn's transit through the Third House asks you to get serious about your communication skills, potentially bringing writing deadlines, important conversations, or a need to address issues with siblings.

Outer planet transits through the Third House reshape your mental landscape on a fundamental level. Uranus here revolutionizes your thinking and may bring sudden insights or radical changes in your communication style. Neptune passing through can enhance creativity and intuition but may also bring periods of mental fog or miscommunication. Pluto's transit through the Third House transforms the way you think and communicate, often bringing intense intellectual interests and a desire to uncover deep truths.`,
    faqs: [
      {
        question: 'What is the difference between the Third House and the Ninth House?',
        answer:
          'The Third House governs everyday communication, early education, and local connections, while the Ninth House (its opposite) rules higher education, philosophy, long-distance travel, and the search for broader meaning. Together they form the axis of learning and knowledge.',
      },
      {
        question: 'Does the Third House affect relationships with siblings?',
        answer:
          'Yes, the Third House is traditionally associated with siblings, particularly younger siblings. The sign on the cusp and any planets here can describe the nature of sibling relationships, from harmonious to challenging. It also covers relationships with neighbors and peers.',
      },
      {
        question: 'How does the Third House relate to writing and media?',
        answer:
          'The Third House governs all forms of communication including writing, blogging, journalism, social media, and broadcasting. A strong Third House often indicates talent in these areas. The sign on the cusp and planets present show your natural writing style and communication strengths.',
      },
      {
        question: 'Can the Third House affect how I learn?',
        answer:
          'Absolutely. The Third House reveals your natural learning style and mental processing. Fire signs suggest hands-on, experiential learning. Earth signs prefer structured, practical approaches. Air signs thrive with discussion and intellectual exchange. Water signs learn best through emotional connection and intuition.',
      },
    ],
  },
  {
    slug: '4th-house',
    name: 'Fourth House',
    number: 4,
    nickname: 'House of Home',
    rulingSign: 'Cancer',
    rulingSignSlug: 'cancer',
    rulingPlanet: 'Moon',
    rulingPlanetSlug: 'moon',
    element: 'Water',
    modality: 'Cardinal',
    lifeAreas: [
      'Home and family',
      'Roots and ancestry',
      'Emotional foundations',
      'Real estate and property',
      'Private life',
      'The nurturing parent',
    ],
    overview: `The Fourth House sits at the very bottom of the chart — the Imum Coeli or IC — representing your deepest roots, your home, and your emotional foundation. Naturally associated with Cancer and the Moon, this house governs your family of origin, your ancestry, your physical home, and the innermost private world you retreat to when the demands of public life become too much. It is one of the four angular houses and carries tremendous power in shaping your life experience.

This house reveals the nature of your childhood home and the psychological patterns you inherited from your family. Traditionally, the Fourth House is associated with one of the parents — often the more nurturing parent or the one who provided the emotional foundation of the home. The condition of this house can reveal whether your early home life was stable and supportive or marked by disruption and instability. These early imprints profoundly shape your adult emotional patterns and your concept of what "home" means.

The Fourth House also governs the latter part of life, representing where you end up — both literally and psychologically. It speaks to your relationship with property and real estate, your desire to put down roots, and the kind of domestic environment you create for yourself. Understanding your Fourth House can illuminate the unconscious emotional patterns that drive your behavior, the family dynamics you tend to recreate, and the type of sanctuary you need to feel truly at peace.`,
    planetsInHouse: `Planets in the Fourth House deeply influence your domestic life and emotional inner world. The Sun here places great importance on home and family — these individuals may build their identity around their role as a parent, homeowner, or family member. The Moon in its natural house intensifies emotional sensitivity and creates a deep need for a secure, nurturing home base. There is often a strong connection to the mother or maternal lineage. Mercury in the Fourth House suggests a mentally active home life, with family discussions and learning being central to domestic experience.

Venus here creates a beautiful, harmonious home environment and often indicates positive family relationships. Mars in the Fourth House can bring energy and sometimes conflict to domestic matters — there may be a history of strong-willed family dynamics. Jupiter expands the home in some way, whether through a large family, generous living space, or a sense of abundance in domestic life. Saturn here often points to a strict or restrictive early home environment that teaches responsibility and emotional resilience over time.

Uranus in the Fourth House suggests an unconventional upbringing or frequent moves. Neptune can indicate idealization of home and family, or some confusion and sacrifice in domestic life. Pluto here reveals intense family dynamics, possible power struggles within the home, and the potential for deep psychological transformation through confronting family patterns.`,
    signsOnCusp: `The sign on the Fourth House cusp (the IC) describes the emotional foundation of your inner world and the nature of your home environment. Fire signs (Aries, Leo, Sagittarius) on the IC suggest a dynamic, energetic home life with an emphasis on independence and self-expression within the family. These individuals may prefer homes that reflect their bold personality. Earth signs (Taurus, Virgo, Capricorn) here create a strong desire for a stable, comfortable, and well-maintained home — security and practicality are paramount.

Air signs (Gemini, Libra, Aquarius) on the Fourth House cusp indicate a mentally stimulating home environment where communication and social connection within the family are important. These individuals may move frequently or maintain homes that serve as gathering places. Water signs (Cancer, Scorpio, Pisces) are deeply at home in the Fourth House, producing individuals with profound emotional roots, strong family bonds, and an intuitive understanding of ancestral patterns.`,
    transits: `Transits through the Fourth House activate themes of home, family, and emotional foundations. Jupiter here brings opportunities for domestic expansion — a home purchase, renovation, family growth, or simply a period of greater emotional contentment. Saturn transiting the Fourth House is one of the more challenging transits, often coinciding with family responsibilities, home repairs, or a need to address unresolved childhood issues. It asks you to build a more solid emotional foundation.

Outer planet transits through the Fourth House can be deeply transformative. Uranus here may bring sudden changes in living situation — unexpected moves, family disruptions, or a radical redefinition of what home means to you. Neptune's passage can dissolve boundaries within the family or create a desire for a more spiritual or retreat-like home environment. Pluto transiting the Fourth House represents a profound transformation of your emotional roots, often requiring you to confront and heal deep family wounds in order to build a more authentic sense of inner security.`,
    faqs: [
      {
        question: 'Does the Fourth House represent my mother or father?',
        answer:
          'Astrologers disagree on this point. Traditionally, the Fourth House is often associated with the father in Hellenistic astrology, but many modern astrologers assign it to the mother or the more nurturing parent. The most useful approach is to consider it as the parent who shaped your emotional foundation, regardless of gender.',
      },
      {
        question: 'How does the Fourth House affect my adult home life?',
        answer:
          'The Fourth House shapes your ideal domestic environment and the unconscious patterns you bring to home and family life. The sign on the cusp and planets present describe the kind of home you naturally create and the emotional atmosphere you seek in your living space.',
      },
      {
        question: 'What does an empty Fourth House mean?',
        answer:
          'An empty Fourth House does not mean you will lack a home or family life. It simply means no planets were in this area at your birth. The sign on the cusp and its ruling planet still describe your domestic nature and family patterns. Home matters may simply not be the primary focus of your chart.',
      },
      {
        question: 'Does the Fourth House really govern the end of life?',
        answer:
          'In traditional astrology, yes. The Fourth House represents endings, final resting place, and the conditions of later life. Modern astrologers focus more on its connection to emotional foundations and family roots, but the traditional association with life\'s conclusion remains a valid interpretive layer.',
      },
    ],
  },
  {
    slug: '5th-house',
    name: 'Fifth House',
    number: 5,
    nickname: 'House of Pleasure',
    rulingSign: 'Leo',
    rulingSignSlug: 'leo',
    rulingPlanet: 'Sun',
    rulingPlanetSlug: 'sun',
    element: 'Fire',
    modality: 'Fixed',
    lifeAreas: [
      'Creativity and self-expression',
      'Romance and love affairs',
      'Children',
      'Recreation and fun',
      'Performing arts',
      'Gambling and speculation',
    ],
    overview: `The Fifth House is the house of joy, creativity, and the fullest expression of the individual spirit. Naturally associated with Leo and the Sun, it governs everything that brings pleasure and allows you to shine — romance, creative projects, children, entertainment, hobbies, and the thrill of taking risks. If the Fourth House is your private emotional world, the Fifth House is where you step onto the stage and let your inner light radiate outward.

Romance in the Fifth House is distinguished from the committed partnerships of the Seventh House. Here, love is playful, passionate, and focused on the excitement of courtship and attraction. The Fifth House describes what lights you up romantically, the kind of lovers you are drawn to, and how you express affection in the early, heady stages of a relationship. It also governs your relationship with children — both your own and children in general — and reveals your capacity for childlike wonder, play, and spontaneity.

Creativity is perhaps the Fifth House's most profound domain. This is where your unique creative vision lives, whether it manifests through art, music, writing, performance, entrepreneurship, or any form of self-expression that puts your personal stamp on the world. The Fifth House also governs speculation and risk-taking — from gambling to investment — because these activities require the same creative courage and willingness to put yourself on the line. A strong Fifth House suggests someone who naturally radiates vitality and finds deep fulfillment through creative self-expression.`,
    planetsInHouse: `Planets in the Fifth House amplify the desire for creative expression and personal joy. The Sun here is in its natural domain, producing someone with tremendous creative vitality, a love of being in the spotlight, and often a special connection with children. The Moon in the Fifth House creates deep emotional investment in creative projects and romantic relationships — the heart leads in matters of love and art. Mercury here channels creative energy through words, producing talented writers, performers, and communicators.

Venus in the Fifth House is a classic placement for artistic talent and romantic magnetism. Love affairs tend to be beautiful and pleasure-seeking. Mars here brings passionate, competitive creative energy and an ardent approach to romance. Jupiter in the Fifth House is one of the most joyful placements in astrology, expanding creative opportunities, bringing luck in speculation, and often indicating a large or happy family. Saturn here can bring delays or seriousness to creative expression and romance, but ultimately produces disciplined artistic mastery.

Uranus in the Fifth House creates unconventional creative expression and unexpected romantic encounters. Neptune grants extraordinary artistic imagination and an idealized view of romance. Pluto here brings intense creative power, transformative love affairs, and sometimes complex relationships with children or the creative process itself.`,
    signsOnCusp: `The sign on the Fifth House cusp describes your natural creative style and approach to pleasure, romance, and self-expression. Fire signs (Aries, Leo, Sagittarius) produce bold, dramatic, and enthusiastic creative expression. Romance is pursued with passion and confidence, and these individuals light up any stage or creative endeavor. Earth signs (Taurus, Virgo, Capricorn) bring a more grounded approach to creativity — the results are tangible, well-crafted, and often commercially viable.

Air signs (Gemini, Libra, Aquarius) on the Fifth House cusp create intellectually stimulating creative expression and a social approach to romance. These individuals may express creativity through writing, design, or collaborative projects. Water signs (Cancer, Scorpio, Pisces) here produce deeply emotional, intuitive creative expression. Art and romance are intensely felt experiences, and there is often a natural talent for music, poetry, or any medium that channels raw emotion.`,
    transits: `Transits through the Fifth House activate periods of heightened creativity, romantic opportunity, and personal joy. Jupiter here is one of the most delightful transits, bringing a year of creative abundance, romantic possibilities, and a general sense of fun and expansion. It is an excellent time for launching creative projects, pursuing romance, or spending more time in activities that bring you genuine pleasure. Saturn transiting the Fifth House may feel like creativity has dried up or romance has become serious, but it is actually a time of creative maturation and deepening commitment to your art.

Outer planet transits through the Fifth House can reshape your entire relationship with creativity and joy. Uranus here breaks you out of creative ruts and may bring sudden, electrifying romantic connections. Neptune passing through inspires extraordinary artistic vision but can also create illusions in romance. Pluto transiting the Fifth House brings an intense, transformative creative period — old forms of expression may die so that something more powerful and authentic can be born. This transit can also bring profound changes related to children or the creative legacy you leave behind.`,
    faqs: [
      {
        question: 'Is the Fifth House about love or just casual romance?',
        answer:
          'The Fifth House governs the early, exciting stages of romance — courtship, attraction, and dating. It represents the joy of falling in love rather than the commitment of partnership (Seventh House) or the deep merging of souls (Eighth House). However, Fifth House energy can certainly be present in long-term relationships that maintain passion and playfulness.',
      },
      {
        question: 'Does the Fifth House indicate how many children I will have?',
        answer:
          'Traditional astrology used the Fifth House to make predictions about children, but modern astrology takes a more nuanced view. The Fifth House describes your relationship with children and your creative capacity, but the number of children depends on many life factors beyond the birth chart.',
      },
      {
        question: 'How does the Fifth House relate to gambling and speculation?',
        answer:
          'The Fifth House governs all forms of risk-taking for pleasure, including gambling, stock speculation, and entrepreneurial ventures. The sign on the cusp and planets here can indicate your luck and approach to financial risk. Jupiter or Venus here may suggest better fortune, while Saturn could indicate losses from gambling.',
      },
      {
        question: 'Can an empty Fifth House mean I am not creative?',
        answer:
          'Absolutely not. An empty Fifth House simply means no planets fell in this area at birth. The sign on the cusp and its ruling planet still describe your creative nature. Everyone has creative potential — an empty Fifth House just means creativity may not be the dominant theme your chart emphasizes.',
      },
    ],
  },
  {
    slug: '6th-house',
    name: 'Sixth House',
    number: 6,
    nickname: 'House of Health',
    rulingSign: 'Virgo',
    rulingSignSlug: 'virgo',
    rulingPlanet: 'Mercury',
    rulingPlanetSlug: 'mercury',
    element: 'Earth',
    modality: 'Mutable',
    lifeAreas: [
      'Daily routines and habits',
      'Physical health and wellness',
      'Work environment',
      'Service to others',
      'Pets and small animals',
      'Self-improvement',
    ],
    overview: `The Sixth House governs the everyday machinery of life — your daily routines, work habits, health practices, and acts of service. Naturally associated with Virgo and Mercury, this house is less glamorous than the Fifth or Seventh, but it is the foundation upon which a well-functioning life is built. Without the discipline, organization, and self-care governed by the Sixth House, the grand ambitions of other houses remain unfulfilled. It is the house of doing the work, day after day, with care and attention to detail.

Health is a primary domain of the Sixth House. This includes both your physical constitution and your approach to wellness — diet, exercise, hygiene, and preventive care. The sign on the cusp and planets here can reveal your physical vulnerabilities, your natural healing approach, and how your emotional and mental states affect your body. In traditional astrology, the Sixth House was associated with illness and infirmity, but modern astrology frames it more constructively as the house of health maintenance and improvement.

The Sixth House also governs your relationship with work — not your career or public reputation (that is the Tenth House) but the actual daily experience of working. It describes your work style, your relationship with coworkers and employees, and the kind of work environment that allows you to function at your best. Additionally, this house rules service to others, pets, and the desire to be useful and productive. A strong Sixth House produces someone who finds deep satisfaction in refining systems, helping others, and perfecting their craft through consistent, dedicated effort.`,
    planetsInHouse: `Planets in the Sixth House bring focus and complexity to matters of health, daily work, and service. The Sun here creates someone who derives a strong sense of identity from their work and daily routine — being productive and useful is essential to their self-worth. The Moon in the Sixth House ties emotional wellbeing directly to daily routine, with health fluctuating based on emotional state. Mercury here sharpens analytical abilities and creates a detail-oriented approach to work, often producing excellent editors, analysts, or technicians.

Venus in the Sixth House brings a love of creating pleasant, harmonious work environments and may indicate careers in health, beauty, or wellness. Mars here drives an energetic, sometimes workaholic approach to daily tasks. Jupiter in the Sixth House generally promotes good health and a positive work environment, often bringing opportunities through service roles. Saturn here can indicate chronic health concerns or demanding work conditions, but also exceptional discipline and mastery of practical skills over time.

Uranus in the Sixth House creates unconventional health approaches and irregular work schedules. Neptune may bring sensitivity to medications, environmental toxins, or psychosomatic health patterns. Pluto here indicates intense focus on health transformation and the potential for powerful healing abilities, sometimes through crisis that prompts complete lifestyle overhaul.`,
    signsOnCusp: `The sign on the Sixth House cusp shapes your approach to daily life, health, and work habits. Fire signs (Aries, Leo, Sagittarius) here bring enthusiasm and energy to daily routines but may struggle with consistency. These individuals prefer dynamic work environments and active health practices. Earth signs (Taurus, Virgo, Capricorn) are naturally suited to Sixth House matters, producing reliable workers with steady health routines and a practical approach to wellness.

Air signs (Gemini, Libra, Aquarius) on the Sixth House cusp create a need for mental stimulation in daily work and may prefer varied routines over rigid schedules. Health benefits from social activity and intellectual engagement. Water signs (Cancer, Scorpio, Pisces) here suggest that emotions strongly affect health and work performance. These individuals benefit from work that feels emotionally meaningful and health practices that address mind-body connection.`,
    transits: `Transits through the Sixth House spotlight your daily habits, health, and work life. Jupiter here can bring improvements in health, a more enjoyable work environment, or opportunities through service and skill development. It is an excellent time to start new health regimens or improve workplace conditions. Saturn transiting the Sixth House demands that you get serious about health maintenance and work discipline. This transit may bring health concerns that require attention or increased work responsibilities that test your organizational abilities.

Outer planet transits through the Sixth House can fundamentally transform your approach to daily life. Uranus here may disrupt your routine in ways that ultimately free you from unhealthy patterns. Neptune passing through the Sixth House can bring mysterious health symptoms, a desire for more spiritually meaningful work, or heightened sensitivity to your environment. Pluto's transit through this house often triggers a complete health transformation — old habits are destroyed and replaced with a more conscious, empowered approach to daily wellness and work.`,
    faqs: [
      {
        question: 'What is the difference between the Sixth House and the Tenth House for work?',
        answer:
          'The Sixth House governs your daily work experience — routines, coworkers, and the actual tasks you perform. The Tenth House governs your career, public reputation, and professional achievements. Think of the Sixth House as the day-to-day job and the Tenth House as the overarching career path.',
      },
      {
        question: 'Can the Sixth House predict specific health problems?',
        answer:
          'The Sixth House can indicate areas of physical vulnerability and health tendencies, but it does not predict specific diseases with certainty. The sign on the cusp relates to certain body systems, and challenging aspects to Sixth House planets may highlight areas needing extra care. Always consult medical professionals for health concerns.',
      },
      {
        question: 'Why is the Sixth House associated with pets?',
        answer:
          'Traditionally, the Sixth House governed small animals and domestic servants — beings in your care who depend on you for their wellbeing. In modern astrology, this extends to pets and the nurturing, service-oriented relationship we have with our animal companions.',
      },
      {
        question: 'How can I improve my Sixth House matters?',
        answer:
          'Work with the sign on your Sixth House cusp. If it is an earth sign, structured routines will help. Fire signs benefit from energetic, varied activities. Air signs need mental engagement in daily tasks. Water signs thrive when daily life includes emotional and spiritual nourishment.',
      },
    ],
  },
  {
    slug: '7th-house',
    name: 'Seventh House',
    number: 7,
    nickname: 'House of Partnership',
    rulingSign: 'Libra',
    rulingSignSlug: 'libra',
    rulingPlanet: 'Venus',
    rulingPlanetSlug: 'venus',
    element: 'Air',
    modality: 'Cardinal',
    lifeAreas: [
      'Marriage and committed partnerships',
      'Business partnerships',
      'Open enemies and rivals',
      'Contracts and agreements',
      'One-on-one relationships',
      'What you seek in others',
    ],
    overview: `The Seventh House, sitting directly opposite the First House of Self, represents the Other — the people you draw into your life through committed partnership and close one-on-one relationships. Naturally associated with Libra and Venus, this angular house governs marriage, business partnerships, contracts, and any relationship that involves a formal or deeply committed bond between two individuals. It is the mirror through which you see yourself reflected in another person.

The Descendant — the cusp of the Seventh House — reveals the qualities you are drawn to in partners and the characteristics you may project onto others. Psychologically, the Seventh House often represents parts of yourself that you do not fully own or express, leading you to seek them in a partner. Understanding this house can illuminate why you are attracted to certain types of people and the patterns that repeat in your closest relationships. It shows not only what you want in a partner but what you need for balance and wholeness.

Beyond romantic partnership, the Seventh House governs all committed one-on-one relationships including business partners, close collaborators, and even open adversaries. In traditional astrology, this house was associated with "open enemies" — people who oppose you directly and publicly. The Seventh House teaches the art of relationship: compromise, negotiation, sharing, and the recognition that you cannot fully know yourself without the mirror of another person.`,
    planetsInHouse: `Planets in the Seventh House powerfully shape your experience of committed relationships. The Sun here places enormous importance on partnership — self-fulfillment comes through relationship, and these individuals often feel incomplete without a significant other. The Moon in the Seventh House creates a deep emotional need for partnership and a tendency to attract nurturing or emotionally complex partners. Mercury here values intellectual connection in relationships and seeks a partner with whom they can communicate endlessly.

Venus in the Seventh House is one of the strongest indicators of a harmonious marriage or partnership. There is a natural talent for relating, compromise, and creating beautiful partnerships. Mars here brings passion but also potential conflict to relationships — these individuals are attracted to strong, dynamic partners and may experience power struggles. Jupiter in the Seventh House generally brings good fortune in partnership, attracting generous, optimistic partners and benefiting through marriage or collaboration.

Saturn in the Seventh House often delays marriage or brings serious, older, or more experienced partners. Relationships are approached with caution but deepen over time into enduring bonds. Uranus here creates a need for freedom within partnership and may bring unconventional relationship structures. Neptune can idealize partners or create confusion in relationships. Pluto in the Seventh House brings intensely transformative partnerships that can feel fated and life-changing.`,
    signsOnCusp: `The sign on the Seventh House cusp, your Descendant, describes the partner you attract and the qualities you seek in relationship. It is always opposite your Rising Sign, creating a complementary dynamic. Fire signs (Aries, Leo, Sagittarius) on the Descendant attract passionate, confident, independent partners. These individuals need excitement and dynamism in their committed relationships. Earth signs (Taurus, Virgo, Capricorn) here seek stable, reliable, practical partners who provide material and emotional security.

Air signs (Gemini, Libra, Aquarius) on the Seventh House cusp attract intellectually stimulating, communicative, and socially adept partners. Mental connection is essential in these relationships. Water signs (Cancer, Scorpio, Pisces) on the Descendant draw emotionally deep, intuitive, and sometimes complex partners. These individuals seek soul-level connection and emotional intimacy in their committed relationships, and may need to guard against becoming enmeshed.`,
    transits: `Transits through the Seventh House activate relationship themes with particular intensity. Jupiter here is classically associated with meeting a significant partner or experiencing growth and expansion within an existing relationship. Business partnerships may also flourish during this transit. Saturn transiting the Seventh House is a time of relationship reckoning — existing partnerships are tested for strength and authenticity. This transit may bring commitment to a solid relationship or the end of one that no longer serves your growth.

Outer planet transits through the Seventh House can profoundly reshape your relationship landscape. Uranus here often brings sudden changes in partnership — unexpected meetings, separations, or a radical redefinition of your relationship needs. Neptune passing through the Seventh House can create a period of romantic idealization or confusion about partners. Pluto transiting this house brings intense, transformative relationship experiences that fundamentally change who you are through the mirror of partnership. Power dynamics in relationships become impossible to ignore.`,
    faqs: [
      {
        question: 'Does the Seventh House determine who I will marry?',
        answer:
          'The Seventh House describes the qualities you seek in a partner and the type of relationship dynamics you tend to create, but it does not predetermine a specific person. It shows your relationship patterns, needs, and the energy you attract in committed partnerships.',
      },
      {
        question: 'What does it mean if my Seventh House is in a challenging sign?',
        answer:
          'There are no inherently "bad" signs for the Seventh House. Each sign brings its own strengths and challenges to partnership. Even traditionally difficult placements like Saturn in the Seventh House can produce deeply committed, long-lasting relationships with maturity and effort.',
      },
      {
        question: 'Why does the Seventh House represent enemies?',
        answer:
          'In traditional astrology, the Seventh House governs "open enemies" — people who oppose you directly and publicly. This is because any one-on-one relationship, whether harmonious or adversarial, falls under Seventh House territory. Modern astrology focuses more on the partnership aspect.',
      },
      {
        question: 'How does the Seventh House differ from the Fifth House in love?',
        answer:
          'The Fifth House governs the excitement of romance, courtship, and dating — the thrill of falling in love. The Seventh House governs committed partnership — marriage, long-term bonds, and the deeper work of maintaining a relationship. One is about play; the other is about partnership.',
      },
    ],
  },
  {
    slug: '8th-house',
    name: 'Eighth House',
    number: 8,
    nickname: 'House of Transformation',
    rulingSign: 'Scorpio',
    rulingSignSlug: 'scorpio',
    rulingPlanet: 'Pluto',
    rulingPlanetSlug: 'pluto',
    element: 'Water',
    modality: 'Fixed',
    lifeAreas: [
      'Transformation and rebirth',
      'Shared resources and inheritance',
      'Intimacy and deep bonding',
      'Death and regeneration',
      'Occult and hidden knowledge',
      'Taxes, debt, and insurance',
    ],
    overview: `The Eighth House is the most mysterious and psychologically complex house in the zodiac. Naturally associated with Scorpio and Pluto (and traditionally Mars), it governs the hidden undercurrents of life — death, transformation, shared resources, deep intimacy, occult knowledge, and the process of psychological rebirth. Where the Second House deals with your own money and values, the Eighth House deals with other people's resources, joint finances, inheritance, taxes, and the complex dynamics of sharing on the deepest levels.

Intimacy — both physical and psychological — is a core Eighth House theme. This is not the playful romance of the Fifth House but the raw, vulnerable merging of souls that happens when two people truly open themselves to each other. The Eighth House reveals your capacity for deep trust, your relationship with power dynamics in intimacy, and the transformations that occur when you allow someone past your defenses. It also governs the taboo, the hidden, and everything society keeps behind closed doors.

Transformation is the ultimate gift of the Eighth House. Like the phoenix rising from the ashes, this house governs the cyclical process of death and rebirth that occurs throughout life — not only physical death but the many psychological deaths and rebirths we experience as we shed old identities, relationships, and ways of being. A strong Eighth House often indicates someone who is drawn to depth psychology, the occult, research, investigation, and healing work. These individuals are not afraid to look into the darkness because they understand that true power and renewal lie on the other side.`,
    planetsInHouse: `Planets in the Eighth House create a life rich with transformative experiences and psychological depth. The Sun here produces someone who is compelled to understand life's mysteries — power, death, sexuality, and the unseen forces that move the world. The Moon in the Eighth House gives extraordinary emotional depth and psychic sensitivity, along with intense emotional experiences related to shared resources and intimacy. Mercury here creates a probing, investigative mind drawn to research, psychology, and uncovering hidden truths.

Venus in the Eighth House brings intensity to love and a magnetic quality to relationships. There is often a talent for managing other people's money or resources. Mars here amplifies desire, ambition, and sometimes conflict around shared resources and power dynamics. Jupiter in the Eighth House can bring financial benefit through inheritance, partnerships, or investment, along with a philosophical approach to life's deeper mysteries. Saturn here may bring fears around intimacy or loss that eventually develop into profound psychological wisdom.

Uranus in the Eighth House brings sudden, disruptive transformations and unconventional approaches to intimacy and shared resources. Neptune can blur boundaries in financial partnerships or bring spiritual experiences related to the transcendence of death. Pluto in its natural house intensifies everything — these individuals possess tremendous transformative power and may serve as catalysts for change in the lives of others.`,
    signsOnCusp: `The sign on the Eighth House cusp reveals your approach to intimacy, shared resources, and the process of transformation. Fire signs (Aries, Leo, Sagittarius) here bring courage and directness to Eighth House matters — these individuals confront transformation head-on and may be drawn to bold, adventurous approaches to intimacy and joint financial ventures. Earth signs (Taurus, Virgo, Capricorn) on the cusp take a practical, methodical approach to shared finances and prefer a grounded, sensory approach to intimacy.

Air signs (Gemini, Libra, Aquarius) on the Eighth House cusp bring an intellectual approach to deep psychological material. These individuals may process transformation through talking, reading, or analyzing. Water signs (Cancer, Scorpio, Pisces) are naturally attuned to Eighth House territory, experiencing transformation and intimacy on a profoundly emotional and intuitive level. They often possess natural psychic gifts and an instinctive understanding of the cycles of death and rebirth.`,
    transits: `Transits through the Eighth House trigger periods of deep transformation, financial changes involving shared resources, and intensified intimate experiences. Jupiter here can bring financial benefit through others — inheritances, returns on investments, or favorable settlement of shared financial matters. It also brings a more expansive relationship with life's deeper questions. Saturn transiting the Eighth House is a serious, sometimes heavy transit that confronts you with issues of mortality, loss, debt, or the need to restructure shared financial arrangements. It demands emotional maturity and the release of what is no longer serving you.

Outer planet transits through the Eighth House are among the most profoundly life-altering in astrology. Uranus here brings sudden, shocking changes related to shared resources, intimacy, or your psychological foundations. Neptune passing through dissolves barriers between the conscious and unconscious mind, potentially bringing spiritual awakening but also vulnerability to deception in financial partnerships. Pluto transiting its own house creates the most intense transformation of all — a complete psychological death and rebirth that can span years and fundamentally alter your relationship with power, intimacy, and the meaning of existence.`,
    faqs: [
      {
        question: 'Does the Eighth House predict death?',
        answer:
          'The Eighth House is associated with death in an archetypal sense, but responsible astrologers do not use it to predict the timing or manner of physical death. It more usefully describes your psychological relationship with mortality, transformation, and the cycle of endings and new beginnings that occurs throughout life.',
      },
      {
        question: 'What is the connection between the Eighth House and money?',
        answer:
          'The Eighth House governs shared resources — joint bank accounts, inheritance, taxes, insurance, debt, and investments. While the Second House is your own earned income, the Eighth House is money that comes through others, partnerships, or financial structures involving multiple parties.',
      },
      {
        question: 'Why is the Eighth House associated with the occult?',
        answer:
          'The Eighth House governs everything hidden, mysterious, and beyond the surface of ordinary reality. This includes occult studies, metaphysics, psychic phenomena, and esoteric knowledge. Its association with Scorpio and Pluto connects it to the desire to penetrate beneath appearances and understand the hidden forces that shape reality.',
      },
      {
        question: 'How does the Eighth House relate to psychology?',
        answer:
          'The Eighth House is deeply connected to depth psychology — the exploration of the unconscious mind, shadow work, trauma healing, and psychological transformation. Many prominent psychologists, therapists, and healers have strong Eighth House placements.',
      },
    ],
  },
  {
    slug: '9th-house',
    name: 'Ninth House',
    number: 9,
    nickname: 'House of Philosophy',
    rulingSign: 'Sagittarius',
    rulingSignSlug: 'sagittarius',
    rulingPlanet: 'Jupiter',
    rulingPlanetSlug: 'jupiter',
    element: 'Fire',
    modality: 'Mutable',
    lifeAreas: [
      'Higher education and academia',
      'Philosophy and belief systems',
      'Long-distance travel',
      'Foreign cultures and languages',
      'Publishing and broadcasting',
      'Legal matters and ethics',
    ],
    overview: `The Ninth House is the realm of the higher mind — philosophy, religion, higher education, long-distance travel, and the quest for meaning that gives life its greater purpose. Naturally associated with Sagittarius and Jupiter, this house represents the expansion of consciousness beyond the familiar boundaries of daily life. Where the Third House deals with information and local communication, the Ninth House seeks wisdom, truth, and the big picture that makes sense of human existence.

Higher education is a core Ninth House theme, encompassing university studies, graduate work, and any form of advanced learning that broadens your worldview. This house also governs teaching at the higher level — professors, gurus, mentors, and published authors who transmit their knowledge to a wide audience. Foreign travel and cross-cultural experiences fall here as well, because nothing expands the mind quite like immersing yourself in an unfamiliar culture. The Ninth House is where you discover that your own perspective is just one of many valid ways of seeing the world.

The Ninth House also governs legal matters, moral philosophy, and ethical frameworks. It is where you develop your personal belief system — whether through organized religion, spiritual practice, philosophical inquiry, or simply living a life rich with diverse experiences. A strong Ninth House often indicates an eternal student, a world traveler, a philosopher, or someone who feels most alive when exploring new ideas and expanding their horizons.`,
    planetsInHouse: `Planets in the Ninth House amplify the quest for meaning and the desire for expansive experiences. The Sun here creates a natural philosopher, teacher, or explorer whose identity is built around the pursuit of truth and higher knowledge. The Moon in the Ninth House gives an emotional need for philosophical understanding and cultural exploration — home may be found in foreign lands or academic settings. Mercury here produces a brilliant scholar, writer, or teacher with a gift for synthesizing complex ideas.

Venus in the Ninth House attracts love through travel, education, or cross-cultural connections. There is often an appreciation for foreign art, music, and aesthetics. Mars here brings a passionate, sometimes dogmatic approach to beliefs and a love of adventurous travel. Jupiter in its natural house is one of the most expansive placements in astrology, bringing abundant opportunities for travel, education, publishing, and spiritual growth. Saturn here may initially struggle with or question belief systems, eventually developing a mature, well-tested personal philosophy.

Uranus in the Ninth House creates a revolutionary thinker who challenges conventional beliefs and educational structures. Neptune brings a mystical, visionary quality to philosophy and may indicate spiritual pilgrimages or inspired teaching. Pluto here transforms belief systems from the ground up — these individuals undergo profound philosophical awakenings that reshape their entire worldview.`,
    signsOnCusp: `The sign on the Ninth House cusp describes your approach to higher learning, philosophy, and the quest for meaning. Fire signs (Aries, Leo, Sagittarius) here bring passionate, adventurous energy to the pursuit of knowledge and truth. These individuals learn through direct experience and may be drawn to competitive academic environments or bold spiritual practices. Earth signs (Taurus, Virgo, Capricorn) on the cusp create a practical approach to higher learning — knowledge is valued for its real-world application.

Air signs (Gemini, Libra, Aquarius) on the Ninth House cusp produce individuals who explore philosophy through discussion, debate, and intellectual exchange. They may hold multiple perspectives simultaneously and enjoy comparative studies. Water signs (Cancer, Scorpio, Pisces) here bring an intuitive, emotionally driven approach to spiritual and philosophical matters. These individuals may be drawn to mystical traditions, depth psychology, or experiential forms of spiritual practice.`,
    transits: `Transits through the Ninth House open doors to expanded horizons and deeper understanding. Jupiter here is one of the most beneficial transits, bringing opportunities for travel, higher education, publishing, and spiritual growth. Plans that have been waiting for the right moment often find their green light during this passage. Saturn transiting the Ninth House asks you to get serious about your beliefs and education. You may commit to a formal degree program, face legal matters, or be challenged to put your philosophical convictions into practice.

Outer planet transits through the Ninth House can radically reshape your worldview. Uranus here shatters old belief systems and opens the mind to revolutionary ideas and unconventional spiritual paths. Neptune's passage brings a period of spiritual seeking that can be profoundly inspiring but also disorienting if beliefs become too ungrounded. Pluto transiting the Ninth House transforms your entire philosophical foundation, often through intense encounters with foreign cultures, powerful teachers, or experiences that shatter your previous understanding of truth and meaning.`,
    faqs: [
      {
        question: 'What is the difference between the Third and Ninth Houses?',
        answer:
          'The Third House governs everyday communication, local travel, and early education, while the Ninth House rules higher education, long-distance travel, philosophy, and the search for deeper meaning. They are opposite houses that together form the axis of learning and knowledge, from practical information to abstract wisdom.',
      },
      {
        question: 'Does the Ninth House affect religious beliefs?',
        answer:
          'Yes, the Ninth House governs all forms of belief systems, including organized religion, spiritual practice, and philosophical worldviews. The sign on the cusp and planets here describe your natural relationship with faith, dogma, and the quest for transcendent meaning.',
      },
      {
        question: 'Can the Ninth House indicate living abroad?',
        answer:
          'A strong Ninth House — with multiple planets or significant activity — often correlates with extended time living in foreign countries, international careers, or cross-cultural marriages. It represents the pull toward experiences that take you far beyond your place of origin.',
      },
      {
        question: 'How does the Ninth House relate to publishing?',
        answer:
          'Publishing, broadcasting, and reaching a wide audience with ideas fall under the Ninth House because these activities involve the dissemination of knowledge and philosophy to a broad audience. Many successful authors and media personalities have prominent Ninth House placements.',
      },
    ],
  },
  {
    slug: '10th-house',
    name: 'Tenth House',
    number: 10,
    nickname: 'House of Career',
    rulingSign: 'Capricorn',
    rulingSignSlug: 'capricorn',
    rulingPlanet: 'Saturn',
    rulingPlanetSlug: 'saturn',
    element: 'Earth',
    modality: 'Cardinal',
    lifeAreas: [
      'Career and professional life',
      'Public reputation',
      'Authority and achievement',
      'Social status',
      'The authoritative parent',
      'Legacy and ambition',
    ],
    overview: `The Tenth House sits at the very top of the chart — the Midheaven or MC — and represents the pinnacle of worldly achievement, public reputation, and the legacy you build through your professional life. Naturally associated with Capricorn and Saturn, this angular house is where your ambitions meet the real world. It governs your career path, your relationship with authority, your public image, and the mark you leave on society through your professional contributions.

The Midheaven, the cusp of the Tenth House, is one of the most important points in the birth chart. It describes not just what career you might pursue, but how the world sees you at your most public and professional. Your Midheaven sign shapes your professional demeanor, the industry or field you are drawn to, and the kind of authority you naturally command. Many career astrologers begin their analysis with the Midheaven and the condition of the Tenth House ruler before examining any other factor.

The Tenth House also represents your relationship with authority figures — bosses, mentors, government, and the parent who represented worldly achievement and discipline in your upbringing. Traditionally associated with the father or the more authoritative parent, this house reveals how you relate to structure, hierarchy, and the expectations of society. A strong Tenth House indicates someone with powerful ambitions and the determination to achieve recognition, while challenging placements here may suggest conflicts with authority or a complicated path to professional success.`,
    planetsInHouse: `Planets in the Tenth House are among the most publicly visible in the entire chart. The Sun here creates a natural leader whose identity is deeply invested in career achievement and public recognition. These individuals often reach positions of prominence and feel most alive when contributing to the world through their profession. The Moon in the Tenth House suggests a public career, possibly one that involves nurturing or responding to the public's emotional needs. There may be fluctuations in reputation or a mother who was prominent or ambitious.

Mercury in the Tenth House indicates careers in communication, writing, teaching, or media. Venus here brings charm and aesthetic sensitivity to the professional realm and may indicate careers in art, design, diplomacy, or entertainment. Mars drives ambitious, competitive career behavior and often indicates leadership or pioneering roles in one's field. Jupiter in the Tenth House is considered extremely fortunate for career success, bringing abundance, recognition, and opportunities through professional pursuits. Saturn here, in its natural house, builds career success through patience, discipline, and long-term effort — the achievements may come later in life but are often enduring.

Uranus in the Tenth House creates an unconventional career path, often in technology, innovation, or social change. Neptune here may indicate careers in art, music, film, spirituality, or healing, but can also create confusion about professional direction. Pluto in the Tenth House brings intense ambition and the potential for transformative impact on one's field, along with possible power struggles with authority figures.`,
    signsOnCusp: `The sign on the Tenth House cusp — your Midheaven — is one of the most significant career indicators in the birth chart. Fire signs (Aries, Leo, Sagittarius) on the MC produce dynamic, visionary leaders who are drawn to careers that allow them to pioneer, inspire, or lead. These individuals command attention in professional settings and are often drawn to entrepreneurship. Earth signs (Taurus, Virgo, Capricorn) here build solid, practical careers with tangible results — these are the architects, financiers, and master craftspeople of the zodiac.

Air signs (Gemini, Libra, Aquarius) on the Midheaven indicate careers in communication, law, technology, or social advocacy. These individuals excel in roles that require intellectual agility and interpersonal skill. Water signs (Cancer, Scorpio, Pisces) on the Tenth House cusp may pursue careers in healing, counseling, the arts, or any field that requires emotional intelligence and intuitive perception. The ruling planet of the Midheaven sign and its placement further refine career direction.`,
    transits: `Transits through the Tenth House are among the most career-defining periods in your life. Jupiter here brings a year of professional expansion, recognition, and advancement. It is often during this transit that promotions, career breakthroughs, and public honors occur. Saturn transiting the Tenth House — the famous Saturn conjunct Midheaven — is a period of career reckoning. You are called to demonstrate your competence, take on greater responsibility, and earn your professional standing through concrete achievement. This transit can bring career peaks or necessary professional restructuring.

Outer planet transits through the Tenth House reshape your professional life at the deepest level. Uranus here brings sudden career changes, unexpected opportunities, or disruptions that redirect your professional path toward something more authentically aligned with who you are. Neptune passing through the Tenth House can dissolve clear career direction for a time, inviting you to align your professional life with your spiritual values. Pluto transiting this house brings a total transformation of career and public image, often involving a complete reinvention of your professional identity and relationship with power and authority.`,
    faqs: [
      {
        question: 'Is my Midheaven the same as my Tenth House?',
        answer:
          'The Midheaven (MC) is the cusp or starting point of the Tenth House in most house systems. They are closely related but not identical. The Midheaven is a specific degree point representing your public image, while the Tenth House encompasses the full range of career, reputation, and authority themes.',
      },
      {
        question: 'Can the Tenth House tell me my ideal career?',
        answer:
          'The Tenth House, especially the Midheaven sign and its ruling planet, offers strong indications of career direction and professional style. However, career guidance requires looking at the entire chart — the Sixth House (daily work), Second House (income), and planetary aspects all contribute to the full career picture.',
      },
      {
        question: 'What if I have no planets in the Tenth House?',
        answer:
          'An empty Tenth House does not mean you will lack career success. The Midheaven sign and the placement of its ruling planet still strongly indicate your professional direction. An empty Tenth House may simply mean career is not the dominant focus of your chart — other life areas may take priority.',
      },
      {
        question: 'Does the Tenth House represent my father?',
        answer:
          'Traditionally, the Tenth House is associated with the father or the more authoritative parent. However, in modern families with diverse structures, it is more useful to associate it with whichever parent represented worldly ambition, authority, and social expectations in your upbringing.',
      },
    ],
  },
  {
    slug: '11th-house',
    name: 'Eleventh House',
    number: 11,
    nickname: 'House of Friendships',
    rulingSign: 'Aquarius',
    rulingSignSlug: 'aquarius',
    rulingPlanet: 'Uranus',
    rulingPlanetSlug: 'uranus',
    element: 'Air',
    modality: 'Fixed',
    lifeAreas: [
      'Friendships and social circles',
      'Groups and organizations',
      'Hopes, wishes, and dreams',
      'Humanitarian causes',
      'Technology and innovation',
      'Collective consciousness',
    ],
    overview: `The Eleventh House governs your social world beyond intimate partnerships — your friendships, group affiliations, community involvement, and the broader networks that connect you to like-minded people. Naturally associated with Aquarius and Uranus (and traditionally Saturn), this house represents the collective dimension of life and your role within the larger human community. It is where personal desires intersect with social ideals, and where your individual talents can serve a greater purpose.

This is traditionally known as the House of Hopes and Wishes — the dreams you hold for the future, both personal and collective. The Eleventh House reveals what you aspire to achieve, the social vision you hold, and the communities that support your goals. It governs clubs, organizations, political movements, online communities, and any group united by shared purpose or ideology. In the modern age, social media networks and digital communities are strongly Eleventh House phenomena.

The Eleventh House also speaks to your relationship with innovation, technology, and progressive ideas. It asks: "What kind of future do you want to help create, and who are the allies that will help you build it?" A strong Eleventh House often indicates someone who is deeply engaged with social causes, comfortable in group settings, and energized by collaborative pursuits. These individuals often have wide social networks and feel a responsibility to contribute to the betterment of society.`,
    planetsInHouse: `Planets in the Eleventh House shape your social life and relationship with the collective. The Sun here creates someone whose identity is closely tied to group membership and social ideals. These individuals often become leaders within organizations or movements. The Moon in the Eleventh House creates a deep emotional need for belonging and friendship — the friend group functions almost like a second family. Mercury here produces a brilliant networker and communicator within groups, often serving as the person who connects everyone.

Venus in the Eleventh House brings social grace and often indicates deep, loving friendships. Romance may arise through friend groups or shared social causes. Mars here drives ambitious social goals and leadership within organizations, though it can also bring conflict within group dynamics. Jupiter in the Eleventh House is wonderfully fortunate for friendship and social life, attracting generous, supportive friends and bringing opportunities through networks and groups. Saturn here may indicate fewer but more enduring friendships and a serious approach to group commitments.

Uranus in its natural house amplifies the need for unconventional friendships and progressive social involvement. Neptune brings idealism to social causes and may attract creative or spiritual friend circles. Pluto in the Eleventh House transforms through group dynamics, often placing these individuals in positions of power within organizations or movements.`,
    signsOnCusp: `The sign on the Eleventh House cusp describes the nature of your friendships and your approach to group involvement. Fire signs (Aries, Leo, Sagittarius) here produce dynamic, leadership-oriented social styles. These individuals attract enthusiastic friends and are often the driving force within their social circles and organizations. Earth signs (Taurus, Virgo, Capricorn) on the cusp create a practical approach to friendship — these are loyal, reliable friends who prefer a small, stable social circle over a large, superficial one.

Air signs (Gemini, Libra, Aquarius) are naturally suited to the Eleventh House, producing individuals with wide, diverse social networks and a talent for bringing people together around ideas. They thrive in intellectual communities and collaborative environments. Water signs (Cancer, Scorpio, Pisces) here create emotionally close, deeply bonded friendships. These individuals may be drawn to support groups, spiritual communities, or organizations focused on emotional healing and compassion.`,
    transits: `Transits through the Eleventh House activate your social life, group affiliations, and long-term aspirations. Jupiter here brings a year of expanding social connections, new friendships, and opportunities through groups and organizations. It is an excellent time to join clubs, attend conferences, and invest in your social network. Saturn transiting the Eleventh House may thin out your social circle, as you evaluate which friendships are truly supportive and which have run their course. It is a time of social maturation and deeper commitment to meaningful communities.

Outer planet transits through the Eleventh House can fundamentally reshape your social world. Uranus here shakes up friend groups and draws you toward new, unconventional communities that better align with your evolving identity. Neptune's passage may dissolve boundaries within friendships, bringing either beautiful collective experiences or disillusionment with groups and causes. Pluto transiting the Eleventh House transforms your relationship with the collective — power dynamics within groups become intense, and you may emerge as a transformative leader within your community.`,
    faqs: [
      {
        question: 'What is the difference between the Eleventh House and the Seventh House for relationships?',
        answer:
          'The Seventh House governs one-on-one committed partnerships (marriage, business partners), while the Eleventh House governs friendships, group affiliations, and your broader social network. The Seventh is about deep individual bonds; the Eleventh is about community and collective connection.',
      },
      {
        question: 'Does the Eleventh House affect my goals and dreams?',
        answer:
          'Yes, the Eleventh House is traditionally called the House of Hopes and Wishes. It represents your long-term aspirations, the future you envision, and the social support systems that help you achieve your goals. The sign on the cusp and planets here shape the nature of your dreams and how you pursue them.',
      },
      {
        question: 'Can the Eleventh House show my relationship with technology?',
        answer:
          'Through its association with Aquarius and Uranus, the Eleventh House has a natural connection to technology, innovation, and progressive ideas. A prominent Eleventh House may indicate someone who is comfortable with technology, drawn to futuristic thinking, or involved in tech-related communities.',
      },
      {
        question: 'What if I have an empty Eleventh House?',
        answer:
          'An empty Eleventh House does not mean you will lack friends or social connection. The sign on the cusp and its ruling planet still describe your social nature and approach to group dynamics. Friendships may simply not be the dominant focus of your chart.',
      },
    ],
  },
  {
    slug: '12th-house',
    name: 'Twelfth House',
    number: 12,
    nickname: 'House of the Unconscious',
    rulingSign: 'Pisces',
    rulingSignSlug: 'pisces',
    rulingPlanet: 'Neptune',
    rulingPlanetSlug: 'neptune',
    element: 'Water',
    modality: 'Mutable',
    lifeAreas: [
      'The unconscious mind',
      'Spirituality and transcendence',
      'Hidden enemies and self-undoing',
      'Solitude and retreat',
      'Dreams and the imagination',
      'Karmic patterns and past lives',
    ],
    overview: `The Twelfth House is the final house of the zodiac wheel, representing the dissolution of the individual self into something greater — the collective unconscious, the spiritual realm, and the vast ocean of experience that lies beyond rational understanding. Naturally associated with Pisces and Neptune (and traditionally Jupiter), this is the house of the mystic, the dreamer, the healer, and the artist who channels something beyond personal consciousness. It is both the most challenging and the most transcendent house in the chart.

Traditionally known as the House of Self-Undoing, the Twelfth House governs the hidden patterns, unconscious habits, and karmic debts that operate below the surface of awareness. It is associated with confinement — hospitals, prisons, monasteries, and any place of withdrawal from ordinary life. But this confinement can be liberating when it takes the form of retreat, meditation, and spiritual practice. The Twelfth House represents the parts of yourself that you hide from the world, including both your greatest vulnerabilities and your most profound spiritual gifts.

The Twelfth House also governs the dream world, the imagination, and the experiences that dissolve the boundaries of ordinary reality. Sleep, meditation, psychic experiences, and mystical states of consciousness all belong here. A strong Twelfth House often indicates someone with unusual spiritual sensitivity, artistic inspiration drawn from the unconscious, or a calling to service that asks them to sacrifice personal comfort for a higher purpose. Understanding this house can reveal the hidden currents that shape your life from behind the scenes.`,
    planetsInHouse: `Planets in the Twelfth House operate in the realm of the unconscious and can be challenging to access directly. The Sun here may feel like a hidden light — there is tremendous spiritual power and creativity, but expressing it openly may feel difficult or scary. The Moon in the Twelfth House gives extraordinary emotional and psychic sensitivity, with the unconscious life being rich and vivid. Dreams may be particularly meaningful and prophetic. Mercury here creates a contemplative, introspective mind that processes information on a deep, intuitive level rather than a purely logical one.

Venus in the Twelfth House often indicates secret loves, hidden artistic talent, or a capacity for unconditional compassion. Mars here can create frustration around asserting yourself directly, channeling energy instead into spiritual practice or behind-the-scenes action. Jupiter in the Twelfth House is a classic placement for spiritual protection, guardian angels, and a deep, natural faith that sustains through difficulty. Saturn here confronts you with unconscious fears and karmic patterns that require disciplined inner work to resolve.

Uranus in the Twelfth House brings sudden flashes of spiritual insight and an unconventional inner life. Neptune in its natural house amplifies psychic sensitivity, spiritual longing, and creative imagination to extraordinary levels. Pluto here works transformative power in the unconscious, and individuals with this placement often undergo profound psychological or spiritual transformation through confronting their deepest fears and shadow material.`,
    signsOnCusp: `The sign on the Twelfth House cusp shapes your relationship with the unconscious, spirituality, and the hidden dimensions of life. Fire signs (Aries, Leo, Sagittarius) here suggest that unconscious patterns may relate to identity, ego, and the need for recognition. Spiritual practices that are active and expressive — dance, ritual, or adventure-based retreats — may be particularly effective. Earth signs (Taurus, Virgo, Capricorn) on the cusp create a practical approach to spiritual life, with grounding practices like meditation, gardening, or body-based healing being most beneficial.

Air signs (Gemini, Libra, Aquarius) on the Twelfth House cusp suggest that unconscious patterns relate to communication, relationships, or social belonging. Journaling, talk therapy, and intellectual approaches to spiritual growth can be healing. Water signs (Cancer, Scorpio, Pisces) are deeply attuned to the Twelfth House realm, and having these signs on the cusp often indicates strong psychic sensitivity, vivid dreams, and a natural capacity for spiritual experience. These individuals may need to guard their energy carefully and develop healthy boundaries.`,
    transits: `Transits through the Twelfth House are periods of withdrawal, inner reflection, and spiritual preparation. Jupiter here can bring a year of spiritual growth, creative inspiration, and the quiet resolution of difficulties that have plagued you. It is a time when guardian angels seem particularly active. Saturn transiting the Twelfth House asks you to confront unconscious fears, karmic patterns, and anything you have been avoiding. This transit can feel isolating but serves to clear away psychological debris before Saturn crosses your Ascendant and begins a new cycle.

Outer planet transits through the Twelfth House are among the most mystically significant in astrology. Uranus here may bring sudden spiritual awakenings or disruptive encounters with your unconscious material. Neptune passing through its own house dissolves the boundary between ordinary reality and the spiritual realm, bringing heightened sensitivity, vivid dreams, and potential confusion about where reality ends and imagination begins. Pluto transiting the Twelfth House brings the deepest possible psychological transformation, requiring you to descend into the underworld of your unconscious and emerge fundamentally changed.`,
    faqs: [
      {
        question: 'Is the Twelfth House really about self-undoing?',
        answer:
          'The traditional association with self-undoing refers to unconscious patterns that sabotage your efforts — habits, fears, and compulsions you are not aware of. Modern astrology frames this more constructively: the Twelfth House shows where conscious awareness can illuminate and heal these hidden patterns, transforming weakness into spiritual strength.',
      },
      {
        question: 'Does the Twelfth House indicate past lives?',
        answer:
          'Many astrologers associate the Twelfth House with karmic patterns and past-life experiences. Whether you interpret this literally or metaphorically, the Twelfth House does describe inherited psychological patterns and unconscious tendencies that feel older and deeper than your current lifetime.',
      },
      {
        question: 'Why is the Twelfth House associated with hospitals and prisons?',
        answer:
          'Traditionally, the Twelfth House governs places of confinement and isolation — hospitals, prisons, monasteries, and retreat centers. This reflects the house\'s themes of withdrawal from ordinary life, whether voluntary (spiritual retreat) or involuntary (illness, incarceration).',
      },
      {
        question: 'How can I work with my Twelfth House constructively?',
        answer:
          'Meditation, dream work, therapy, journaling, artistic expression, and spiritual practice are all constructive Twelfth House activities. The key is developing conscious awareness of your unconscious patterns, cultivating compassion for yourself and others, and finding healthy outlets for your spiritual sensitivity.',
      },
    ],
  },
]

export default houses
