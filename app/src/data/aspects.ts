export interface Aspect {
  slug: string
  name: string
  symbol: string
  degrees: number
  orb: string
  nature: string
  keywords: string[]
  overview: string
  inNatal: string
  inSynastry: string
  inTransit: string
  examplePairs: { planets: string; meaning: string }[]
  faqs: { question: string; answer: string }[]
}

const aspects: Aspect[] = [
  {
    slug: 'conjunction',
    name: 'Conjunction',
    symbol: '☌',
    degrees: 0,
    orb: '8-10° for luminaries, 6-8° for personal planets',
    nature: 'Neutral',
    keywords: ['Fusion', 'Intensity', 'Concentration', 'Unity', 'Amplification', 'Beginning'],
    overview: `The conjunction is the most powerful aspect in astrology, formed when two planets occupy the same degree of the zodiac (or within orb, typically 6-10 degrees depending on the planets involved). A conjunction represents the fusion of two planetary energies into a single, intensified expression. The two planets involved become inseparable partners, blending their natures in a way that is neither inherently harmonious nor challenging — the result depends entirely on which planets are conjoined and how they interact with the rest of the chart.

Conjunctions mark new beginnings. The most familiar conjunction is the New Moon — when the Sun and Moon align in the same degree, initiating a fresh lunar cycle. This principle of initiation applies to all conjunctions: when two planets come together, they plant a seed of combined energy that will unfold over time. In the birth chart, conjunctions represent areas of concentrated focus and intensity. The life areas governed by the conjoined planets are deeply intertwined, and the native may find it impossible to express one energy without the other.

The nature of a conjunction depends heavily on the planets involved. A conjunction between Venus and Jupiter is one of the most fortunate combinations in astrology, blending love and abundance. A conjunction between Mars and Saturn fuses drive with discipline — powerful but potentially frustrating if the energies are not consciously integrated. The Sun conjunct Pluto creates a personality of extraordinary intensity and transformative power. Understanding the specific planetary combination is essential to interpreting any conjunction.

Conjunctions are considered the starting point of all planetary cycles. When two planets come together in conjunction, they begin a new cycle of relationship that unfolds through subsequent aspects (sextile, square, trine, opposition) before returning to conjunction again. This cyclical process gives conjunctions their quality of fresh beginning and concentrated potential.`,
    inNatal: `In the natal chart, a conjunction represents an area of concentrated energy and focused expression. The two planets involved become so deeply blended that the native may struggle to distinguish between them — they experience both energies as a single, unified force. For example, someone with Mercury conjunct Mars thinks and speaks with assertive directness; separating thought from action feels nearly impossible. This concentration can be a tremendous asset, creating people with unusual focus and intensity in the conjoined area.

The challenge of natal conjunctions is that the concentrated energy can become overwhelming or one-sided. When two planets are fused, it may be difficult to access either one independently. A Venus-Saturn conjunction may blend love with caution so thoroughly that the native struggles to experience pure, uncomplicated joy in relationships. The key to working with natal conjunctions is awareness — recognizing the blend and learning to consciously modulate the expression of each planetary energy rather than letting them run together unconsciously.`,
    inSynastry: `Conjunctions between two people's charts are among the most powerful connections in synastry. When one person's planet conjuncts another's, there is an immediate sense of recognition and intensity. The conjoined energies feel almost inseparable — the two people activate something deep and concentrated in each other. Venus conjunct Mars between charts creates magnetic physical attraction. Sun conjunct Moon creates a natural sense of complementarity and belonging. Mercury conjunctions produce effortless intellectual rapport.

However, not all synastry conjunctions are comfortable. Saturn conjunct another person's Sun or Moon can feel like a heavy weight on the partner's self-expression or emotional life. Pluto conjunctions create intense, transformative bonds that can feel fated but also overwhelming. The key to navigating synastry conjunctions is recognizing that the intense connection requires conscious management — the concentrated energy must be given healthy expression or it may become compulsive or consuming.`,
    inTransit: `Transit conjunctions mark the beginning of new cycles in specific areas of your life. When a transiting planet conjuncts a natal planet, it activates and intensifies that natal energy, often bringing new beginnings, fresh starts, and concentrated periods of activity related to the planets involved. The transiting planet "infuses" the natal planet with its energy, creating a temporary but powerful combination.

The significance of a transit conjunction depends on the speed and nature of the transiting planet. Fast-moving transits (Moon, Mercury, Venus, Sun) bring brief but noticeable activations. Slower transits (Jupiter, Saturn) mark significant turning points that unfold over weeks or months. The outer planet transits (Uranus, Neptune, Pluto) conjunct natal planets only a few times in a lifetime and represent truly transformative, once-in-a-generation experiences that can reshape the foundation of your life.`,
    examplePairs: [
      { planets: 'Sun conjunct Moon', meaning: 'The core identity and emotional nature are fused, creating a person of concentrated will and self-alignment, born near a New Moon. There is unusual unity between what they want and what they feel.' },
      { planets: 'Venus conjunct Mars', meaning: 'Love and desire are inseparable, creating a magnetic, passionate nature. These individuals blend receptivity and assertiveness, often possessing both charm and boldness in relationships.' },
      { planets: 'Mercury conjunct Jupiter', meaning: 'The mind is expansive, optimistic, and oriented toward big-picture thinking. Excellent for teachers, writers, and philosophers who synthesize diverse knowledge into inspiring communication.' },
      { planets: 'Saturn conjunct Pluto', meaning: 'Discipline meets transformative power, creating extraordinary ambition and the capacity to restructure reality. This generational aspect marks periods of massive institutional transformation.' },
      { planets: 'Sun conjunct Neptune', meaning: 'Identity merges with the imaginative and spiritual, creating artists, healers, and dreamers. There may be challenges with self-definition, but the creative and compassionate potential is extraordinary.' },
    ],
    faqs: [
      {
        question: 'Is a conjunction always the strongest aspect?',
        answer: 'The conjunction is generally considered the most intense aspect because the planetary energies are completely fused. However, the opposition and square can be equally powerful in their effects — they simply operate through tension and challenge rather than fusion and concentration.',
      },
      {
        question: 'Can a conjunction be negative?',
        answer: 'Conjunctions are neutral in nature — they amplify whatever combination of planets is involved. Venus-Jupiter conjunctions tend to be delightful, while Mars-Saturn conjunctions can feel frustrating. The outcome depends on the specific planets, their condition, and how the native works with the blended energy.',
      },
      {
        question: 'What does it mean to have multiple conjunctions in my chart?',
        answer: 'Multiple conjunctions (especially a stellium — three or more planets conjunct) indicate areas of extraordinary concentration and focus. These individuals have powerful, complex energy in the conjoined area and may feel driven to express it in significant ways throughout their lives.',
      },
      {
        question: 'How tight does a conjunction need to be?',
        answer: 'The closer the conjunction (fewer degrees of separation), the more powerful its effect. An exact conjunction (0°) is the strongest. Most astrologers allow an orb of 8-10° for conjunctions involving the Sun or Moon, and 6-8° for other planets. Conjunctions within 1-2° are especially potent.',
      },
    ],
  },
  {
    slug: 'opposition',
    name: 'Opposition',
    symbol: '☍',
    degrees: 180,
    orb: '8-10° for luminaries, 6-8° for personal planets',
    nature: 'Challenging',
    keywords: ['Polarity', 'Awareness', 'Projection', 'Balance', 'Relationship', 'Tension'],
    overview: `The opposition is the aspect of polarity, formed when two planets are 180 degrees apart — directly across the zodiac from each other. This creates a dynamic tension between two opposing forces that demand integration and balance. The opposition is classified as a challenging or "hard" aspect, but its challenge is fundamentally different from the square: while the square creates internal friction, the opposition creates external tension that typically manifests through relationships, projections, and the need to find the middle ground between two valid but seemingly contradictory energies.

The opposition is the aspect of awareness. At the Full Moon — the most familiar opposition — the Sun and Moon face each other across the sky, flooding the night with light. This illumination is the gift of every opposition: what was unconscious becomes visible, what was hidden is brought into the open, and you are forced to acknowledge both sides of a polarity. Oppositions in the birth chart mark areas where you experience a seesaw dynamic — swinging between two poles until you learn to integrate both.

The psychological challenge of the opposition is projection. Because the two planetary energies feel like they are pulling in opposite directions, the native may identify with one end of the opposition and project the other onto people in their environment. For example, someone with Mars opposite Neptune might express Mars directly (assertiveness) while projecting Neptune (passivity, spirituality) onto their partners. The growth path of the opposition is integration — learning to own and express both poles consciously rather than living out one side while projecting the other.

Despite their challenging nature, oppositions are powerful generators of awareness, creativity, and relational wisdom. The tension between opposites creates a dynamic energy that, when harnessed, produces remarkable balance, objectivity, and the ability to see multiple perspectives simultaneously.`,
    inNatal: `Natal oppositions indicate areas of life where you experience a fundamental polarity — two competing needs that must be balanced and integrated. The houses activated by the opposition describe the life arenas in tension, while the planets describe the specific energies that pull in opposite directions. For example, a Moon-Saturn opposition creates a tension between emotional needs (Moon) and duty or restriction (Saturn), often manifesting as a difficulty in balancing vulnerability with responsibility.

The gift of natal oppositions is the development of awareness and relational skill. Because oppositions often manifest through relationships — we project the side we are less comfortable with onto partners, friends, or adversaries — they are powerful teachers of interpersonal dynamics. The person with many oppositions in their chart often develops exceptional ability to see both sides of any issue, mediating between competing perspectives with hard-won wisdom. The key is to stop swinging between the poles and find the balance point where both energies can coexist.`,
    inSynastry: `Oppositions between two people's charts create magnetic attraction and dynamic tension. There is a powerful sense of complementarity — each person embodies something the other lacks or has difficulty expressing. Sun opposite Moon in synastry is one of the classic indicators of romantic attraction, creating a yin-yang dynamic where each person fulfills the other's complementary needs. Venus opposite Mars generates strong sexual and romantic polarity.

However, synastry oppositions also create ongoing tension that requires conscious negotiation. What initially feels like exciting complementarity can become a source of conflict if both people insist on their own pole without acknowledging the validity of the other. The most successful relationships with strong oppositions are those where both partners learn to appreciate their differences as complementary strengths rather than threats, using the tension as creative fuel rather than a battleground.`,
    inTransit: `Transit oppositions represent culmination points and moments of confrontation. Just as the Full Moon brings the lunar cycle to its peak, transit oppositions bring planetary cycles to moments of maximum awareness and potential crisis. When a transiting planet opposes a natal planet, the themes of both planets are brought into sharp focus, often through external events, confrontations, or relationship dynamics that force you to address imbalances.

Slow-moving transit oppositions (Jupiter, Saturn, outer planets) are particularly significant. Saturn opposing your natal Sun or Moon is a time of reckoning — are you living authentically? Uranus in opposition can bring sudden disruptions that force freedom. Neptune opposing natal planets can dissolve certainties and create confusion that ultimately serves spiritual growth. Pluto oppositions are among the most intense transits in astrology, creating power confrontations that demand transformation at the deepest level.`,
    examplePairs: [
      { planets: 'Sun opposite Moon', meaning: 'Born near a Full Moon, this person experiences a fundamental tension between conscious purpose (Sun) and emotional needs (Moon). Awareness is heightened, and relationships serve as mirrors for self-understanding.' },
      { planets: 'Venus opposite Saturn', meaning: 'Love and duty create a seesaw — warmth versus restraint, pleasure versus discipline. Relationships may feel burdened or delayed, but enduring, deeply committed bonds can form through patient integration.' },
      { planets: 'Mars opposite Neptune', meaning: 'Action versus surrender, assertion versus dissolution. There may be confusion about how to assert yourself, but this aspect can produce extraordinary spiritual warriors and compassionate activists.' },
      { planets: 'Jupiter opposite Pluto', meaning: 'Expansion meets intensity, creating powerful ambition and the potential for transformative impact. The tension between optimism and psychological depth must be balanced to avoid excess or manipulation.' },
      { planets: 'Mercury opposite Uranus', meaning: 'The mind oscillates between methodical thinking and brilliant flashes of insight. Communication may be erratic but innovative. Learning to channel the mental electricity into coherent expression is the growth path.' },
    ],
    faqs: [
      {
        question: 'Are oppositions always difficult?',
        answer: 'Oppositions are challenging in the sense that they require conscious effort to balance, but they are not inherently negative. They generate awareness, creativity, and relational wisdom. Many highly successful people have strong oppositions that they have learned to harness as productive tension.',
      },
      {
        question: 'How do oppositions differ from squares?',
        answer: 'Oppositions create external tension that manifests through relationships and polarized situations, while squares create internal friction and crisis that drives action. Oppositions teach awareness and balance; squares teach through pressure and the necessity to act.',
      },
      {
        question: 'Do oppositions always involve projection?',
        answer: 'Projection is a common dynamic with oppositions, but it is not inevitable. With self-awareness, you can learn to own both ends of the opposition, expressing both planetary energies consciously rather than projecting one onto others. This is the mature expression of the opposition.',
      },
      {
        question: 'What orb should I use for oppositions?',
        answer: 'Most astrologers use an orb of 8-10° for oppositions involving the Sun or Moon, and 6-8° for other planets. Some astrologers use tighter orbs (4-6°) for more precision. The closer the opposition to exact, the more powerfully it is felt.',
      },
    ],
  },
  {
    slug: 'trine',
    name: 'Trine',
    symbol: '△',
    degrees: 120,
    orb: '6-8° for luminaries, 4-6° for personal planets',
    nature: 'Harmonious',
    keywords: ['Flow', 'Talent', 'Ease', 'Harmony', 'Grace', 'Natural ability'],
    overview: `The trine is the most harmonious aspect in astrology, formed when two planets are 120 degrees apart. Trines connect planets in signs of the same element (fire to fire, earth to earth, air to air, water to water), creating a natural flow of energy between the planetary functions involved. The trine represents innate talent, ease, and the areas of life where things seem to work effortlessly — where your natural gifts reside and where the universe seems to cooperate with your intentions.

The beauty of the trine lies in its effortless quality. Unlike the challenging aspects that create tension and friction, the trine allows planetary energies to support and enhance each other naturally. A Sun-Jupiter trine creates a naturally optimistic, confident personality. A Venus-Neptune trine bestows artistic sensitivity and romantic idealism with seemingly effortless grace. The trine is the aspect of gifts you were born with — talents that feel so natural you may not even recognize them as special.

However, the trine's ease is also its potential weakness. Because trined energies flow so naturally, there is a risk of taking them for granted. Trines do not create the friction necessary for motivation, and individuals with many trines may lack the drive to develop their gifts to their full potential. The person with a challenging square may ultimately achieve more than the person with an easy trine, simply because the square demands effort while the trine invites complacency. The most successful use of trine energy involves consciously developing and sharing your natural talents rather than coasting on them.

Trines are associated with grace, creativity, and the sense that certain areas of your life are blessed. In traditional astrology, trines were considered the most fortunate aspect, associated with the element of harmony and the principle that like supports like. The trine reminds us that not everything in life needs to be a struggle — some things are simply gifts, and our job is to receive and cultivate them gratefully.`,
    inNatal: `Natal trines represent areas of natural talent, ease, and flow. The planets connected by a trine work together harmoniously, supporting each other's expression without conflict or tension. These are the areas of your life where things come naturally — where you have innate abilities that others may struggle to develop. A Mercury-Saturn trine, for example, gives natural mental discipline and the ability to think in structured, organized patterns without effort.

The challenge with natal trines is development. Because the energy flows so easily, there may be little motivation to push beyond the comfort zone or develop the talent to its full capacity. The most effective approach is to pair trine energy with the motivation provided by squares or oppositions elsewhere in the chart. Someone with a Venus-Neptune trine has extraordinary artistic potential, but they may need the pressure of a Saturn square to actually produce finished work. Understanding your trines helps you identify your gifts; consciously developing them is your responsibility.`,
    inSynastry: `Trines between two people's charts indicate areas of natural compatibility and ease. These connections feel comfortable, supportive, and almost effortless — the two people understand each other on an instinctive level in the areas covered by the trined planets. Sun trine Moon is one of the classic indicators of long-term compatibility, creating a sense of natural harmony between one person's identity and the other's emotional nature. Venus trine Venus suggests shared values and aesthetic preferences.

While synastry trines are beautiful and important for relationship sustainability, they can sometimes lack the spark that more dynamic aspects provide. A relationship based entirely on trines may feel comfortable but unstimulating. The most fulfilling relationships typically combine the ease of trines with the dynamic energy of some squares or oppositions, creating a bond that is both supportive and growth-promoting.`,
    inTransit: `Transit trines bring periods of ease, opportunity, and favorable flow in the areas of life governed by the involved planets. When a transiting planet trines a natal planet, doors open, support appears, and progress comes with less effort than usual. Jupiter trining your natal Sun brings a period of confidence, opportunity, and positive recognition. Saturn trining natal Venus can stabilize relationships and bring mature, lasting romantic commitments.

The key to maximizing transit trines is to take conscious action while the favorable energy is available. Trines offer opportunity but do not force change — you must actively step through the doors that open. Because the energy feels so comfortable, there is a tendency to simply enjoy the pleasant period without capitalizing on it. The most productive approach is to use trine transits as launch windows for initiatives that benefit from the harmonious planetary support.`,
    examplePairs: [
      { planets: 'Sun trine Jupiter', meaning: 'Natural confidence, optimism, and the ability to attract opportunity. Life unfolds with a sense of expansion and positive momentum. These individuals inspire others with their genuine faith in possibility.' },
      { planets: 'Moon trine Venus', meaning: 'Emotional warmth and social grace flow effortlessly. Relationships are naturally harmonious, and there is an instinctive understanding of what others need. Artistic sensitivity and emotional intelligence are innate gifts.' },
      { planets: 'Mars trine Saturn', meaning: 'Action and discipline work together seamlessly. These individuals possess natural endurance, strategic ability, and the capacity to work consistently toward long-term goals without burning out.' },
      { planets: 'Mercury trine Neptune', meaning: 'The mind effortlessly accesses imagination, intuition, and creative inspiration. Gifted storytellers, poets, and visionaries who channel the ethereal into communicable form with natural ease.' },
      { planets: 'Venus trine Pluto', meaning: 'Love and transformation flow together — relationships are deeply meaningful and naturally evolving. There is a magnetic quality to the affections and a capacity for profound, regenerative love.' },
    ],
    faqs: [
      {
        question: 'Can you have too many trines?',
        answer: 'A chart dominated by trines without challenging aspects (squares, oppositions) can produce someone with enormous potential but insufficient motivation to develop it. The ease of trines needs the friction of hard aspects to drive action and growth. Balance between harmonious and challenging aspects is ideal.',
      },
      {
        question: 'Do trines guarantee success?',
        answer: 'Trines indicate natural talent and favorable conditions, but they do not guarantee success. Talent without effort often goes undeveloped. Many highly successful people have charts dominated by squares and oppositions that drove them to develop their abilities through determined effort.',
      },
      {
        question: 'Are Grand Trines always positive?',
        answer: 'A Grand Trine (three planets each 120° apart, forming a triangle) creates a self-contained circuit of harmonious energy. While beautiful, it can also become a closed loop of complacency. The most effective Grand Trines include an aspect from an outside planet that breaks the circuit and provides motivation.',
      },
      {
        question: 'What is the difference between a trine and a sextile?',
        answer: 'Both are harmonious aspects, but trines (120°) represent innate talent that flows naturally, while sextiles (60°) represent opportunities that require some conscious effort to activate. Trines are gifts; sextiles are invitations.',
      },
    ],
  },
  {
    slug: 'square',
    name: 'Square',
    symbol: '□',
    degrees: 90,
    orb: '6-8° for luminaries, 4-6° for personal planets',
    nature: 'Challenging',
    keywords: ['Tension', 'Friction', 'Challenge', 'Growth', 'Action', 'Crisis'],
    overview: `The square is the most dynamic and action-producing aspect in astrology, formed when two planets are 90 degrees apart. Squares connect planets in signs of incompatible elements and modalities, creating a fundamental friction between two energies that both demand expression but cannot easily coexist. This tension is uncomfortable — but it is also the most powerful driver of growth, achievement, and personal development in the entire chart. Squares are the engines that force you to act, evolve, and overcome obstacles.

The square represents crisis — the turning point where comfortable stagnation becomes impossible and change is demanded. In the lunation cycle, the First Quarter Square (Sun square Moon) is the moment when the initial impulse of the New Moon encounters its first real obstacle, and the question becomes: will you push through or give up? This principle applies to all squares: they are tests of resolve, demanding that you find creative solutions to seemingly irreconcilable tensions.

Unlike the opposition, which creates awareness through external reflection, the square creates internal friction that manifests as frustration, restlessness, and the urgent need to do something. Squares are not subtle — they demand action. This is why many of the most accomplished and dynamic individuals have charts dominated by squares. The tension created by squares builds psychological muscle, develops resourcefulness, and ultimately produces the strength of character that comes only through overcoming real challenges.

The traditional astrological view of squares as purely negative has evolved considerably. Modern astrology recognizes that while squares are undeniably challenging, they are also the primary generators of motivation, creativity, and achievement. Without squares, the chart may lack the drive necessary to turn potential into reality. The square is the aspect that refuses to let you rest, demanding instead that you grow.`,
    inNatal: `Natal squares represent areas of fundamental internal tension that drive you toward growth and achievement. The two planets involved have conflicting needs that cannot be easily reconciled, creating an ongoing dynamic of frustration and creative problem-solving. For example, a Moon-Mars square creates a tension between the need for emotional security (Moon) and the drive for action and independence (Mars), often manifesting as emotional volatility that must be consciously managed.

The beauty of natal squares is that they develop strength. The areas of life governed by squared planets are where you are forced to work hardest, and consequently where you develop your most impressive abilities. A Saturn-Mars square may feel like driving with the brakes on, but it ultimately produces extraordinary discipline and the ability to persist through obstacles that would stop others. People who learn to work with their natal squares often achieve far more than those with easier charts, precisely because the friction forced them to develop real skill and resilience.`,
    inSynastry: `Squares between two people's charts create dynamic, sometimes volatile connections that generate chemistry, challenge, and growth. While synastry trines feel easy and comfortable, squares create the spark of tension that keeps a relationship alive and evolving. Venus square Mars between charts generates strong sexual tension — there is both attraction and friction, creating a push-pull dynamic that can be exciting but also exhausting if not managed consciously.

Synastry squares indicate areas where two people fundamentally challenge each other. This can manifest as disagreements, power struggles, or simply different approaches to the same issue. However, these challenges are also opportunities for both people to grow beyond their comfort zones. The key is whether both partners can use the tension constructively — as fuel for growth rather than ammunition for conflict. Relationships with no squares may feel safe but stagnant, while those with squares offer the dynamic energy needed for genuine evolution.`,
    inTransit: `Transit squares represent crisis points and turning points — moments when the status quo is challenged and action is required. When a transiting planet squares a natal planet, the tension between the two energies reaches a breaking point, forcing you to address issues that have been building. Saturn squaring your natal Moon may bring an emotional crisis that demands greater maturity and responsibility in your domestic or emotional life. Jupiter squaring natal Venus may overexpand social and romantic life in ways that need correction.

The most significant transit squares come from the slower-moving planets. The Saturn square (occurring approximately every seven years) marks a quarter-cycle point where the structures in your life are tested. The Uranus square to its natal position (around ages 21 and 63) brings crises of freedom and authenticity. Pluto squares can last for years, bringing intense, transformative pressure that fundamentally reshapes the areas of life involved. The key to surviving and thriving through transit squares is to face the challenge directly rather than resisting or avoiding it.`,
    examplePairs: [
      { planets: 'Sun square Saturn', meaning: 'Identity meets restriction, creating a lifelong tension between self-expression and duty. These individuals often become highly accomplished through the discipline forced upon them, achieving through persistent effort what others cannot.' },
      { planets: 'Moon square Pluto', meaning: 'Emotional intensity is extreme, with deep psychological patterns driving emotional life. Feelings are powerful, sometimes overwhelming, but this aspect develops extraordinary emotional resilience and psychological insight.' },
      { planets: 'Venus square Neptune', meaning: 'Romance is idealized but often disappointing in reality. Creative imagination is extraordinary, but discernment in love must be consciously developed. This aspect often produces gifted artists who channel romantic longing into art.' },
      { planets: 'Mars square Uranus', meaning: 'The drive for action conflicts with the need for freedom, creating sudden, explosive energy. These individuals must learn to channel their rebellious, impulsive nature constructively or risk accidents and conflicts.' },
      { planets: 'Mercury square Saturn', meaning: 'Thinking and communication meet obstacles — early learning difficulties, self-doubt about intelligence, or fear of speaking. Over time, this produces extremely disciplined, thorough thinkers whose ideas carry weight and authority.' },
    ],
    faqs: [
      {
        question: 'Are squares always bad in astrology?',
        answer: 'No. Squares are challenging, not bad. They create the tension and friction necessary for growth, achievement, and character development. Many highly successful people have charts dominated by squares. The key is learning to work with the tension constructively rather than being overwhelmed by it.',
      },
      {
        question: 'What is a T-square?',
        answer: 'A T-square occurs when two planets in opposition both square a third planet, forming a T-shaped pattern. This creates a focal point of intense energy and challenge at the apex planet. T-squares drive tremendous achievement but also significant stress — they are among the most powerful and dynamic chart patterns.',
      },
      {
        question: 'How do squares differ from oppositions?',
        answer: 'Squares create internal friction that drives action — you feel pushed to do something about the tension. Oppositions create external awareness through polarity and projection, typically manifesting through relationships. Both are challenging aspects, but they operate through different mechanisms.',
      },
      {
        question: 'Can squares between compatible planets be easy?',
        answer: 'Even squares between naturally compatible planets (like Venus and Jupiter) create excess and imbalance that must be managed. A Venus-Jupiter square is not painful, but it can produce overindulgence, laziness, or taking good fortune for granted. No square is truly "easy" — each demands conscious attention.',
      },
    ],
  },
  {
    slug: 'sextile',
    name: 'Sextile',
    symbol: '⚹',
    degrees: 60,
    orb: '4-6° for luminaries, 2-4° for personal planets',
    nature: 'Harmonious',
    keywords: ['Opportunity', 'Cooperation', 'Skill', 'Communication', 'Potential', 'Resourcefulness'],
    overview: `The sextile is a harmonious aspect formed when two planets are 60 degrees apart, connecting signs of compatible but different elements — typically fire with air, or earth with water. The sextile represents opportunity, cooperation, and the potential for productive exchange between two planetary energies. Unlike the trine, which bestows natural talent that flows effortlessly, the sextile offers opportunities that require conscious recognition and deliberate effort to activate. It is the aspect of invitation rather than inheritance.

The sextile has a communicative, Mercurial quality. It connects signs that "speak the same language" — fire and air share the quality of active, outward expression, while earth and water share receptive, inward-oriented energy. This compatibility creates openings for collaboration between the planetary functions involved. A Mercury-Venus sextile, for instance, creates the potential for graceful communication and diplomatic skill, but the individual must consciously develop and practice these abilities for the talent to fully manifest.

In traditional astrology, the sextile was considered a mildly benefic aspect — pleasant and helpful but less powerful than the trine. Modern astrology has elevated the sextile's importance by recognizing that opportunities requiring effort often produce more satisfying results than gifts received without work. The sextile rewards initiative: if you reach for the opening it provides, you gain skills, connections, and achievements that feel genuinely earned.

The sextile also has an innovative quality. Because it connects different elements, it facilitates the cross-pollination of ideas and approaches. Earth-water sextiles blend practical skill with emotional intelligence. Fire-air sextiles combine enthusiasm with intellectual clarity. This productive blending of different but compatible energies makes the sextile an aspect of creative problem-solving and resourceful adaptation.`,
    inNatal: `Natal sextiles represent areas of latent talent and available opportunity. Unlike trines, which operate automatically, sextiles require conscious effort to activate their potential. The planets connected by a sextile have a natural affinity but need you to build the bridge between them deliberately. A Moon-Mercury sextile gives the potential for emotional intelligence and intuitive communication, but this potential must be developed through practice — journaling, therapy, or conscious effort to put feelings into words.

The advantage of natal sextiles over trines is that the abilities they develop are more genuinely skill-based. Because some effort is required, the resulting competencies feel earned and are more consciously controlled. A person with many sextiles may appear highly skilled and resourceful — someone who can draw on a diverse toolkit of abilities. The key is to recognize and act on the opportunities your sextiles provide rather than waiting for things to happen automatically.`,
    inSynastry: `Sextiles between two people's charts indicate areas of easy cooperation and mutual support. The two people find it natural to collaborate in the areas covered by the sextiled planets, and they tend to bring out the best in each other through gentle encouragement rather than intense challenge. Sun sextile Moon between charts creates a sense of friendly compatibility and mutual understanding. Venus sextile Mars produces an easy, pleasant attraction with room for both people to maintain their individuality.

Synastry sextiles provide the glue of friendship and cooperation that sustains relationships over time. While they may lack the dramatic intensity of conjunctions, squares, or oppositions, sextiles create the foundation of mutual respect and productive collaboration that healthy long-term relationships require. A chart comparison with many sextiles suggests two people who genuinely like each other, work well together, and support each other's growth in practical, constructive ways.`,
    inTransit: `Transit sextiles bring periods of opportunity that reward initiative and action. When a transiting planet sextiles a natal planet, a window opens for productive action in the areas of life governed by the involved planets. Jupiter sextile natal Venus may bring a social or romantic opportunity that requires you to show up and participate. Saturn sextile natal Mercury offers the chance to formalize your ideas or communication skills through disciplined study or professional development.

Transit sextiles are easy to miss because they do not force anything — they simply make favorable conditions available. Unlike squares and oppositions, which demand attention through crisis, sextiles whisper rather than shout. The most productive approach is to track your sextile transits and consciously look for the opportunities they present. Taking even small actions during favorable sextile transits can produce disproportionately positive results because you are working with the natural flow of planetary energy.`,
    examplePairs: [
      { planets: 'Sun sextile Mars', meaning: 'Vitality and drive cooperate productively, creating the ability to take confident, well-directed action. These individuals channel their energy effectively and recover quickly from setbacks. Leadership feels natural when they choose to step forward.' },
      { planets: 'Moon sextile Jupiter', meaning: 'Emotional generosity and optimism are available when consciously cultivated. There is a natural openness to growth, a nurturing philosophy of life, and the ability to uplift others emotionally when the individual chooses to engage.' },
      { planets: 'Venus sextile Saturn', meaning: 'Love and commitment work together when given conscious attention. There is the potential for enduring, mature relationships and artistic discipline. Beauty is achieved through craft and patience rather than raw talent alone.' },
      { planets: 'Mercury sextile Uranus', meaning: 'The mind has access to innovative, original thinking when actively engaged. These individuals can think outside the box and communicate unconventional ideas effectively, especially when they create space for creative thought.' },
      { planets: 'Mars sextile Neptune', meaning: 'Action and imagination cooperate — the potential for inspired, compassionate action. These individuals can channel spiritual or creative vision into practical effort, making idealistic goals achievable through determined work.' },
    ],
    faqs: [
      {
        question: 'How does a sextile differ from a trine?',
        answer: 'Both are harmonious, but they work differently. Trines represent innate talent that operates automatically — gifts you were born with. Sextiles represent opportunities that require recognition and effort to activate. Trines are like trust funds; sextiles are like job offers — valuable, but you have to show up.',
      },
      {
        question: 'Are sextiles important in chart interpretation?',
        answer: 'While sometimes overlooked in favor of more dramatic aspects, sextiles are valuable indicators of available resources and cooperative potential. They show where you can develop skills and create opportunities with relatively little friction. Many astrologers consider sextiles important supporting aspects.',
      },
      {
        question: 'What orb should I use for sextiles?',
        answer: 'Sextiles use a smaller orb than major aspects — typically 4-6° for sextiles involving the Sun or Moon, and 2-4° for other planets. The tighter the orb, the more noticeable the sextile\'s influence. Some astrologers use even tighter orbs of 2-3° for all sextiles.',
      },
      {
        question: 'Can sextiles exist between planets in the same element?',
        answer: 'Typically, sextiles connect signs of different but compatible elements (fire-air or earth-water). However, due to orb allowances, a sextile can occasionally connect planets at the late degrees of one sign and the early degrees of a sign two positions away, which may technically be in different element pairings. The elemental compatibility still applies.',
      },
    ],
  },
]

export default aspects
