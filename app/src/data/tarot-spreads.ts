export interface TarotSpread {
  slug: string
  name: string
  cardCount: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  purpose: string
  bestFor: string[]
  overview: string
  positions: { number: number; name: string; meaning: string }[]
  howToRead: string
  tips: string[]
  variations: string
  faqs: { question: string; answer: string }[]
}

const tarotSpreads: TarotSpread[] = [
  {
    slug: 'celtic-cross',
    name: 'Celtic Cross',
    cardCount: 10,
    difficulty: 'Advanced',
    purpose: 'A comprehensive reading that examines all aspects of a situation from root causes to final outcomes.',
    bestFor: [
      'Complex life questions requiring deep analysis',
      'Understanding hidden influences and obstacles',
      'Getting a complete picture of past, present, and future',
      'Major life decisions and crossroads',
    ],
    overview: `The Celtic Cross is the most iconic and widely used tarot spread in the world. Dating back to the late 19th century and popularized by Arthur Edward Waite, this ten-card layout provides a thorough examination of any question or situation. It reveals not only what is happening on the surface but also the deeper currents that shape your path.

What makes the Celtic Cross so powerful is its layered approach. The first six cards form a cross that maps the heart of the situation — your present circumstances, the challenge you face, your conscious and unconscious influences, your recent past, and your near future. The remaining four cards form a staff that explores your inner world, your environment, your hopes and fears, and the ultimate outcome.

Because of its depth, the Celtic Cross works best when you have a specific situation or question in mind. It is not ideal for vague queries. Come prepared with a clear intention, and this spread will reward you with nuanced insight that few other layouts can match.`,
    positions: [
      { number: 1, name: 'The Present', meaning: 'Your current situation and the energy surrounding you right now.' },
      { number: 2, name: 'The Challenge', meaning: 'The immediate obstacle or opposing force you must address.' },
      { number: 3, name: 'The Foundation', meaning: 'The root cause or basis of the situation, often from the past.' },
      { number: 4, name: 'The Recent Past', meaning: 'Events and influences that are just passing out of your life.' },
      { number: 5, name: 'The Crown', meaning: 'The best possible outcome or what you are striving toward.' },
      { number: 6, name: 'The Near Future', meaning: 'What is likely to happen in the coming weeks or months.' },
      { number: 7, name: 'Your Attitude', meaning: 'How you see yourself in the situation and your inner feelings.' },
      { number: 8, name: 'External Influences', meaning: 'The people, environment, and forces around you affecting the outcome.' },
      { number: 9, name: 'Hopes and Fears', meaning: 'What you hope for and what you secretly fear — often two sides of the same coin.' },
      { number: 10, name: 'The Outcome', meaning: 'The most likely result if you continue on your current path.' },
    ],
    howToRead: `Begin by laying out all ten cards in the traditional Celtic Cross pattern. Cards 1 and 2 form a small cross at the center. Card 3 goes below, Card 4 to the left, Card 5 above, and Card 6 to the right. Cards 7 through 10 form a vertical line to the right of the cross, from bottom to top.

Start your reading with the central pair. Card 1 shows where you are right now, while Card 2 — placed sideways across it — reveals the primary tension or challenge. Read these two together as a dialogue: they define the core dynamic of your situation.

Next, expand outward. Card 3 (foundation) tells you what built this moment. Card 4 (recent past) shows what is fading. Card 5 (crown) reveals your highest aspiration, and Card 6 (near future) shows the most likely next step. Together, the cross cards paint a complete picture of your trajectory.

Finally, read the staff. Card 7 reflects your inner world and self-perception. Card 8 shows external forces and the people influencing you. Card 9 — often the most revealing — exposes your deepest hopes and fears. Card 10 synthesizes everything into a probable outcome. Remember that outcomes are not fixed; they show where your current energy is heading and what you can still shift.`,
    tips: [
      'Formulate a clear, specific question before you begin — the Celtic Cross rewards focus.',
      'Read the cross cards (1-6) as a story arc before moving to the staff.',
      'Pay special attention to Card 9 (Hopes and Fears) — it often holds the key to the entire reading.',
      'Look for repeated suits or numbers across all ten cards for thematic messages.',
      'If the Outcome card feels unclear, draw a clarifier card and place it alongside.',
      'Journal your Celtic Cross readings — patterns emerge over time that single readings cannot show.',
    ],
    variations: `Several well-known variations of the Celtic Cross exist. Some readers swap the positions of Cards 3 and 5, placing the conscious mind above and the unconscious below. Others add an 11th card as a "shadow" or "advice" card for additional guidance.

The "Modified Celtic Cross" used by many modern readers simplifies the staff positions, replacing Hopes and Fears with a straightforward Advice card. Mary K. Greer's variation includes a separate "underlying theme" card drawn from the bottom of the deck. Experiment with variations to find the version that resonates most with your reading style.`,
    faqs: [
      { question: 'How often should I do a Celtic Cross reading?', answer: 'Because of its depth, most readers recommend no more than once per month for the same question. Doing it too frequently can muddy the messages. If you need regular check-ins, use a simpler spread like the Three Card and reserve the Celtic Cross for major questions.' },
      { question: 'Can I use the Celtic Cross for yes/no questions?', answer: 'The Celtic Cross is not designed for yes/no answers. It excels at exploring nuance, context, and hidden influences. For yes/no questions, a single-card draw or a simple three-card spread is more appropriate.' },
      { question: 'What if I get mostly Major Arcana cards?', answer: 'A spread dominated by Major Arcana suggests that powerful, karmic, or life-altering forces are at play. The situation carries significant weight and may involve a turning point or spiritual lesson that goes beyond everyday matters.' },
      { question: 'Do I need to be experienced to read the Celtic Cross?', answer: 'While it is labeled Advanced, motivated beginners can use the Celtic Cross by reading each position one at a time rather than trying to synthesize the whole spread at once. Start with the central pair, then add positions gradually as your confidence grows.' },
    ],
  },
  {
    slug: 'three-card-spread',
    name: 'Three Card Spread',
    cardCount: 3,
    difficulty: 'Beginner',
    purpose: 'A versatile, quick-read layout for past-present-future insight or any three-part question.',
    bestFor: [
      'Daily or weekly check-ins',
      'Quick answers to straightforward questions',
      'Understanding the trajectory of a situation',
      'Beginner readers building confidence',
    ],
    overview: `The Three Card Spread is the workhorse of tarot reading. Simple enough for a first-time reader yet flexible enough for a seasoned professional, it distills any question into three clear focal points. In its most popular form — Past, Present, Future — it shows where you have been, where you are, and where you are heading.

But the beauty of the Three Card Spread lies in its versatility. You can assign any three related concepts to the positions: Mind/Body/Spirit, Situation/Action/Outcome, or Option A/Option B/Advice. This adaptability makes it the single most useful layout in any reader's toolkit.

Because only three cards are involved, every card carries significant weight. There is no room for filler, which forces you to read each card with precision and attention. Many professional readers use the Three Card as a warm-up before larger spreads or as a focused follow-up when a specific part of a larger reading needs clarification.`,
    positions: [
      { number: 1, name: 'Past', meaning: 'The events, energies, or influences from your past that have shaped the current situation.' },
      { number: 2, name: 'Present', meaning: 'Where you stand right now — the central energy or circumstance you are experiencing.' },
      { number: 3, name: 'Future', meaning: 'The most likely direction or outcome based on the current trajectory.' },
    ],
    howToRead: `Shuffle your deck while focusing on your question. When you feel ready, draw three cards and lay them in a row from left to right. Card 1 (left) represents the Past, Card 2 (center) represents the Present, and Card 3 (right) represents the Future.

Begin with the center card. It anchors the reading and tells you what energy is most active in your life right now. Then look left to Card 1 — this shows the root or background of the current situation. Finally, look right to Card 3 for where things are headed.

Read the three cards as a narrative. What story do they tell when you connect them? Look for visual connections between the cards — do the figures face toward or away from each other? Do the colors or suits create a progression? The relationship between the cards is often more revealing than any single card on its own.

If you want more depth, you can draw a fourth card as a "hidden influence" or "advice" card and place it below the center card. This optional addition keeps the reading focused while adding another layer of insight.`,
    tips: [
      'Define your three positions before you draw — do not assign meanings after the fact.',
      'Try different frameworks: Situation/Action/Outcome works well for decision-making.',
      'Read the three cards as a sentence or short story for a cohesive interpretation.',
      'Use this spread daily to build your relationship with the deck.',
      'Photograph your spreads and review them at the end of the week to see how they played out.',
      'If all three cards are the same suit, the message is especially focused on that area of life.',
    ],
    variations: `The most common variation changes the positions from Past/Present/Future to Situation/Action/Outcome, which is better suited for decision-making. Another popular version uses Mind/Body/Spirit for holistic self-check-ins.

For relationship readings, try the You/Partner/Relationship framework. For career questions, Current Role/Challenge/Growth Path works well. The Three Card Spread is limited only by your creativity in defining the positions.`,
    faqs: [
      { question: 'How is this different from just pulling three random cards?', answer: 'The key difference is intention. Each position carries a defined meaning, which gives structure to your interpretation. Three random cards without assigned positions can be read intuitively, but the spread format provides a narrative framework that makes the reading clearer and more actionable.' },
      { question: 'Can I use this spread with oracle cards?', answer: 'Absolutely. The Three Card Spread works beautifully with oracle decks, Lenormand cards, or even a combination of tarot and oracle cards. The framework is universal — only the interpretation style changes.' },
      { question: 'What if I get the same card I got yesterday?', answer: 'A recurring card is a strong signal. The message it carries has not been fully received or acted upon. Pay extra attention to it, and consider journaling about what it might be trying to tell you.' },
    ],
  },
  {
    slug: 'one-card-daily-pull',
    name: 'One Card Daily Pull',
    cardCount: 1,
    difficulty: 'Beginner',
    purpose: 'A single-card draw for daily guidance, reflection, or building your intuitive connection with the deck.',
    bestFor: [
      'Morning rituals and daily intention-setting',
      'Learning tarot card meanings organically',
      'Quick guidance on a specific question',
      'Building a consistent tarot practice',
    ],
    overview: `The One Card Daily Pull is the simplest and most accessible way to work with tarot. You draw a single card each day to receive guidance, set an intention, or simply deepen your familiarity with the deck. Despite its simplicity, a daily pull can be surprisingly profound — a single card, free from the context of surrounding cards, demands your full attention.

Many experienced readers maintain a daily pull practice alongside their larger readings. It serves as a meditative anchor point in the day, a moment to pause, reflect, and listen. Over weeks and months, your daily pulls create a personal journal of themes that reveal patterns in your life you might otherwise miss.

The daily pull is also the fastest way to learn tarot. Instead of memorizing 78 card meanings from a book, you experience one card at a time in the context of your actual life. By the end of the day, you have a lived understanding of that card that no textbook can replicate.`,
    positions: [
      { number: 1, name: 'Card of the Day', meaning: 'The primary energy, theme, or lesson for your day. It may represent advice, a challenge to watch for, or an opportunity to embrace.' },
    ],
    howToRead: `Find a quiet moment, ideally in the morning before your day begins. Hold your deck and take a few deep breaths. You can ask a specific question — "What do I need to know today?" or "What energy should I embody?" — or simply set the intention to receive whatever message is most relevant.

Shuffle the deck in whatever way feels natural. When you feel a sense of readiness or completion, stop and draw the top card. Place it face-up in front of you and spend a moment simply observing it before consulting any meanings. What do you notice first? What feelings does the image evoke?

After your initial impressions, consider the traditional meaning of the card and how it might apply to your day ahead. Make a mental or written note of your interpretation. At the end of the day, revisit the card — you will often find that its message played out in ways you did not expect that morning.

Over time, this practice develops your intuitive reading skills more effectively than any course or textbook. The daily context gives each card a living meaning that stays with you.`,
    tips: [
      'Pull your card at the same time each day to build a consistent ritual.',
      'Keep a tarot journal — even a quick one-line note about each daily card adds up over time.',
      'Do not rush to look up meanings. Sit with the image first and trust your initial impressions.',
      'If a card confuses you, carry it with you mentally throughout the day and see how it manifests.',
      'Try pulling a card in the evening as a reflection on what the day brought.',
      'Accept reversed cards without anxiety — they often represent internalized or gentler versions of the upright meaning.',
    ],
    variations: `Some readers pull two cards instead of one — a "theme" card and an "advice" card — to add a layer of nuance without overcomplicating the practice. Others draw from the Major Arcana only for daily pulls, focusing on larger spiritual themes.

A popular journaling variation involves pulling your card in the morning, writing your prediction for the day, then revisiting in the evening to record what actually happened. This feedback loop dramatically accelerates your learning.`,
    faqs: [
      { question: 'Should I use the full deck or just Major Arcana for daily pulls?', answer: 'Both approaches are valid. Using the full 78-card deck gives you a wider range of everyday messages. Using only the 22 Major Arcana focuses on bigger spiritual themes. Try both and see which resonates with your practice.' },
      { question: 'What if I pull a scary card like Death or The Tower?', answer: 'No tarot card is inherently bad. Death represents transformation and endings that make way for new beginnings. The Tower signals sudden change that, while uncomfortable, clears away what no longer serves you. Read these cards as invitations to growth, not predictions of doom.' },
      { question: 'Can I pull more than once if I do not like my card?', answer: 'Resist the urge to re-draw. The card you pulled is the message you need, even if it is not the one you wanted. Learning to sit with uncomfortable cards is part of developing your practice and your resilience.' },
    ],
  },
  {
    slug: 'relationship-spread',
    name: 'Relationship Spread',
    cardCount: 7,
    difficulty: 'Intermediate',
    purpose: 'Examines the dynamics between two people, revealing each person\'s perspective, shared energy, and the relationship\'s trajectory.',
    bestFor: [
      'Romantic partnerships and dating questions',
      'Understanding communication breakdowns',
      'Evaluating the potential of a new connection',
      'Friendship and family dynamics',
    ],
    overview: `The Relationship Spread is designed to illuminate the dynamics between two people. Unlike a general reading that focuses on one person's perspective, this seven-card layout gives voice to both parties and the relationship itself. It reveals what each person brings to the connection, what they need, and where the relationship is heading.

This spread works for any type of relationship — romantic partners, friends, family members, or business associates. The key insight it provides is perspective: you see not only your own feelings and desires but also get a window into the other person's experience. This dual view is invaluable for resolving conflicts, deepening intimacy, or deciding whether a connection is worth pursuing.

The center card, representing the relationship itself, acts as the heart of the reading. It shows the shared energy that exists between you — the invisible thread that connects your individual experiences into something greater. When the center card is strong, the relationship has a solid foundation regardless of individual challenges.`,
    positions: [
      { number: 1, name: 'You', meaning: 'Your current energy, feelings, and attitude within the relationship.' },
      { number: 2, name: 'The Other Person', meaning: 'Their current energy, feelings, and perspective — as the cards reveal it.' },
      { number: 3, name: 'The Connection', meaning: 'The shared energy between you — the relationship\'s core dynamic.' },
      { number: 4, name: 'Your Needs', meaning: 'What you need from this relationship to feel fulfilled.' },
      { number: 5, name: 'Their Needs', meaning: 'What the other person needs from the relationship.' },
      { number: 6, name: 'The Challenge', meaning: 'The primary obstacle or tension that the relationship must navigate.' },
      { number: 7, name: 'The Potential', meaning: 'Where this relationship is heading if both parties continue on their current path.' },
    ],
    howToRead: `Lay out the seven cards in a pattern that visually represents the relationship. Place Cards 1 and 2 side by side (representing each person), Card 3 between and slightly above them (the connection), Cards 4 and 5 below their respective person cards (needs), Card 6 below the center (challenge), and Card 7 at the bottom (potential).

Begin by reading Cards 1 and 2 together. How do these two energies interact? Do they complement each other or create tension? Then look at Card 3 — this is the truest picture of the relationship as it exists right now, stripped of individual projections.

Next, compare the needs cards (4 and 5). Are both people's needs being met? Do their needs align or conflict? This comparison often reveals the source of satisfaction or frustration in the relationship. Card 6 names the challenge explicitly — this is what you both need to work on.

Finally, Card 7 shows the trajectory. Remember that this is potential, not destiny. It shows where things are heading based on current dynamics, which means both parties have the power to shift the outcome through their choices and actions.`,
    tips: [
      'Be honest about which person is "you" and which is "them" — do not swap if you dislike the cards.',
      'Pay attention to whether the figures on the cards face toward or away from the center card.',
      'Compare the suits of Cards 1 and 2 — matching suits suggest alignment, different suits suggest different priorities.',
      'The Challenge card is not a death sentence — it shows where growth is needed and possible.',
      'Use this spread before difficult conversations to understand both perspectives.',
      'Avoid doing this spread when you are emotionally charged — wait until you can receive the message with openness.',
    ],
    variations: `A simpler five-card version drops the Needs positions and focuses on You/Them/Connection/Challenge/Potential. A more complex nine-card version adds positions for "What you give" and "What you receive," creating a fuller picture of the energy exchange.

For self-relationship work, some readers assign both "person" positions to different aspects of themselves — such as the conscious self and the shadow self — to explore inner conflict and integration.`,
    faqs: [
      { question: 'Is it ethical to read about someone without their knowledge?', answer: 'The Relationship Spread reads the energy of the connection, not the other person\'s private thoughts. It reflects what you can perceive and what the dynamic reveals. Most ethical readers frame it as insight into the relationship dynamic rather than surveillance of the other person.' },
      { question: 'Can this spread predict whether a relationship will last?', answer: 'The Potential card shows trajectory, not destiny. It reveals where the current energy is heading, but both people have free will. A challenging Potential card is an invitation to make changes, not a guarantee of failure.' },
      { question: 'What if I get very negative cards for the other person?', answer: 'Remember that the cards reflect energy and dynamics, not character judgments. A difficult card in the other person\'s position might indicate that they are going through a hard time, feeling conflicted, or struggling with their own issues rather than being a "bad" person.' },
      { question: 'Can I use this for a relationship that has ended?', answer: 'Yes. The spread can help you understand what happened, process your feelings, and identify patterns you might carry into future relationships. Focus your question on gaining closure or understanding rather than on reuniting.' },
    ],
  },
  {
    slug: 'career-path-spread',
    name: 'Career Path Spread',
    cardCount: 5,
    difficulty: 'Intermediate',
    purpose: 'Illuminates your professional trajectory, highlighting strengths, obstacles, and the actions needed to advance your career.',
    bestFor: [
      'Job changes and career transitions',
      'Evaluating a business opportunity or promotion',
      'Understanding workplace dynamics and challenges',
      'Aligning career goals with personal purpose',
    ],
    overview: `The Career Path Spread is a focused five-card layout designed specifically for professional questions. Whether you are considering a job change, launching a business, negotiating a promotion, or simply feeling stuck in your career, this spread provides structured guidance tailored to the working world.

What sets this spread apart from using a general layout for career questions is its position structure. Each card addresses a specific aspect of professional life — your current standing, your strengths, your obstacles, the action to take, and the likely outcome. This targeted approach cuts through vague advice and delivers actionable insight.

The Career Path Spread is particularly valuable during transitions. When you are between jobs, weighing offers, or wondering whether to stay or go, the five positions create a clear decision framework. The Strength and Action cards together often reveal your best strategy, while the Obstacle card names what you have been avoiding or underestimating.`,
    positions: [
      { number: 1, name: 'Current Position', meaning: 'Where you stand professionally right now — your role, energy, and satisfaction level.' },
      { number: 2, name: 'Your Strength', meaning: 'The talent, skill, or quality that is your greatest professional asset in this situation.' },
      { number: 3, name: 'The Obstacle', meaning: 'What is blocking your progress — an internal fear, external circumstance, or overlooked challenge.' },
      { number: 4, name: 'The Action', meaning: 'The specific step or approach you should take to move forward.' },
      { number: 5, name: 'The Outcome', meaning: 'The most likely professional result if you follow the guidance of this reading.' },
    ],
    howToRead: `Lay the five cards in a horizontal line or a cross pattern with Card 1 at the center. Focus your question on a specific career situation — "What do I need to know about this job offer?" or "How can I grow in my current role?" — rather than a vague "What about my career?"

Start with Card 1 to ground yourself in reality. This card validates or challenges your perception of where you stand. Then read Card 2 — your strength — which often reveals an asset you have been undervaluing or neglecting. This is your leverage.

Card 3 names the obstacle. Read it honestly; career readings lose value when you rationalize away uncomfortable truths. Card 4, the Action card, is the most practical position — it tells you what to do. Pay close attention to the energy it suggests: is it asking you to be bold, patient, strategic, or collaborative?

Card 5 shows the outcome based on your current path and energy. If it is encouraging, you are headed in the right direction. If it is cautionary, revisit the Action card for what needs to change. Pair the Strength and Action cards as your strategic foundation.`,
    tips: [
      'Frame your question around what you can control — your actions and mindset — rather than other people\'s decisions.',
      'The Strength card reveals what to double down on; do not ignore it even if it seems obvious.',
      'Look for Pentacles in the spread — they carry special weight in career readings as the suit of material world and work.',
      'If the Action card is a Court Card, it may suggest a person you should emulate or seek mentorship from.',
      'Revisit this spread quarterly to track your professional evolution.',
      'Pair this spread with a daily pull focused on workplace energy for ongoing guidance.',
    ],
    variations: `An expanded seven-card version adds "Hidden Influence" (what you cannot see affecting your career) and "Long-Term Potential" (where this path leads in one to two years). A decision-focused variation replaces the single Outcome card with two cards representing the outcomes of two different choices.

For entrepreneurs, try renaming the positions to Business Health/Competitive Advantage/Market Challenge/Growth Strategy/Revenue Outlook. Same spread, different lens.`,
    faqs: [
      { question: 'Can tarot really help with career decisions?', answer: 'Tarot does not make decisions for you — it surfaces information and perspectives you may have overlooked. By externalizing your thoughts through the cards, you often clarify feelings and priorities that were muddled by overthinking. Many professionals find tarot helpful as a reflective decision-making tool.' },
      { question: 'I got The Tower in my career reading. Should I be worried?', answer: 'The Tower in a career context often signals sudden, disruptive change — a layoff, a reorganization, or a dramatic shift. While uncomfortable, Tower moments clear away structures that were not serving you and make space for something more aligned. Prepare rather than panic.' },
      { question: 'How specific should my career question be?', answer: 'The more specific, the better. Instead of "What about my career?" try "What do I need to know about applying for the marketing director role at Company X?" Specificity gives the cards focus and makes the reading far more actionable.' },
    ],
  },
  {
    slug: 'year-ahead-spread',
    name: 'Year Ahead Spread',
    cardCount: 13,
    difficulty: 'Advanced',
    purpose: 'Maps the energy and themes for each month of the coming year, plus an overall theme card for the entire cycle.',
    bestFor: [
      'New Year or birthday readings',
      'Long-range planning and preparation',
      'Understanding seasonal patterns in your life',
      'Setting intentions for the year ahead',
    ],
    overview: `The Year Ahead Spread is one of the most ambitious layouts in tarot. With thirteen cards — one for each month plus an overarching theme — it provides a panoramic view of the year to come. This is the reading you do at the start of a new year, on your birthday, or at any moment when you want to understand the larger arc of the months ahead.

Each of the twelve monthly cards represents the dominant energy, theme, or lesson of that month. They do not predict specific events but rather illuminate the quality of each period — some months will call for action, others for rest, some for celebration, and others for patience. The thirteenth card, the annual theme, ties everything together and reveals the central lesson of the year.

This spread is best approached as a map rather than a script. It shows the terrain ahead so you can prepare and navigate wisely, but your choices along the way will always shape the journey. Many readers find it helpful to photograph their Year Ahead reading and revisit it monthly, checking in on how each card's message is unfolding.`,
    positions: [
      { number: 1, name: 'Annual Theme', meaning: 'The overarching energy, lesson, or theme for the entire year.' },
      { number: 2, name: 'January', meaning: 'The dominant energy and focus for January.' },
      { number: 3, name: 'February', meaning: 'The dominant energy and focus for February.' },
      { number: 4, name: 'March', meaning: 'The dominant energy and focus for March.' },
      { number: 5, name: 'April', meaning: 'The dominant energy and focus for April.' },
      { number: 6, name: 'May', meaning: 'The dominant energy and focus for May.' },
      { number: 7, name: 'June', meaning: 'The dominant energy and focus for June.' },
      { number: 8, name: 'July', meaning: 'The dominant energy and focus for July.' },
      { number: 9, name: 'August', meaning: 'The dominant energy and focus for August.' },
      { number: 10, name: 'September', meaning: 'The dominant energy and focus for September.' },
      { number: 11, name: 'October', meaning: 'The dominant energy and focus for October.' },
      { number: 12, name: 'November', meaning: 'The dominant energy and focus for November.' },
      { number: 13, name: 'December', meaning: 'The dominant energy and focus for December.' },
    ],
    howToRead: `Lay the annual theme card (Card 1) at the center or top of your reading space. Then lay the twelve monthly cards in a circle around it, like a clock face, starting with the current month at the 12 o'clock position and moving clockwise.

Begin with the annual theme card. This is the lens through which every monthly card should be interpreted. If your theme card is The Hermit, for example, the year emphasizes introspection, solitude, and inner wisdom — and each monthly card carries that flavor.

Read through the monthly cards in order, noting the progression. Look for patterns: are there clusters of similar suits? Do the Major Arcana cards concentrate in certain months? Months with Major Arcana often bring significant events or turning points, while months with Minor Arcana tend to involve everyday navigation.

Pay special attention to transitions between months. A shift from Swords to Cups, for instance, might signal a move from intellectual challenge to emotional healing. Mark the months that feel particularly significant and set reminders to revisit those cards when the time comes.`,
    tips: [
      'Do this reading on your birthday or New Year\'s Day for the strongest alignment with natural cycles.',
      'Photograph the full spread and save it somewhere accessible — you will want to reference it monthly.',
      'Do not try to memorize all thirteen cards at once. Focus on the theme and the next two to three months.',
      'Use the annual theme card as a touchstone throughout the year when you need guidance.',
      'If a month\'s card seems contradictory to the theme, it may represent a temporary detour or lesson.',
      'Consider pairing this with monthly single-card pulls for additional nuance as each month arrives.',
    ],
    variations: `A simplified version uses only seven cards: one theme card and six cards for two-month periods. This is easier to manage and still provides good seasonal awareness. Another variation adds a fourteenth card for "Shadow Work" — the hidden lesson that the year is bringing.

Some readers do a "birthday to birthday" year rather than January to December, aligning the spread with their personal solar return cycle. This version often feels more personally relevant.`,
    faqs: [
      { question: 'Should I do this spread at New Year\'s or on my birthday?', answer: 'Both work well but serve different purposes. A New Year\'s reading aligns with collective energy and calendar-year goals. A birthday reading aligns with your personal solar return cycle and feels more individually tailored. Many readers do both.' },
      { question: 'What if most of my monthly cards are negative?', answer: 'Challenging cards do not mean a bad year. They indicate months that require more effort, awareness, or growth. A year full of challenging cards often turns out to be deeply transformative. Focus on what each card teaches rather than what it threatens.' },
      { question: 'How accurate are the monthly predictions?', answer: 'Monthly cards describe energy themes, not specific events. You might see the Seven of Swords in March and experience it as a need for strategic thinking, a boundary violation, or a call to be more honest. The energy is accurate; the manifestation varies.' },
      { question: 'Can I redo the spread if I do not like the results?', answer: 'The first draw is always the truest. If you redraw because you dislike the results, you are consulting your wishes rather than the cards. Accept the reading, work with it, and remember that every challenging card contains guidance for navigating that period successfully.' },
    ],
  },
  {
    slug: 'full-moon-spread',
    name: 'Full Moon Spread',
    cardCount: 5,
    difficulty: 'Intermediate',
    purpose: 'Harnesses full moon energy to illuminate what needs releasing, what has been achieved, and how to move forward.',
    bestFor: [
      'Full moon rituals and ceremonies',
      'Identifying what to release or let go of',
      'Celebrating achievements and progress',
      'Gaining clarity on emotional patterns',
    ],
    overview: `The Full Moon Spread is a five-card layout designed to work with the powerful energy of the full moon — a time of culmination, illumination, and release. In astrology and tarot alike, the full moon represents the peak of a cycle, when things come to light and what no longer serves you becomes impossible to ignore.

This spread works beautifully as part of a monthly full moon ritual. It helps you take stock of what has manifested since the last new moon, acknowledge what you have achieved, recognize what is ready to be released, and set your course for the waning phase ahead. The cyclical nature of lunar work means that each month builds on the last, creating a powerful practice of continuous growth.

The emotional clarity that the full moon brings makes this an ideal time for honest self-reflection. Cards drawn during the full moon often carry heightened emotional resonance, and readings tend to be particularly vivid and direct. Trust the messages that come through even — especially — when they challenge your comfort zone.`,
    positions: [
      { number: 1, name: 'What Has Culminated', meaning: 'What has come to fruition or reached its peak in this lunar cycle.' },
      { number: 2, name: 'What Is Illuminated', meaning: 'A truth, pattern, or situation that the full moon is bringing to light.' },
      { number: 3, name: 'What to Release', meaning: 'What you need to let go of — a habit, belief, relationship pattern, or attachment.' },
      { number: 4, name: 'What to Keep', meaning: 'What is serving you well and deserves your continued energy and attention.' },
      { number: 5, name: 'Guidance Forward', meaning: 'Advice for navigating the waning moon phase and moving into the next cycle.' },
    ],
    howToRead: `Ideally, perform this reading on the night of the full moon or within a day on either side. Create a calm, reflective space — candlelight and moonlight both enhance the atmosphere. If possible, sit near a window where you can see or sense the moon.

Shuffle your deck while reflecting on the past two weeks since the new moon. What seeds did you plant? What has grown? What surprised you? Draw five cards and lay them in an arc or a cross pattern.

Start with Card 1 (What Has Culminated) to acknowledge your progress and what has peaked. Card 2 (What Is Illuminated) often delivers the most striking insight — this is the full moon shining its light on something you need to see. Sit with this card before moving on.

Card 3 (What to Release) is the heart of full moon work. The full moon is the optimal time for letting go, and this card names what is ready to be released. Card 4 (What to Keep) provides balance — not everything needs to change. Card 5 guides you into the next phase with practical wisdom.`,
    tips: [
      'Perform this reading within 24 hours of the exact full moon for the strongest energetic alignment.',
      'Pair the reading with a release ritual — write down what Card 3 reveals and safely burn the paper.',
      'Track which zodiac sign the full moon falls in and consider its influence on your reading.',
      'Compare your full moon reading with your new moon intentions from two weeks prior.',
      'Use moonstone, selenite, or clear quartz near your deck during full moon readings to amplify lunar energy.',
      'Journal immediately after the reading while the insights are fresh.',
    ],
    variations: `A three-card simplified version uses Release/Illuminate/Embrace. A seven-card expanded version adds positions for "Emotional State," "Physical Needs," and "Spiritual Message," creating a more holistic full moon check-in.

Some readers do a dual spread — pairing the Full Moon Spread with the New Moon Intentions spread from two weeks earlier to create a complete lunar cycle narrative.`,
    faqs: [
      { question: 'Does the full moon actually affect tarot readings?', answer: 'Whether you view it through an astrological, energetic, or psychological lens, many readers report that full moon readings feel particularly vivid and emotionally resonant. At minimum, the ritual of reading during the full moon creates a focused, reflective mindset that enhances any reading.' },
      { question: 'What if I miss the full moon night?', answer: 'The full moon energy extends roughly one to two days on either side of the exact peak. A reading done the day before or after the full moon still carries the same power. The intention matters more than the exact timing.' },
      { question: 'Why is releasing so important during the full moon?', answer: 'The full moon marks the peak of the lunar cycle — after it, the moon wanes (decreases). This waning energy naturally supports release, letting go, and completion. Working with this rhythm rather than against it makes the process of release feel more natural and effective.' },
    ],
  },
  {
    slug: 'new-moon-intentions',
    name: 'New Moon Intentions',
    cardCount: 5,
    difficulty: 'Beginner',
    purpose: 'Sets powerful intentions at the new moon by clarifying desires, identifying resources, and naming the first step forward.',
    bestFor: [
      'New moon rituals and intention-setting',
      'Starting new projects or phases of life',
      'Gaining clarity on what you truly want',
      'Monthly goal-setting with spiritual alignment',
    ],
    overview: `The New Moon Intentions spread is a five-card layout designed for the new moon — the darkest point in the lunar cycle and the most potent time for planting seeds of intention. While the full moon illuminates and releases, the new moon invites you to dream, plan, and begin.

This spread helps you move beyond vague wishes and into clear, grounded intentions. It asks you to name what you want, understand why you want it, recognize the resources already available to you, acknowledge what might stand in the way, and identify the first concrete step. This structured approach transforms wishful thinking into actionable purpose.

The new moon is associated with new beginnings in virtually every spiritual tradition. Working with this energy regularly — setting intentions at each new moon and checking in at each full moon — creates a rhythmic practice of manifestation and reflection that compounds over time. Many readers consider their monthly new moon spread to be the most personally valuable reading they do.`,
    positions: [
      { number: 1, name: 'The Seed', meaning: 'The intention or desire that is ready to be planted in this lunar cycle.' },
      { number: 2, name: 'The Soil', meaning: 'The foundation and resources you already have that will support this intention.' },
      { number: 3, name: 'The Sunlight', meaning: 'The energy, motivation, or inspiration that will help your intention grow.' },
      { number: 4, name: 'The Weed', meaning: 'A potential obstacle, old habit, or limiting belief that could hinder growth.' },
      { number: 5, name: 'The First Step', meaning: 'The most important action to take in the coming two weeks to nurture your intention.' },
    ],
    howToRead: `Perform this reading on or near the new moon, when the sky is dark and the energy favors introspection and planting new seeds. Light a candle if you wish and take a few minutes to sit quietly with your deck.

Before drawing, spend a moment reflecting on what you want to manifest or begin in this lunar cycle. It does not need to be a massive life change — even small, heartfelt intentions carry power. Shuffle the deck with this intention in your heart and draw five cards.

Card 1 (The Seed) shows you what is truly ready to be planted. Sometimes it confirms your conscious intention; other times it reveals a deeper or different desire that you had not fully acknowledged. Trust this card. Card 2 (The Soil) reassures you that you already have what you need to begin — look for strengths, resources, and support systems.

Card 3 (The Sunlight) identifies what will fuel your progress. Card 4 (The Weed) is an honest alert about what could derail you if left unchecked. Card 5 (The First Step) is your marching order — the single most impactful thing you can do in the next two weeks to bring your intention to life.`,
    tips: [
      'Write your intention down after the reading — written intentions carry more weight than mental ones.',
      'Place Card 5 (The First Step) somewhere visible as a reminder of your immediate action item.',
      'Compare your New Moon reading with your Full Moon reading two weeks later to track the cycle.',
      'Keep your intention focused on one area rather than trying to manifest everything at once.',
      'The new moon in different zodiac signs flavors the energy — research which sign the new moon falls in.',
      'Share your intention with a trusted friend or community for accountability and support.',
    ],
    variations: `A three-card simplified version uses Intention/Support/Action for a quick new moon ritual. An expanded seven-card version adds "Hidden Desire" (what you want but have not admitted), "Timeline" (how quickly things may manifest), and "Sign of Progress" (what to watch for as confirmation).

Some readers create a new moon altar and place their drawn cards on it for the full two weeks, using them as a visual meditation focus until the full moon arrives.`,
    faqs: [
      { question: 'Do I need to believe in lunar cycles for this spread to work?', answer: 'Not at all. Even from a purely psychological perspective, having a regular rhythm for setting intentions and reflecting on progress is powerful. The new moon simply provides a natural calendar for this practice. The structure and consistency matter more than the metaphysical framework.' },
      { question: 'What if my Seed card does not match the intention I had in mind?', answer: 'This is one of the most valuable moments in tarot. The Seed card may reveal a deeper or more authentic desire beneath the surface-level intention you came with. Consider whether the card points to something you truly want but have been reluctant to admit.' },
      { question: 'How long do new moon intentions take to manifest?', answer: 'Some intentions manifest within a single lunar cycle (roughly 29 days), while others unfold over months or even years. The monthly practice builds momentum — each cycle adds energy to your intention. Trust the timing and focus on taking consistent small steps.' },
    ],
  },
]

export default tarotSpreads
