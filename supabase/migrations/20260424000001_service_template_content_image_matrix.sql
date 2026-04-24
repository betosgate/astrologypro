-- Seed the full service template content + image matrix for all canonical
-- templates and their general catalog variants. Safe to re-run because each
-- statement updates by stable slug.

UPDATE service_templates
SET
  description = 'Foundational natal chart reading covering identity, strengths, emotional wiring, vocation, life themes, and major chart patterns.',
  long_description = 'This practitioner-led natal chart reading treats the birth chart as the master map behind personality, purpose, timing, and recurring life themes. Your astrologer interprets the Sun, Moon, Ascendant, house structure, ruling planets, and major aspects together so the session moves beyond isolated placements into a coherent life pattern. It is the right starting point for clients who want a deep orientation to their chart before moving into transits, returns, relationship work, or predictive techniques.',
  whats_included = ARRAY['Interpretation of the Sun, Moon, Ascendant, chart ruler, and the strongest planetary signatures.', 'A practical walkthrough of house emphasis, major aspects, and repeated life themes.', 'Focused guidance on vocation, relationships, emotional patterning, and personal strengths.', 'Timing context around growth periods, pressure points, and developmental cycles in the chart.', 'Space for client questions so the reading stays relevant to current priorities.']::text[],
  who_its_for = ARRAY['Clients booking their first serious astrology reading and wanting a complete foundation.', 'People at a crossroads who need clearer language for their natural patterns and direction.', 'Anyone with accurate birth time who wants a precise chart-based reading rather than a generic horoscope.', 'Clients preparing for follow-up work in synastry, transits, returns, or predictive astrology.']::text[],
  faq = '[{"question":"What birth details are needed for this reading?","answer":"Birth date, exact birth time, and birthplace give the most accurate result. Precise birth time is especially important for the Ascendant, houses, and timing-sensitive interpretation."},{"question":"Is this a good first astrology reading?","answer":"Yes. A natal chart reading establishes the chart framework that more specialized readings build on later."},{"question":"What topics can be covered during the session?","answer":"The reading can cover personality structure, relationships, vocation, emotional needs, recurring patterns, and current life direction, with emphasis adjusted to your questions."},{"question":"Does this include prediction?","answer":"The main focus is the natal blueprint, but your astrologer can also point out timing themes and upcoming developmental windows when they are clearly relevant."}]'::jsonb,
  seo_title = 'Nativity Birth Chart Reading | Natal Astrology Session',
  seo_description = 'Book a natal chart reading for clear insight into personality, purpose, vocation, relationships, and the deeper themes shaping your life path.',
  image_url = '/images/services/natal-chart.png',
  updated_at = now()
WHERE slug = 'nativity-birth-chart';

UPDATE service_templates
SET
  description = 'Productized natal chart overview with full-spectrum life interpretation and practical orientation.',
  long_description = 'The General Nativity Birth Chart is a full-spectrum astrology product designed for clients who want a structured overview of their natal blueprint. It explains personality, emotional patterning, vocation, relationship tendencies, and major chart mechanics in clear practical language while preserving birth-data precision. This offering works well as a first orientation session, a reset during transition, or a grounding reference before booking more specialized astrology products.',
  whats_included = ARRAY['A complete natal chart overview covering identity, emotional wiring, vocation, and life themes.', 'Clear explanation of houses, aspects, and the chart mechanics driving repeated patterns.', 'Practical interpretation of strengths, growth edges, and decision-making tendencies.', 'Context for relationships, purpose, and major periods of pressure or momentum.', 'A structured summary designed to give clients a usable foundation for future readings.']::text[],
  who_its_for = ARRAY['Clients who want one complete natal overview instead of piecing together separate astrology products.', 'People beginning their astrology journey and looking for a reliable chart-based foundation.', 'Clients entering a new life chapter and wanting clearer orientation through their birth chart.', 'Anyone who knows their birth time and wants a premium, non-branded natal chart product.']::text[],
  faq = '[{"question":"What makes this product different from a casual horoscope?","answer":"It is built from exact birth data and interprets the actual natal chart rather than generalized sun-sign content."},{"question":"Can this be used as a starting point for future readings?","answer":"Yes. It creates the core reference framework that later compatibility, transit, and return readings can build on."},{"question":"What information should I prepare?","answer":"Have your birth date, exact birth time, and birthplace ready so the house structure and timing references stay accurate."},{"question":"Will this cover multiple areas of life?","answer":"Yes. The product is intentionally broad and can touch identity, relationships, career emphasis, emotional needs, and long-term life themes."}]'::jsonb,
  seo_title = 'General Nativity Birth Chart Reading | Natal Astrology Overview',
  seo_description = 'Explore a complete natal chart overview with chart mechanics, life themes, relationships, vocation, and practical guidance based on exact birth data.',
  image_url = '/images/services/natal-chart.png',
  updated_at = now()
WHERE slug = 'general-nativity-birth-chart';

UPDATE service_templates
SET
  description = 'Birthday-year forecast covering annual themes, opportunities, pressure points, and timing windows.',
  long_description = 'A Solar Return reading focuses on the astrology of the year ahead beginning at your birthday. Your astrologer compares the Solar Return chart with the natal chart to identify the year''s core themes, areas of opportunity, likely points of pressure, and the timing windows that deserve attention. It is especially useful before a birthday season, at the start of a major chapter, or when you want a strategic read on the next twelve months.',
  whats_included = ARRAY['Interpretation of the Solar Return Sun, angles, house emphasis, and dominant planetary patterns.', 'Comparison between the Solar Return and natal chart for a more grounded annual forecast.', 'Guidance on the coming year''s opportunities, responsibilities, and likely growth edges.', 'Discussion of timing windows, activation periods, and practical planning themes.', 'Room for questions about the next chapter in work, relationships, or life direction.']::text[],
  who_its_for = ARRAY['Clients approaching a birthday and wanting clarity on the next twelve months.', 'People entering a new chapter and looking for an annual roadmap rather than a general reading.', 'Anyone who wants to align decisions with the strongest themes of the coming year.', 'Clients who already know their natal chart and want a timing-focused follow-up session.']::text[],
  faq = '[{"question":"When should I book a Solar Return reading?","answer":"The best window is around your birthday or shortly before it, so you can use the forecast to plan the year ahead."},{"question":"Does this replace a natal chart reading?","answer":"No. A Solar Return is most useful as a year-specific layer built on top of the natal chart foundation."},{"question":"What can this reading help me prepare for?","answer":"It can highlight annual priorities, decision points, opportunities, areas of stress, and where effort is likely to pay off."},{"question":"Is exact birth time important?","answer":"Yes. Accurate birth time improves chart comparison and makes annual house emphasis more trustworthy."}]'::jsonb,
  seo_title = 'Solar Return Reading | Annual Astrology Forecast',
  seo_description = 'Book a Solar Return reading to understand your coming year’s themes, timing windows, opportunities, and pressure points around your birthday cycle.',
  image_url = '/images/services/solar-return.png',
  updated_at = now()
WHERE slug = 'solar-return';

UPDATE service_templates
SET
  description = 'Annual planning and forecasting reading centered on the coming year.',
  long_description = 'The General Solar Return is a structured annual astrology product for clients who want a clean, practical forecast for the next birthday-to-birthday cycle. It focuses on the themes most likely to shape the year, the areas asking for strategy or patience, and the timing windows that matter most. The product is designed to support planning, perspective, and better decision-making across the year ahead.',
  whats_included = ARRAY['An annual astrology overview built from the Solar Return chart and natal comparison.', 'Clear identification of the year’s main growth themes, pressure points, and opportunities.', 'Practical planning guidance around career, relationships, and personal priorities.', 'Timing notes for periods of activation, momentum, or recalibration.', 'A structured forecast designed for usable annual orientation rather than vague prediction.']::text[],
  who_its_for = ARRAY['Clients who want one focused annual astrology product tied to their birthday cycle.', 'People planning a new year of work, relationships, or personal reinvention.', 'Anyone seeking a premium yearly forecast grounded in chart mechanics instead of generic trends.', 'Clients who want a practical astrology check-in before a new personal year begins.']::text[],
  faq = '[{"question":"What does a Solar Return product focus on?","answer":"It focuses on the coming birthday year and highlights the themes, pressures, and opportunities most likely to shape that cycle."},{"question":"Can this help with planning?","answer":"Yes. It is especially useful for annual planning because it shows where attention, patience, and effort are most strategically placed."},{"question":"Do I still need my birth details?","answer":"Yes. Accurate birth data improves the comparison between your natal chart and the Solar Return chart."},{"question":"Is this prediction-heavy?","answer":"The product emphasizes timing and annual themes, but the goal is practical orientation rather than rigid fortune-telling."}]'::jsonb,
  seo_title = 'General Solar Return Reading | Annual Astrology Forecast',
  seo_description = 'Plan your next birthday year with a Solar Return forecast covering annual themes, timing windows, opportunities, and practical decision support.',
  image_url = '/images/services/solar-return.png',
  updated_at = now()
WHERE slug = 'general-solar-return';

UPDATE service_templates
SET
  description = 'Short-horizon transit reading for the coming week, activation points, mood, and timing.',
  long_description = 'This practitioner-led Weekly Transits reading narrows the astrology down to the next several days so you can work with the sky in real time. Your astrologer reviews the key transits hitting the natal chart, the emotional tone of the week, the likely activation points, and where timing is more supportive or more sensitive. It is ideal when you want immediate context for decisions, conversations, launches, or a demanding week ahead.',
  whats_included = ARRAY['A focused review of the coming week’s most relevant transits to the natal chart.', 'Insight into mood, momentum, pressure points, and short-term timing windows.', 'Interpretation of where energy is flowing smoothly and where friction may build.', 'Practical guidance for planning meetings, conversations, launches, or personal priorities.', 'A concise reading format designed for immediate use rather than long-range forecasting.']::text[],
  who_its_for = ARRAY['Clients who want short-term astrology guidance for the week ahead.', 'People navigating a packed schedule, key decision, or emotionally charged few days.', 'Anyone who benefits from real-time transit awareness rather than broad monthly themes.', 'Clients who already know their chart and want a practical timing check-in.']::text[],
  faq = '[{"question":"How far ahead does this reading look?","answer":"It focuses on the coming week and the transits most likely to shape that short window."},{"question":"Is this useful for planning exact timing?","answer":"It can help identify stronger and more sensitive periods within the week, though it is best used as guidance rather than rigid scheduling certainty."},{"question":"Do weekly transit readings require birth data?","answer":"Yes. The reading is strongest when the transits are interpreted against your natal chart and house structure."},{"question":"How is this different from a monthly transit reading?","answer":"Weekly Transits zooms in on near-term activation, mood, and immediate timing, while monthly work gives a wider cycle overview."}]'::jsonb,
  seo_title = 'Weekly Transits Reading | Short-Term Astrology Guidance',
  seo_description = 'Get a weekly transit reading for immediate timing insight, activation points, mood shifts, and practical astrology guidance for the days ahead.',
  image_url = '/images/services/weekly-transits.png',
  updated_at = now()
WHERE slug = 'weekly-transits';

UPDATE service_templates
SET
  description = 'Weekly astrology planning product with clear short-term timing emphasis.',
  long_description = 'The General Weekly Transits product is built for clients who want a concise astrology forecast for the next several days. It identifies the short-term transits most likely to shape mood, pace, opportunity, and friction so you can plan with better awareness. This format is intentionally practical, fast to use, and ideal when a client wants timing support without booking a larger long-range session.',
  whats_included = ARRAY['A compact weekly forecast based on the most relevant transits hitting your chart.', 'Clear notes on mood, momentum, pressure, and activation points across the week.', 'Practical planning guidance for conversations, deadlines, and personal priorities.', 'Short-term timing support designed for immediate action and awareness.', 'A structured weekly overview rather than a broad or overly technical reading.']::text[],
  who_its_for = ARRAY['Clients who want regular astrology timing support in a compact format.', 'People managing an important week, deadline, launch, or emotional turning point.', 'Anyone who wants a premium short-horizon transit product instead of a full long-form session.', 'Clients looking for practical planning insight grounded in their actual chart.']::text[],
  faq = '[{"question":"What does a weekly transit product help with?","answer":"It helps with short-term planning by showing where the week carries momentum, friction, emotional sensitivity, or useful windows for action."},{"question":"Is this meant for recurring use?","answer":"Yes. It works especially well as a repeat product for clients who like to plan with near-term astrology context."},{"question":"Do I need exact birth details?","answer":"Yes. Accurate birth data improves how the weekly transits are mapped against your chart and life areas."},{"question":"How technical is the explanation?","answer":"The product is designed to stay practical and understandable while still being based on real chart mechanics."}]'::jsonb,
  seo_title = 'General Weekly Transits Reading | Weekly Astrology Forecast',
  seo_description = 'Use a weekly astrology forecast for near-term timing, mood, and planning insight based on the transits activating your natal chart.',
  image_url = '/images/services/weekly-transits.png',
  updated_at = now()
WHERE slug = 'general-weekly-transits';

UPDATE service_templates
SET
  description = 'Monthly overview blending transits and lunar return for emotional and practical cycles.',
  long_description = 'This reading combines monthly transits with the Lunar Return chart to show both the practical and emotional shape of the month ahead. Your astrologer reviews major activations, mood patterns, home and relationship themes, and the cycles that may affect your pacing, energy, and decision-making. It is a useful middle ground between a weekly transit check-in and a larger annual forecast.',
  whats_included = ARRAY['A monthly transit overview focused on the most relevant chart activations.', 'Interpretation of the Lunar Return for emotional tone, instinct, and inner pacing.', 'Guidance on practical priorities, sensitive periods, and stronger action windows.', 'A blended reading style that links outer timing with inner cycles.', 'Context for planning the month with more awareness and less guesswork.']::text[],
  who_its_for = ARRAY['Clients who want a broader monthly view without committing to a yearly forecast.', 'People navigating an emotionally important month or a period of change.', 'Anyone who resonates with lunar cycles and wants them tied to practical planning.', 'Clients who want more depth than a weekly reading but a tighter scope than a Solar Return.']::text[],
  faq = '[{"question":"What does the Lunar Return add to the reading?","answer":"It adds emotional and instinctive context, showing the inner tone of the month alongside outer transits and events."},{"question":"How far ahead does this reading look?","answer":"It covers the month ahead, with emphasis on the most relevant activations and cycles inside that period."},{"question":"Is this more emotional or practical?","answer":"It is intentionally both. Monthly transits show outer timing while the Lunar Return adds emotional climate and internal pacing."},{"question":"Do I need my birth time for this service?","answer":"Yes. Birth time improves chart accuracy and helps the monthly cycles map more precisely to the right life areas."}]'::jsonb,
  seo_title = 'Monthly Transits and Lunar Return Reading | Astrology Forecast',
  seo_description = 'Book a monthly transit and Lunar Return reading for emotional cycles, practical timing, and a clearer view of the month ahead.',
  image_url = '/images/services/monthly-transit.png',
  updated_at = now()
WHERE slug = 'monthly-transits-lunar-return';

UPDATE service_templates
SET
  description = 'Monthly emotional and planning forecast with lunar-cycle emphasis.',
  long_description = 'The General Monthly Transits + Lunar Return product gives clients a balanced monthly forecast that connects outer astrology timing with inner lunar rhythm. It is designed for people who want to understand the month’s mood, practical priorities, and timing windows without overcommitting to a larger annual session. The result is a premium monthly planning tool grounded in chart mechanics and emotional cycle awareness.',
  whats_included = ARRAY['A monthly astrology overview combining major transits with the Lunar Return cycle.', 'Clear interpretation of emotional tone, planning priorities, and timing windows.', 'Guidance on where the month may feel expansive, pressured, or more reflective.', 'A practical summary that links outer events with inner pacing.', 'A productized monthly format built for clarity, rhythm, and better planning.']::text[],
  who_its_for = ARRAY['Clients who want a month-ahead astrology product with emotional depth and practical usefulness.', 'People planning around home, relationship, work, or self-care cycles over the next few weeks.', 'Anyone who prefers a monthly rhythm of guidance instead of weekly or annual forecasting.', 'Clients seeking a premium lunar-aware forecast that stays grounded and usable.']::text[],
  faq = '[{"question":"What is the core benefit of this monthly product?","answer":"It shows both the outer timing of the month and the emotional tone moving underneath it, which makes planning more realistic and grounded."},{"question":"Can this be booked regularly?","answer":"Yes. It works well as a recurring monthly forecast for clients who like to plan in manageable cycles."},{"question":"Is this only for emotional insight?","answer":"No. Emotional rhythm is part of it, but the product also highlights practical timing, priorities, and action windows."},{"question":"Do exact birth details still matter?","answer":"Yes. Accurate birth data improves both the transit mapping and the Lunar Return interpretation."}]'::jsonb,
  seo_title = 'General Monthly Transits and Lunar Return | Monthly Forecast',
  seo_description = 'Use a monthly astrology forecast with Lunar Return insight for emotional rhythm, practical timing, and clear planning across the month ahead.',
  image_url = '/images/services/monthly-transit.png',
  updated_at = now()
WHERE slug = 'general-monthly-transits-lunar-return';

UPDATE service_templates
SET
  description = 'Synastry and composite reading for attraction, communication, compatibility, and long-term dynamics.',
  long_description = 'This practitioner-led relationship astrology reading explores how two charts interact through synastry and, when relevant, composite dynamics. Your astrologer looks at attraction, emotional needs, communication style, conflict patterns, and long-term potential so the reading stays realistic rather than romanticized. It is useful for new relationships, established partnerships, and periods when a couple needs better clarity around their dynamic.',
  whats_included = ARRAY['Synastry analysis focused on attraction, communication, and emotional compatibility.', 'Interpretation of major inter-chart contacts, repeating themes, and tension points.', 'Guidance on strengths, misunderstandings, and long-term growth dynamics.', 'Context for how each person experiences intimacy, conflict, and support.', 'A grounded reading style that balances chemistry with practical relationship patterns.']::text[],
  who_its_for = ARRAY['Couples who want clearer language for their relationship dynamic.', 'Clients exploring a new connection and wanting more than surface-level compatibility.', 'Partners navigating communication strain, recurring conflict, or major decisions.', 'Anyone who wants astrology-based relationship insight grounded in both charts.']::text[],
  faq = '[{"question":"Do you need both birth charts for relationship astrology?","answer":"Yes. The strongest synastry reading uses accurate birth details for both people so the interaction between the charts can be read properly."},{"question":"Can this show whether a relationship will last?","answer":"It can show compatibility patterns, growth areas, and likely stress points, but astrology works best as guidance rather than a rigid verdict."},{"question":"Is this useful for existing couples as well as new relationships?","answer":"Yes. It can clarify long-term dynamics just as effectively as it can illuminate early chemistry."},{"question":"What if the charts show tension?","answer":"Tension does not automatically mean failure. It usually points to where conscious communication, boundaries, and maturity matter most."}]'::jsonb,
  seo_title = 'Romantic Relationship Astrology Reading | Synastry Session',
  seo_description = 'Book a relationship astrology reading for synastry insight into attraction, compatibility, communication patterns, and long-term romantic dynamics.',
  image_url = '/images/services/romantic-relationships.png',
  updated_at = now()
WHERE slug = 'romantic-relationships';

UPDATE service_templates
SET
  description = 'Relationship compatibility product focused on emotional chemistry and long-term patterning.',
  long_description = 'The General Romantic Relationships product is a structured compatibility reading built for clients who want clear insight into a romantic connection. It covers emotional chemistry, communication habits, attraction patterns, tension points, and the long-range themes shaping the relationship. The product keeps the language practical and balanced so clients leave with usable understanding rather than abstract compatibility talk.',
  whats_included = ARRAY['A compatibility-focused relationship overview based on two charts in interaction.', 'Insight into emotional chemistry, communication style, and repeating patterns.', 'Interpretation of tension points, support factors, and long-term growth themes.', 'Practical context for how the connection may feel day to day and over time.', 'A productized format designed for clarity, realism, and useful relationship guidance.']::text[],
  who_its_for = ARRAY['Clients assessing a romantic connection and wanting structured compatibility insight.', 'Couples who want to understand the deeper patterning underneath their relationship.', 'People deciding whether to deepen, redefine, or better support a partnership.', 'Anyone looking for a premium romantic compatibility product grounded in chart mechanics.']::text[],
  faq = '[{"question":"What does this compatibility product emphasize most?","answer":"It emphasizes emotional chemistry, communication patterns, and the practical dynamics shaping how the relationship functions over time."},{"question":"Can this help with a difficult phase in a relationship?","answer":"Yes. It can clarify where pressure is building, what each person needs, and which patterns require more awareness or maturity."},{"question":"Do both people need birth details?","answer":"Yes. Accurate details for both people make the compatibility analysis much stronger and more precise."},{"question":"Is this only for serious couples?","answer":"No. It can be useful for early-stage connections, established partnerships, or any relationship where clearer insight is needed."}]'::jsonb,
  seo_title = 'General Romantic Compatibility Reading | Relationship Astrology',
  seo_description = 'Explore a romantic compatibility reading with insight into emotional chemistry, communication patterns, tension points, and long-term relationship themes.',
  image_url = '/images/services/romantic-relationships.png',
  updated_at = now()
WHERE slug = 'general-romantic-relationships';

UPDATE service_templates
SET
  description = 'Friendship compatibility reading for values, ease, tension points, and loyalty dynamics.',
  long_description = 'This friendship astrology reading examines how two charts interact outside the romantic lens, with emphasis on trust, communication, ease, conflict style, and the long-term tone of the bond. It is useful for understanding why a friendship feels effortless, why certain tensions keep repeating, or how to navigate a meaningful platonic relationship with greater insight. The session stays practical and focused on real dynamics rather than idealized compatibility language.',
  whats_included = ARRAY['Friendship synastry focused on communication, support style, and mutual understanding.', 'Interpretation of shared strengths, value alignment, and recurring friction points.', 'Guidance on loyalty dynamics, boundaries, and where misunderstanding may arise.', 'Context for how the friendship functions over time and under pressure.', 'A practical read on how to strengthen or better understand the connection.']::text[],
  who_its_for = ARRAY['Friends who want clearer language for their dynamic and support patterns.', 'Clients trying to understand why an important friendship feels easy or complicated.', 'People navigating recurring misunderstandings in a platonic relationship.', 'Anyone who wants a deeper astrology read on trust, compatibility, and communication in friendship.']::text[],
  faq = '[{"question":"Is friendship astrology different from romantic synastry?","answer":"Yes. The focus shifts toward trust, communication, values, and how the bond functions without emphasizing romantic chemistry."},{"question":"Do both birth charts still matter?","answer":"Yes. Accurate birth details for both people produce a much clearer picture of the friendship dynamic."},{"question":"Can this help with conflict between friends?","answer":"Yes. It can show where miscommunication, mismatched pacing, or different support styles are creating strain."},{"question":"Is this useful for long-term friendships?","answer":"Absolutely. It is often most revealing when a friendship has history and repeating themes."}]'::jsonb,
  seo_title = 'Friendship Astrology Reading | Platonic Compatibility Session',
  seo_description = 'Book a friendship astrology reading for insight into trust, communication, compatibility, support patterns, and long-term platonic dynamics.',
  image_url = '/images/services/friendship-relationships.png',
  updated_at = now()
WHERE slug = 'friendship-relationships';

UPDATE service_templates
SET
  description = 'Productized friendship compatibility service with emphasis on support patterns and communication.',
  long_description = 'The General Friendship Relationships product offers a structured look at platonic compatibility, shared values, communication style, and the patterns that make a friendship feel easy or complicated. It is designed for clients who want a clear, premium compatibility product that speaks to trust, mutual support, and the practical reality of maintaining meaningful friendships over time.',
  whats_included = ARRAY['A friendship compatibility overview based on two charts in interaction.', 'Insight into communication style, support patterns, and value alignment.', 'Interpretation of tension points, boundaries, and long-term friendship dynamics.', 'Practical context for how the connection handles stress, change, and loyalty.', 'A productized format that keeps the interpretation clear, grounded, and usable.']::text[],
  who_its_for = ARRAY['Clients wanting a dedicated friendship compatibility product rather than romantic-style synastry.', 'People reassessing an important friendship or deciding how to support it better.', 'Friends navigating tension, mismatch, or changing life circumstances.', 'Anyone seeking premium platonic compatibility insight grounded in astrology.']::text[],
  faq = '[{"question":"What makes this product friendship-specific?","answer":"It focuses on trust, communication, support, values, and long-term platonic patterning rather than romantic attraction."},{"question":"Can this help explain recurring tension with a friend?","answer":"Yes. It can highlight different communication styles, emotional needs, and friction points within the bond."},{"question":"Do both friends need to provide birth details?","answer":"Yes. The more accurate both sets of birth details are, the better the compatibility analysis will be."},{"question":"Is this useful even if the friendship is mostly positive?","answer":"Yes. It can clarify what makes the friendship supportive and how to preserve those strengths over time."}]'::jsonb,
  seo_title = 'General Friendship Compatibility Reading | Astrology Product',
  seo_description = 'Explore friendship compatibility through astrology with insight into communication, trust, support patterns, and long-term platonic dynamics.',
  image_url = '/images/services/friendship-relationships.png',
  updated_at = now()
WHERE slug = 'general-friendship-relationships';

UPDATE service_templates
SET
  description = 'Partnership reading for shared goals, strategy fit, friction points, and role balance.',
  long_description = 'This business relationship reading applies synastry principles to collaboration, partnership, leadership style, and strategic fit. Your astrologer looks at how two people handle responsibility, communication, authority, pacing, and shared ambition so the reading speaks directly to working dynamics rather than personal chemistry alone. It is well suited for founders, collaborators, creative partners, and anyone assessing the long-term viability of a professional alliance.',
  whats_included = ARRAY['Business-focused synastry centered on communication, decision-making, and strategic fit.', 'Interpretation of leadership style, role balance, and likely points of friction.', 'Guidance on trust, pacing, responsibility, and collaborative strengths.', 'Context for how the partnership may function under pressure or growth.', 'A practical reading that speaks to professional compatibility and execution.']::text[],
  who_its_for = ARRAY['Founders, collaborators, or business partners evaluating a working relationship.', 'Clients entering a professional alliance and wanting more than instinct alone.', 'Teams or duos dealing with recurring communication or role confusion.', 'Anyone seeking astrology-based insight into the strengths and weaknesses of a collaboration.']::text[],
  faq = '[{"question":"Is this reading only for formal business partners?","answer":"No. It is useful for any meaningful professional collaboration, including creative partnerships and advisor relationships."},{"question":"What does astrology reveal in a business partnership?","answer":"It can show communication style, role balance, friction points, shared ambition, timing tendencies, and where collaboration may flow or stall."},{"question":"Do both people need birth data?","answer":"Yes. Accurate data for both charts improves the reading and makes the professional dynamics easier to interpret clearly."},{"question":"Can this help prevent conflict?","answer":"It can help you recognize likely tension points early so expectations, boundaries, and roles are handled more consciously."}]'::jsonb,
  seo_title = 'Business Relationship Astrology Reading | Partnership Insight',
  seo_description = 'Book a business relationship astrology reading for insight into collaboration, strategy fit, leadership dynamics, and partnership friction points.',
  image_url = '/images/services/business-relationships.png',
  updated_at = now()
WHERE slug = 'business-relationship';

UPDATE service_templates
SET
  description = 'Strategic compatibility product for founders, collaborators, and business partners.',
  long_description = 'The General Business Relationship product is a structured compatibility reading for professional partnerships. It looks at communication style, authority balance, strategic alignment, blind spots, and the ways two people are likely to work well together or create friction. The product is designed for clients who want a premium, practical overview of a business dynamic before making commitments or while strengthening an existing collaboration.',
  whats_included = ARRAY['A professional compatibility overview focused on communication and strategic fit.', 'Insight into authority balance, role clarity, and decision-making patterns.', 'Interpretation of friction points, blind spots, and collaborative strengths.', 'Practical context for how a partnership handles pressure, growth, and execution.', 'A premium product format built for founders, collaborators, and long-term working alliances.']::text[],
  who_its_for = ARRAY['Clients evaluating a business partnership before committing more deeply.', 'Founders or collaborators wanting clearer insight into role balance and decision-making.', 'Professional duos dealing with strategic friction or communication mismatch.', 'Anyone seeking a premium astrology product for business compatibility and teamwork.']::text[],
  faq = '[{"question":"What does this product help assess?","answer":"It helps assess communication style, leadership balance, role alignment, and the strengths or stress points in a professional partnership."},{"question":"Can this be useful for creative collaborators too?","answer":"Yes. The product works well for founders, advisors, creative partners, or any pair building something together."},{"question":"Are accurate birth details required for both people?","answer":"Yes. Better data gives a more reliable picture of how the working relationship is structured and where friction may emerge."},{"question":"Is this about timing or compatibility?","answer":"The main emphasis is compatibility and working dynamics, though timing tendencies can still be discussed when they are relevant."}]'::jsonb,
  seo_title = 'General Business Compatibility Reading | Astrology for Partners',
  seo_description = 'Assess a business partnership with astrology insight into communication, strategic fit, leadership balance, and collaboration dynamics.',
  image_url = '/images/services/business-relationships.png',
  updated_at = now()
WHERE slug = 'general-business-relationship';

UPDATE service_templates
SET
  description = 'Focused horary reading for a specific question, event, or immediate uncertainty.',
  long_description = 'This horary reading is built around one precise question asked at a meaningful moment. Instead of using birth data, the astrologer interprets the chart cast for the time the question is received and examines symbols that speak to the issue directly. It is best for urgent uncertainty, event outcomes, missing-information situations, and questions that need a focused answer structure rather than a broad life overview.',
  whats_included = ARRAY['A horary chart cast for the question moment rather than the birth chart.', 'Focused interpretation around one clearly defined issue, event, or outcome.', 'Assessment of relevant houses, rulers, applying aspects, and chart testimony.', 'A concise answer structure with explanation of why the chart points that way.', 'Practical guidance on what the chart suggests about timing or next steps.']::text[],
  who_its_for = ARRAY['Clients with one urgent, well-defined question that needs focused astrological judgment.', 'People facing immediate uncertainty around an event, choice, or missing information.', 'Anyone who wants a precise horary approach rather than a broad natal reading.', 'Clients comfortable narrowing the reading to one core matter at a time.']::text[],
  faq = '[{"question":"Do I need birth details for horary?","answer":"No. Horary uses the chart for the moment the question is asked, not the natal chart."},{"question":"What kinds of questions work best?","answer":"Questions work best when they are specific, sincere, and centered on one issue rather than several overlapping topics."},{"question":"Can horary give a simple yes or no?","answer":"Sometimes, but strong horary also explains the conditions, complications, and timing around the answer."},{"question":"Should I ask more than one question in the same session?","answer":"It is usually better to focus on one clear question so the chart remains interpretable and precise."}]'::jsonb,
  seo_title = 'Horary Reading for Predictive Events | Focused Astrology Answer',
  seo_description = 'Book a horary astrology reading for one clear question about an event, outcome, or immediate uncertainty with focused chart-based insight.',
  image_url = '/images/services/horary.png',
  updated_at = now()
WHERE slug = 'predictive-event-horary';

UPDATE service_templates
SET
  description = 'Productized horary service emphasizing one precise question and clear answer structure.',
  long_description = 'The General Predictive Event (Horary) product is a tightly focused astrology offering for clients who need clarity around one specific question. It uses the chart of the asking moment to evaluate conditions, likely outcomes, and timing cues without relying on birth data. This format is ideal when the client wants a premium, direct-answer astrology product that stays narrow, precise, and efficient.',
  whats_included = ARRAY['A horary-based astrology product centered on one clearly defined question.', 'Interpretation of the chart testimony relevant to the issue or outcome being asked about.', 'A direct-answer structure that also explains conditions, complications, and timing cues.', 'No birth data requirement, which makes the product fast and accessible to use.', 'A premium focused format designed for immediate uncertainty and clear next-step thinking.']::text[],
  who_its_for = ARRAY['Clients who need a precise answer to one pressing question without booking a broad reading.', 'People dealing with event uncertainty, missing information, or a high-stakes decision point.', 'Anyone seeking a direct horary-style astrology product that does not depend on birth data.', 'Clients comfortable narrowing the reading to a single issue for clarity.']::text[],
  faq = '[{"question":"What makes horary different from natal astrology products?","answer":"Horary uses the chart of the question moment, so it is centered on one issue rather than a whole-life interpretation."},{"question":"Do I need exact birth time for this product?","answer":"No. Horary does not rely on birth data, which is one reason it works well for urgent questions."},{"question":"Can I ask multiple questions in one product?","answer":"It works best when you keep the focus on one sincere, specific question so the chart remains clear."},{"question":"Will this always give a guaranteed outcome?","answer":"No astrology method guarantees certainty, but horary is designed to offer a focused judgment based on the chart’s testimony."}]'::jsonb,
  seo_title = 'General Horary Reading | Predictive Event Astrology Product',
  seo_description = 'Use a horary astrology product for one precise question about an event, outcome, or immediate uncertainty without needing birth data.',
  image_url = '/images/services/horary.png',
  updated_at = now()
WHERE slug = 'general-predictive-event-horary';

UPDATE service_templates
SET
  description = 'Expansion-cycle reading for growth, opportunity, confidence, and 12-year chapter resets.',
  long_description = 'A Jupiter Return marks the beginning of a new twelve-year growth cycle. This reading explores where opportunity, belief, learning, travel, visibility, and expansion are asking to open in your life, while also naming where excess or overreach may need more discernment. It is ideal for clients approaching or moving through a Jupiter Return who want to work with the cycle intentionally rather than passively.',
  whats_included = ARRAY['Interpretation of the Jupiter Return chart in relation to the natal chart.', 'Guidance on growth themes, opportunities, risk appetite, and confidence cycles.', 'Discussion of where expansion is supported and where discernment matters more.', 'Context for education, travel, abundance, belief, and long-range momentum.', 'A practical read on how to use the next twelve-year chapter well.']::text[],
  who_its_for = ARRAY['Clients approaching a Jupiter Return and wanting clarity on the next chapter of growth.', 'People ready for expansion but wanting better strategy around opportunity and timing.', 'Anyone reflecting on abundance, confidence, learning, or renewed purpose.', 'Clients who want to work consciously with a major twelve-year cycle.']::text[],
  faq = '[{"question":"How often does a Jupiter Return happen?","answer":"Roughly every twelve years, when transiting Jupiter returns to its natal position."},{"question":"What topics does a Jupiter Return affect?","answer":"It often highlights growth, optimism, learning, travel, visibility, faith, and the areas of life asking to expand."},{"question":"Is this always a lucky period?","answer":"It can bring opportunity, but the reading also looks at judgment, pacing, and whether growth is sustainable rather than inflated."},{"question":"Do birth details matter for this reading?","answer":"Yes. Accurate birth data helps place the return into the correct houses and timing framework."}]'::jsonb,
  seo_title = 'Jupiter Return Reading | Growth Cycle Astrology Session',
  seo_description = 'Book a Jupiter Return reading for insight into growth, opportunity, confidence, abundance, and the next twelve-year chapter of your life.',
  image_url = '/images/services/jupiter-return.png',
  updated_at = now()
WHERE slug = 'jupiter-return';

UPDATE service_templates
SET
  description = 'Growth-cycle product centered on opportunity, abundance, and long-range momentum.',
  long_description = 'The General Jupiter Return product is designed for clients entering a major growth cycle and wanting structured guidance around opportunity, belief, confidence, and expansion. It clarifies where momentum is building, where perspective is widening, and where thoughtful restraint matters just as much as optimism. The result is a premium astrology product for intentional growth rather than passive hope.',
  whats_included = ARRAY['A Jupiter Return overview focused on expansion, opportunity, and long-range growth.', 'Interpretation of where abundance, learning, travel, or visibility may be opening.', 'Practical guidance on optimism, strategy, and avoiding overreach.', 'Context for the next twelve-year cycle and the themes asking to grow now.', 'A premium growth-oriented format designed for perspective, planning, and momentum.']::text[],
  who_its_for = ARRAY['Clients entering a Jupiter Return and wanting a clear product around growth and opportunity.', 'People reevaluating purpose, abundance, or long-range vision at a turning point.', 'Anyone who wants a premium astrology product focused on expansion and wise momentum.', 'Clients ready to approach a new cycle with strategy rather than guesswork.']::text[],
  faq = '[{"question":"What is the main purpose of this Jupiter Return product?","answer":"It helps you understand where growth, confidence, and opportunity are opening so you can work with the cycle intentionally."},{"question":"Does this only apply on the exact return date?","answer":"No. The return is a wider cycle, and the product helps interpret the broader chapter it begins."},{"question":"Can this help with career or study decisions?","answer":"Yes. Jupiter cycles often connect strongly to learning, travel, visibility, opportunity, and broader life direction."},{"question":"Do I need accurate birth time?","answer":"Yes. Accurate birth data improves house placement and makes the cycle more specific to your life structure."}]'::jsonb,
  seo_title = 'General Jupiter Return Reading | Growth and Opportunity Astrology',
  seo_description = 'Explore a Jupiter Return astrology product for growth, abundance, confidence, and long-range opportunity across a new twelve-year cycle.',
  image_url = '/images/services/jupiter-return.png',
  updated_at = now()
WHERE slug = 'general-jupiter-return';

UPDATE service_templates
SET
  description = 'Major life-structure reading for discipline, responsibility, endings, and durable rebuilding.',
  long_description = 'A Saturn Return marks a profound phase of reality-testing, maturation, and structural change. This reading helps clients understand what is ending, what must be rebuilt, where responsibility is increasing, and what long-term foundation is being asked of them now. It is especially helpful for people in their late twenties, late fifties, or anyone consciously navigating a Saturn cycle with more depth and steadiness.',
  whats_included = ARRAY['Interpretation of the Saturn Return chart in relation to natal Saturn and key life structures.', 'Guidance on responsibility, maturity, boundaries, endings, and durable rebuilding.', 'Context for pressure points, long-term commitments, and the lessons of the cycle.', 'Insight into where discipline is needed and where outdated structures are breaking down.', 'A grounded reading style designed for serious transition and long-range clarity.']::text[],
  who_its_for = ARRAY['Clients approaching or moving through a Saturn Return and wanting structure around the process.', 'People facing major life responsibility, pressure, or the collapse of old patterns.', 'Anyone rebuilding work, relationships, identity, or commitment under serious conditions.', 'Clients who want a sober, constructive reading for a major maturity cycle.']::text[],
  faq = '[{"question":"When does a Saturn Return happen?","answer":"It happens roughly every 29 years, usually around ages 27 to 30 and again around 56 to 59."},{"question":"Is Saturn Return always difficult?","answer":"It is often demanding, but the deeper purpose is maturity, integrity, and building a life that can actually hold your future."},{"question":"What areas of life can Saturn Return affect?","answer":"It can affect career, commitment, relationships, identity, boundaries, health habits, and any structure that is no longer sustainable."},{"question":"Why is birth accuracy important here?","answer":"Exact birth data helps place Saturn’s return into the correct houses and life areas, which makes the reading far more specific."}]'::jsonb,
  seo_title = 'Saturn Return Reading | Major Astrology Transition Session',
  seo_description = 'Book a Saturn Return reading for guidance on responsibility, endings, maturity, boundaries, and rebuilding strong foundations during a major life cycle.',
  image_url = '/images/services/saturn-return.png',
  updated_at = now()
WHERE slug = 'saturn-return';

UPDATE service_templates
SET
  description = 'Productized Saturn Return guidance with maturity, pressure, and rebuild themes.',
  long_description = 'The General Saturn Return product gives clients a structured reading for one of astrology’s most demanding and formative cycles. It focuses on pressure, responsibility, endings, commitment, and the stronger foundation that must be built in response. This product is intended for people who want a serious, premium astrology offering that helps them navigate Saturn’s demands with more clarity and less chaos.',
  whats_included = ARRAY['A Saturn Return overview centered on maturity, responsibility, and life restructuring.', 'Interpretation of where pressure is building and what the cycle is asking you to confront.', 'Practical guidance on boundaries, commitment, endings, and stronger foundations.', 'Context for long-term rebuilding rather than short-term emotional reaction.', 'A premium format designed for clear insight during a major transitional cycle.']::text[],
  who_its_for = ARRAY['Clients entering Saturn Return and wanting a focused product around pressure and rebuild themes.', 'People navigating life restructuring, heavier responsibility, or a collapse of old patterns.', 'Anyone seeking a premium astrology product that treats this cycle seriously and constructively.', 'Clients who want to understand what Saturn is asking them to mature into now.']::text[],
  faq = '[{"question":"What is the core purpose of a Saturn Return product?","answer":"It helps you understand the lessons, pressures, and structural changes of the cycle so you can respond with maturity and intention."},{"question":"Does this cycle always involve loss or hardship?","answer":"Not always in the same way, but it often asks for realism, pruning, responsibility, and stronger long-term alignment."},{"question":"Can this product help with career or commitment decisions?","answer":"Yes. Saturn cycles often press directly on career structure, commitment, responsibility, and long-term direction."},{"question":"Do exact birth details matter?","answer":"Yes. Accurate birth details improve house placement and make the reading much more specific to your lived experience."}]'::jsonb,
  seo_title = 'General Saturn Return Reading | Maturity and Rebuild Astrology',
  seo_description = 'Navigate Saturn Return with astrology insight into pressure, responsibility, endings, commitment, and the foundations you are meant to rebuild.',
  image_url = '/images/services/saturn-return.png',
  updated_at = now()
WHERE slug = 'general-saturn-return';

UPDATE service_templates
SET
  description = 'Personal yearly energy reading for drive, courage, conflict, desire, and action patterns.',
  long_description = 'A Mars Return reading shows how your personal energy, motivation, conflict style, courage, and desire are likely to cycle through the coming year. It helps clients understand where they are ready to act, where frustration may build, and how to work with sharper Mars energy more intelligently. This is especially useful for clients managing ambition, burnout, conflict, sexuality, or major action-oriented goals.',
  whats_included = ARRAY['Interpretation of the Mars Return chart in relation to natal Mars and current priorities.', 'Guidance on drive, courage, assertion, desire, and conflict patterns for the year ahead.', 'Insight into where energy is strong, where frustration may build, and how to direct momentum well.', 'Context for ambition, competition, passion, and the healthy use of force.', 'A practical reading for channeling action without burning out or escalating unnecessarily.']::text[],
  who_its_for = ARRAY['Clients wanting to understand their action cycle, motivation, and conflict patterns for the year ahead.', 'People navigating ambition, burnout, anger, sexuality, or a push to act decisively.', 'Anyone preparing for a demanding year that requires stronger energy management.', 'Clients who want a focused astrology reading around drive, courage, and momentum.']::text[],
  faq = '[{"question":"How often does a Mars Return happen?","answer":"Roughly every two years, when transiting Mars returns to its natal position."},{"question":"What does a Mars Return reading focus on?","answer":"It focuses on energy, motivation, action, frustration, desire, conflict, and how you are likely to direct force through the coming cycle."},{"question":"Can this help with burnout or anger management?","answer":"Yes. One of the strengths of this reading is showing where energy is likely to spike, stall, or become reactive if not directed well."},{"question":"Do accurate birth details matter?","answer":"Yes. Accurate birth time helps place the cycle into the correct houses and keeps the interpretation more precise."}]'::jsonb,
  seo_title = 'Mars Return Reading | Personal Energy and Action Astrology',
  seo_description = 'Book a Mars Return reading for insight into motivation, courage, conflict, desire, and how to direct your energy through the coming cycle.',
  image_url = '/images/services/mars-return.png',
  updated_at = now()
WHERE slug = 'mars-return';

UPDATE service_templates
SET
  description = 'Productized action-cycle service focused on momentum, assertiveness, and timing.',
  long_description = 'The General Mars Return product is built for clients who want a focused astrology reading on drive, momentum, desire, and the intelligent use of personal force. It shows where energy is rising, where frustration may surface, and how to navigate a more assertive cycle without losing precision or control. This premium product is especially useful when clients need help directing action rather than simply generating more pressure.',
  whats_included = ARRAY['A Mars Return overview focused on energy, momentum, assertiveness, and personal drive.', 'Interpretation of likely action patterns, frustration points, and confidence shifts in the cycle ahead.', 'Practical guidance on directing effort, desire, and confrontation more effectively.', 'Context for ambition, passion, competition, and the pace of execution.', 'A premium focused format designed for clients who need sharper action strategy.']::text[],
  who_its_for = ARRAY['Clients entering a more intense action cycle and wanting a clear product around momentum and drive.', 'People dealing with frustration, assertiveness, conflict, ambition, or energy-management issues.', 'Anyone seeking a premium astrology product focused on courage, timing, and disciplined action.', 'Clients who want to work with strong Mars energy more consciously and effectively.']::text[],
  faq = '[{"question":"What is the core benefit of a Mars Return product?","answer":"It helps you understand how your energy, assertiveness, frustration, and momentum are likely to behave so you can direct them well."},{"question":"Is this only for conflict-heavy periods?","answer":"No. It is also useful for productive ambition, fitness goals, creative passion, and any cycle that demands stronger action."},{"question":"Can this help with timing and execution?","answer":"Yes. The product is well suited to clients who want better awareness of how and when to use effort effectively."},{"question":"Do I need exact birth details?","answer":"Yes. Accurate birth data keeps the cycle tied to the correct life areas and makes the interpretation more actionable."}]'::jsonb,
  seo_title = 'General Mars Return Reading | Action and Momentum Astrology',
  seo_description = 'Use a Mars Return astrology product for insight into drive, assertiveness, conflict patterns, desire, and the timing of action through the coming cycle.',
  image_url = '/images/services/mars-return.png',
  updated_at = now()
WHERE slug = 'general-mars-return';

UPDATE service_templates
SET
  description = 'Midlife awakening reading for liberation, disruption, reinvention, and major turning points.',
  long_description = 'The Uranus Opposition is one of the defining reinvention cycles of adult life, often associated with awakening, disruption, identity revision, and the urge to break from what no longer fits. This reading helps clients understand what is destabilizing, what is trying to liberate itself, and how to move through change without wasting the deeper transformation. It is especially useful in midlife or during any chapter of intense sudden change that carries unmistakable Uranian pressure.',
  whats_included = ARRAY['Interpretation of the Uranus Opposition in relation to the natal chart and current life structure.', 'Guidance on reinvention, disruption, awakening, autonomy, and identity shifts.', 'Insight into where change is necessary and where impulsive rupture may not serve you.', 'Context for freedom, authenticity, instability, and breakthrough energy.', 'A practical reading for navigating a volatile but meaningful turning point.']::text[],
  who_its_for = ARRAY['Clients moving through midlife reinvention or a major disruption that feels impossible to ignore.', 'People confronting freedom, identity, career, or relationship changes with high urgency.', 'Anyone experiencing sudden awakenings, instability, or a pull toward radical authenticity.', 'Clients who want a serious reading for a cycle of breakthrough and upheaval.']::text[],
  faq = '[{"question":"What is a Uranus Opposition?","answer":"It is a major transit, often associated with midlife, when transiting Uranus opposes its natal position and pushes for disruption, awakening, and change."},{"question":"Is this always a crisis transit?","answer":"Not always, but it often feels destabilizing because it exposes what is no longer alive, true, or sustainable."},{"question":"What kinds of life areas can it affect?","answer":"It can affect identity, career, relationships, freedom needs, lifestyle, and any structure that has become too rigid or false."},{"question":"Why is this reading helpful?","answer":"It helps distinguish meaningful liberation from impulsive reaction, which is often the difference between breakthrough and unnecessary chaos."}]'::jsonb,
  seo_title = 'Uranus Opposition Reading | Reinvention and Awakening Astrology',
  seo_description = 'Book a Uranus Opposition reading for guidance on reinvention, liberation, disruption, and major life turning points during a powerful awakening cycle.',
  image_url = '/images/services/uranus-opposition.png',
  updated_at = now()
WHERE slug = 'uranus-opposition';

UPDATE service_templates
SET
  description = 'Reinvention and awakening product for major life pivots and identity shifts.',
  long_description = 'The General Uranus Opposition product is for clients moving through a period of radical change, awakening, or midlife reinvention. It focuses on the instability, liberation impulse, and identity shift that often define this transit, while helping the client separate meaningful breakthrough from avoidable chaos. This premium product is designed for turning points that demand honesty, courage, and a wider view of what change is trying to accomplish.',
  whats_included = ARRAY['A Uranus Opposition overview focused on awakening, reinvention, and disruptive change.', 'Interpretation of where freedom pressure, instability, and breakthrough energy are building.', 'Practical guidance on identity shifts, life pivots, and conscious change-making.', 'Context for separating real liberation from impulsive disruption.', 'A premium transition-focused format designed for major turning points.']::text[],
  who_its_for = ARRAY['Clients moving through midlife change, awakening, or a strong reinvention phase.', 'People navigating career pivots, relationship disruption, or identity-level restlessness.', 'Anyone seeking a premium astrology product for a major freedom and transformation cycle.', 'Clients who want to understand what sudden change is asking of them before reacting blindly.']::text[],
  faq = '[{"question":"What is the main value of this Uranus Opposition product?","answer":"It helps you understand the deeper meaning of disruptive change so you can work with awakening energy more consciously."},{"question":"Is this product only for midlife?","answer":"It is often most relevant in midlife, but it can also support any chapter marked by unmistakable Uranian disruption and reinvention."},{"question":"Can this help with major life pivots?","answer":"Yes. It is especially useful when career, identity, relationship, or lifestyle shifts feel sudden or destabilizing."},{"question":"Do birth details matter for this reading?","answer":"Yes. Accurate birth data helps place the transit into the right houses and gives the reinvention cycle more specific context."}]'::jsonb,
  seo_title = 'General Uranus Opposition Reading | Reinvention Astrology Product',
  seo_description = 'Navigate a Uranus Opposition with astrology insight into awakening, disruption, freedom, reinvention, and major identity or life pivots.',
  image_url = '/images/services/uranus-opposition.png',
  updated_at = now()
WHERE slug = 'general-uranus-opposition';

UPDATE service_templates
SET
  description = 'Fast, focused tarot reading for one clear question and a concise directional answer.',
  long_description = 'This practitioner-led 3 card spread is designed for quick clarity around one focused question. It uses a simple but disciplined spread structure to identify the core situation, the most important influence, and the likely direction or advice. It works best when the client has one specific issue and wants symbolic guidance that is practical, clean, and easy to act on.',
  whats_included = ARRAY['A focused 3 card spread built around one clear question or decision point.', 'Interpretation of the core situation, strongest influence, and likely direction.', 'Straightforward symbolic guidance without unnecessary complexity.', 'Action-oriented takeaways that help the client move forward clearly.', 'A concise reading format ideal for immediate clarity and next steps.']::text[],
  who_its_for = ARRAY['Clients with one focused question who want quick tarot insight.', 'People at a small crossroads who need a concise directional reading.', 'Anyone who prefers a compact spread over a longer deep-dive session.', 'Clients seeking practical symbolic guidance without overcomplication.']::text[],
  faq = '[{"question":"What kinds of questions work best for a 3 card spread?","answer":"Clear, focused questions work best, especially when you want direction, perspective, or the next practical step."},{"question":"Is this enough for a complicated situation?","answer":"It is best for straightforward issues. For layered situations, a larger spread usually gives better depth."},{"question":"Do I need to prepare anything before the reading?","answer":"A clear question or area of focus is enough. The more specific you are, the more useful the reading becomes."},{"question":"Will the reading tell me exactly what to do?","answer":"Tarot offers symbolic guidance and perspective, but the strongest use of the reading is to support clearer choices, not replace your agency."}]'::jsonb,
  seo_title = '3 Card Tarot Reading | Quick Clarity Spread',
  seo_description = 'Book a 3 card tarot reading for fast clarity, practical guidance, and a concise answer to one focused question or decision.',
  image_url = '/images/services/3-card-basic.png',
  updated_at = now()
WHERE slug = '3-card-basic-question-spread';

UPDATE service_templates
SET
  description = 'Productized quick-answer tarot spread for immediate clarity and next steps.',
  long_description = 'The General 3 Card Basic Question Spread is a clean, productized tarot offering for clients who want immediate clarity on one focused question. It keeps the spread structure simple so the guidance stays sharp, practical, and easy to apply. This product is ideal for clients who need fast symbolic insight without committing to a larger spread or more layered reading.',
  whats_included = ARRAY['A 3 card tarot product centered on one focused question or issue.', 'Clear interpretation of the present dynamic, key influence, and likely direction.', 'Practical symbolic guidance in a short, efficient format.', 'Actionable takeaways for next steps, perspective, or decision support.', 'A productized tarot reading built for quick clarity and momentum.']::text[],
  who_its_for = ARRAY['Clients who want a fast tarot product for one immediate question.', 'People looking for concise guidance without a deep-dive spread.', 'Anyone seeking a practical and affordable entry-point tarot reading.', 'Clients who value clear next steps over extensive symbolic complexity.']::text[],
  faq = '[{"question":"What is this tarot product best used for?","answer":"It is best for one focused question where you want immediate perspective, direction, or next-step guidance."},{"question":"Will a short spread still be meaningful?","answer":"Yes. A well-framed 3 card spread can be highly effective when the question is clear and the reading stays focused."},{"question":"Can this be used as a first tarot product?","answer":"Yes. It is one of the easiest entry points for clients who want concise tarot guidance."},{"question":"Should I choose this if my situation is complex?","answer":"If the issue has many moving parts, a 5 card or larger spread may provide better depth."}]'::jsonb,
  seo_title = 'General 3 Card Tarot Reading | Quick Clarity Product',
  seo_description = 'Use a 3 card tarot product for fast clarity, symbolic guidance, and immediate next-step insight around one focused question.',
  image_url = '/images/services/3-card-basic.png',
  updated_at = now()
WHERE slug = 'general-3-card-basic-question-spread';

UPDATE service_templates
SET
  description = 'Deeper tarot reading for layered situations with context, challenge, advice, and likely outcome.',
  long_description = 'This 5 card tarot spread is designed for more layered questions that need structure and nuance. The spread helps the reader explore the context, hidden influences, central challenge, advice, and likely direction so the answer does not collapse into a simplistic yes or no. It is ideal when the client is dealing with a real decision, emotional complexity, or a situation with multiple moving parts.',
  whats_included = ARRAY['A structured 5 card spread for nuanced or multi-layered questions.', 'Interpretation of context, challenge, underlying influence, advice, and likely direction.', 'Deeper symbolic guidance than a short quick-answer spread can offer.', 'Practical takeaways that connect the cards to real decisions and next steps.', 'A balanced reading format that supports depth without becoming overwhelming.']::text[],
  who_its_for = ARRAY['Clients dealing with a more complex question than a quick spread can handle.', 'People who need perspective on layered emotional, personal, or practical situations.', 'Anyone wanting clearer decision support through structured tarot interpretation.', 'Clients who value depth but do not need a full major spread.']::text[],
  faq = '[{"question":"When should I choose a 5 card spread over a 3 card spread?","answer":"Choose it when your question has more complexity, mixed emotions, or several factors that need to be understood together."},{"question":"Does this spread still stay practical?","answer":"Yes. The added depth is there to improve clarity, not make the reading vague or abstract."},{"question":"Can this help with difficult decisions?","answer":"Yes. It is well suited to decisions that need context, challenge analysis, and realistic guidance."},{"question":"Do I need a very specific question?","answer":"Specificity helps, but this spread can also handle broader situations as long as the issue is meaningfully defined."}]'::jsonb,
  seo_title = '5 Card Tarot Reading | Complex Question Spread',
  seo_description = 'Book a 5 card tarot reading for deeper guidance on layered situations, challenges, advice, and likely outcomes when a quick spread is not enough.',
  image_url = '/images/services/5-card-complex.png',
  updated_at = now()
WHERE slug = '5-card-complex-question-spread';

UPDATE service_templates
SET
  description = 'Productized complex-question tarot reading with stronger decision-support framing.',
  long_description = 'The General 5 Card Complex Question Spread is a tarot product built for clients who need more structure and depth than a quick-answer spread can provide. It helps unpack layered situations, emotional complexity, and practical crossroads by using a five-position spread that keeps the interpretation organized and actionable. This format works especially well for decision support, problem-solving, and nuanced symbolic guidance.',
  whats_included = ARRAY['A 5 card tarot product designed for layered questions and more complex situations.', 'Interpretation of context, challenge, advice, hidden influence, and likely direction.', 'Decision-support framing that keeps the reading grounded and practical.', 'Stronger depth than a short spread while staying clear and focused.', 'A productized format built for clients who need nuance without excess sprawl.']::text[],
  who_its_for = ARRAY['Clients needing more depth than a quick tarot product can offer.', 'People making a meaningful decision or processing a layered situation.', 'Anyone wanting a structured tarot product that supports real-world judgment.', 'Clients who want a premium middle-ground option between quick clarity and a major spread.']::text[],
  faq = '[{"question":"What does this product do better than a short spread?","answer":"It gives enough structure to unpack challenge, context, advice, and likely direction without collapsing the reading into a simplistic answer."},{"question":"Is this useful for decision-making?","answer":"Yes. It is especially well suited to clients who need symbolic guidance around a meaningful choice or complicated situation."},{"question":"Will the reading still stay practical?","answer":"Yes. The spread is designed to add nuance while still producing actionable takeaways and clarity."},{"question":"Should I choose this over a major spread?","answer":"Choose it when you want depth and structure but do not need the breadth of a larger 7, 10, or 12 card reading."}]'::jsonb,
  seo_title = 'General 5 Card Tarot Reading | Complex Question Product',
  seo_description = 'Use a 5 card tarot product for deeper insight into layered questions, challenge, advice, and decision support with a structured spread.',
  image_url = '/images/services/5-card-complex.png',
  updated_at = now()
WHERE slug = 'general-5-card-complex-question-spread';

UPDATE service_templates
SET
  description = 'Mid-range forecast spread for the next six months and major directional themes.',
  long_description = 'This 7 card forecast spread is built for clients who want a mid-range tarot view of the next six months. It helps reveal the momentum, risks, shifts, and larger directional themes shaping the period ahead without pretending that timing is perfectly fixed. The reading is ideal for planning, reflection, and understanding how a current path may unfold over the medium term.',
  whats_included = ARRAY['A 7 card forecast spread focused on the next six months of movement and patterning.', 'Interpretation of momentum, likely shifts, risks, and emerging opportunities.', 'A medium-range reading structure that balances guidance with realistic uncertainty.', 'Practical takeaways for planning, pacing, and responding well to what is developing.', 'A forward-looking tarot session that keeps symbolism connected to lived decisions.']::text[],
  who_its_for = ARRAY['Clients wanting a six-month tarot outlook instead of a quick-answer spread.', 'People planning a transition, project, or season of change over the coming months.', 'Anyone seeking mid-range symbolic guidance without committing to a full-year forecast.', 'Clients who want to understand momentum, risks, and timing patterns in a broader arc.']::text[],
  faq = '[{"question":"Can tarot really look six months ahead?","answer":"Tarot is best understood as showing patterns, momentum, likely developments, and guidance rather than an unchangeable fixed future."},{"question":"What makes this spread different from a short reading?","answer":"It gives more room to see how themes develop over time, which makes it better for planning and medium-range perspective."},{"question":"Is this a good reading for major life changes?","answer":"Yes. It is especially useful when you want to understand the shape of the next chapter instead of just the immediate next step."},{"question":"Will this focus on one area of life or the whole picture?","answer":"It can do either, depending on the question. The spread is flexible enough to support a broad forecast or a themed six-month review."}]'::jsonb,
  seo_title = '6 Month Tarot Forecast | 7 Card Forward Review',
  seo_description = 'Book a 7 card tarot forecast for the next six months to understand momentum, risks, opportunities, and the direction of your path ahead.',
  image_url = '/images/services/7-card-forecast.png',
  updated_at = now()
WHERE slug = '7-card-6-month-forward-review';

UPDATE service_templates
SET
  description = 'Six-month guidance product framed around momentum, risks, and future planning.',
  long_description = 'The General 7 Card 6 Month Forward Review is a structured tarot forecasting product for clients who want a broader look at the next half year. It focuses on momentum, likely developments, challenges, and directional shifts so the client can plan more consciously. The product keeps the reading practical and strategic while preserving tarot’s symbolic depth and interpretive nuance.',
  whats_included = ARRAY['A 7 card tarot forecast product for medium-range insight across the next six months.', 'Interpretation of momentum, risks, opportunities, and evolving themes.', 'A planning-oriented reading format that supports strategic perspective.', 'Practical guidance for pacing, preparation, and future-focused decision support.', 'A productized forecast designed for clients who want more than short-term clarity.']::text[],
  who_its_for = ARRAY['Clients wanting a medium-range tarot product for planning and reflection.', 'People entering a significant season of change, movement, or uncertainty.', 'Anyone seeking a premium future-oriented spread without moving into a full major read.', 'Clients who want symbolic guidance on momentum, risk, and direction over time.']::text[],
  faq = '[{"question":"What is the main use of this six-month tarot product?","answer":"It is meant to give broader perspective on momentum, challenges, and the likely direction of the next chapter so you can plan more consciously."},{"question":"Is this predictive or advisory?","answer":"It is both. Tarot can reveal likely developments, but the strongest value is often in the guidance it gives about how to meet them well."},{"question":"Can this product focus on one theme like career or love?","answer":"Yes. It can be framed around a specific life area or used more broadly depending on the client’s focus."},{"question":"How is this different from a major spread?","answer":"It is forecast-oriented and medium-range, whereas larger major spreads usually provide wider or deeper symbolic coverage of a situation."}]'::jsonb,
  seo_title = 'General 6 Month Tarot Forecast | 7 Card Product',
  seo_description = 'Use a 7 card tarot forecast product for six-month guidance on momentum, risks, opportunities, and future planning.',
  image_url = '/images/services/7-card-forecast.png',
  updated_at = now()
WHERE slug = 'general-7-card-6-month-forward-review';

UPDATE service_templates
SET
  description = 'Classic horseshoe reading for influences, obstacles, guidance, and likely outcome.',
  long_description = 'The Horseshoe Spread is a classic seven-card layout that offers a rounded picture of the forces surrounding a situation. It works well when a client wants a substantial reading that covers influences, obstacles, guidance, external factors, and likely outcome without becoming as extensive as a ten-card spread. The structure makes it especially useful for situations where context and movement both matter.',
  whats_included = ARRAY['A classic 7 card Horseshoe spread covering influences, obstacles, guidance, and likely direction.', 'Interpretation of internal and external factors shaping the situation.', 'A balanced reading structure that gives both context and forward movement.', 'Practical symbolic guidance for responding well to the issue at hand.', 'A major spread experience without the full sprawl of the largest layouts.']::text[],
  who_its_for = ARRAY['Clients wanting a substantial tarot reading with strong structure and breadth.', 'People needing a fuller picture of a situation than short spreads provide.', 'Anyone who values classic spread design and layered symbolic interpretation.', 'Clients seeking a major read that is balanced, practical, and not overly sprawling.']::text[],
  faq = '[{"question":"What is the Horseshoe Spread best used for?","answer":"It is best for situations where you need context, obstacles, guidance, and outcome all considered together in one structured reading."},{"question":"Is this a major read?","answer":"Yes. It is more substantial than a quick spread and offers a fuller, more layered reading experience."},{"question":"How is this different from a Celtic Cross?","answer":"The Horseshoe is broad and balanced but slightly more contained, while the Celtic Cross is often even more comprehensive and complex."},{"question":"Can this spread focus on one topic?","answer":"Yes. It works well for a single important issue, especially when the situation has multiple moving parts."}]'::jsonb,
  seo_title = '7 Card Horseshoe Tarot Reading | Major Spread',
  seo_description = 'Book a 7 card Horseshoe tarot reading for guidance on influences, obstacles, advice, and likely outcomes through a classic major spread.',
  image_url = '/images/services/7-card-horseshoe.png',
  updated_at = now()
WHERE slug = '7-card-horseshoe-spread-major-read';

UPDATE service_templates
SET
  description = 'Productized major spread reading with balanced overview and deeper symbolic interpretation.',
  long_description = 'The General 7 Card Horseshoe Spread is a premium tarot product for clients who want a broad but manageable major reading. It offers a structured look at influences, challenges, guidance, external conditions, and likely direction, making it ideal when the client needs a fuller picture without moving into the largest spread format. This product combines classic spread architecture with practical interpretation and symbolic depth.',
  whats_included = ARRAY['A premium Horseshoe tarot product with seven positions of structured insight.', 'Interpretation of influences, obstacles, guidance, external factors, and likely direction.', 'A major-spread format that balances breadth with readability.', 'Practical takeaways rooted in classic symbolic structure.', 'A productized reading for clients who want layered guidance without excess complexity.']::text[],
  who_its_for = ARRAY['Clients wanting a premium major spread that is broad but still manageable.', 'People needing a fuller tarot overview of an important situation or decision.', 'Anyone seeking a classic spread product with solid symbolic depth and structure.', 'Clients who want more context than short spreads provide without jumping to the largest layout.']::text[],
  faq = '[{"question":"Why choose the Horseshoe product?","answer":"It offers a strong middle ground between shorter spreads and the most expansive layouts, making it ideal for fuller but still focused insight."},{"question":"Is this reading good for big life questions?","answer":"Yes. It is especially useful when you want a wider symbolic picture of a meaningful situation or decision."},{"question":"Does this stay practical or become too abstract?","answer":"The product is designed to keep the symbolic interpretation grounded in practical guidance and next-step awareness."},{"question":"How does this compare to the Celtic Cross product?","answer":"It is slightly more contained and easier to absorb, while the Celtic Cross tends to be more expansive and intricate."}]'::jsonb,
  seo_title = 'General 7 Card Horseshoe Tarot Reading | Major Product',
  seo_description = 'Use a 7 card Horseshoe tarot product for a balanced major spread covering influences, obstacles, guidance, and likely direction.',
  image_url = '/images/services/7-card-horseshoe.png',
  updated_at = now()
WHERE slug = 'general-7-card-horseshoe-spread-major-read';

UPDATE service_templates
SET
  description = 'Relationship tarot reading for emotional dynamics, hidden tensions, and future direction.',
  long_description = 'This ten-card relationship spread is designed for in-depth tarot work around emotional dynamics, mutual perception, hidden tensions, and the direction of the connection. It is well suited to clients who want more than a simple compatibility answer and need a reading that can hold nuance, patterning, and practical emotional guidance. The spread can be used for romantic relationships, entanglements, and emotionally significant partnerships.',
  whats_included = ARRAY['A 10 card relationship spread focused on emotional dynamics and mutual patterning.', 'Interpretation of hidden tensions, desires, fears, and possible future direction.', 'A substantial reading format for nuanced relationship questions.', 'Practical guidance on communication, boundaries, and what the connection is asking for now.', 'A deep tarot structure for clients who need more than surface-level relationship advice.']::text[],
  who_its_for = ARRAY['Clients seeking a fuller tarot reading on a romantic or emotionally significant relationship.', 'People dealing with hidden tension, uncertainty, or strong attachment dynamics.', 'Anyone wanting symbolic guidance on where a relationship is headed and what is shaping it.', 'Clients who need depth and emotional nuance rather than a quick yes-or-no answer.']::text[],
  faq = '[{"question":"Is this only for romantic relationships?","answer":"It is designed primarily for romantic or emotionally intimate connections, though it can also be adapted for other significant relationship dynamics."},{"question":"Can this spread reveal hidden feelings or tension?","answer":"Yes. One of its strengths is showing what may be operating beneath the surface in the emotional field of the relationship."},{"question":"Does tarot guarantee the future of the relationship?","answer":"No. Tarot is best used to understand patterns, direction, and guidance, not to remove human choice or complexity."},{"question":"When should I choose this instead of a smaller spread?","answer":"Choose it when the relationship question is emotionally layered and you want real depth rather than a short directional answer."}]'::jsonb,
  seo_title = '10 Card Relationship Tarot Reading | Deep Love Spread',
  seo_description = 'Book a 10 card relationship tarot reading for insight into emotional dynamics, hidden tension, communication patterns, and future direction.',
  image_url = '/images/services/10-card-relationship.png',
  updated_at = now()
WHERE slug = '10-card-relationship-spread';

UPDATE service_templates
SET
  description = 'Productized relationship spread focused on insight, patterns, and practical next steps.',
  long_description = 'The General 10 Card Relationship Spread is a premium tarot product for clients who want structured depth around an important relationship. It explores emotional patterning, hidden dynamics, communication issues, and likely direction while keeping the reading practical and emotionally intelligent. This product is ideal when the client wants a substantial relationship-focused reading rather than a smaller spread with limited depth.',
  whats_included = ARRAY['A premium 10 card relationship tarot product built for emotional depth and clarity.', 'Interpretation of visible and hidden dynamics shaping the connection.', 'Insight into patterns, tension points, and likely movement in the relationship.', 'Practical guidance around communication, boundaries, and next steps.', 'A substantial spread format for clients who want depth without vagueness.']::text[],
  who_its_for = ARRAY['Clients needing a deep tarot product around a meaningful relationship.', 'People seeking clarity on attachment patterns, tension, and likely direction in love.', 'Anyone wanting a premium relationship spread with real symbolic depth and practical value.', 'Clients who want more nuance than short love readings can provide.']::text[],
  faq = '[{"question":"What does this relationship tarot product emphasize most?","answer":"It emphasizes emotional patterns, hidden dynamics, communication issues, and the practical next steps emerging in the connection."},{"question":"Is this useful for uncertain or complicated relationships?","answer":"Yes. It is especially valuable when the connection is emotionally layered or difficult to interpret clearly from the surface."},{"question":"Will this tell me whether to stay or leave?","answer":"The product offers symbolic guidance and perspective, but the goal is to support wiser choices rather than replace your own judgment."},{"question":"Why choose this over a smaller spread?","answer":"Choose it when the relationship carries enough emotional complexity that a shorter reading would likely miss important nuance."}]'::jsonb,
  seo_title = 'General 10 Card Relationship Tarot Reading | Love Product',
  seo_description = 'Use a 10 card relationship tarot product for insight into emotional patterns, hidden dynamics, communication, and practical next steps in love.',
  image_url = '/images/services/10-card-relationship.png',
  updated_at = now()
WHERE slug = 'general-10-card-relationship-spread';

UPDATE service_templates
SET
  description = 'Deep full-spectrum tarot reading using the Celtic Cross for complex situations.',
  long_description = 'The Celtic Cross is the classic full-spectrum tarot spread for complex questions and situations that need both depth and structure. It reveals the central issue, hidden influences, immediate pressures, deeper roots, likely direction, and the wider environment shaping the reading. This major spread is ideal when a client needs a comprehensive symbolic map rather than a narrow answer or a lightweight spread.',
  whats_included = ARRAY['A full 10 card Celtic Cross spread for broad, in-depth tarot interpretation.', 'Insight into the heart of the issue, root causes, influences, and likely direction.', 'A classic major spread format that holds complexity well.', 'Practical symbolic guidance for navigating layered situations with more awareness.', 'A comprehensive reading experience for clients wanting depth, structure, and perspective.']::text[],
  who_its_for = ARRAY['Clients facing a complex or major life situation that needs a wide symbolic map.', 'People who want a classic in-depth tarot reading rather than a quick spread.', 'Anyone seeking a major read with strong interpretive structure and depth.', 'Clients prepared for a more expansive reading experience with multiple layers of insight.']::text[],
  faq = '[{"question":"Why is the Celtic Cross considered a major spread?","answer":"It offers a broad, structured reading that can hold complexity, hidden influences, environment, and outcome direction all at once."},{"question":"What kinds of questions suit this spread best?","answer":"It works best for important or layered situations where you need a full symbolic map rather than a short answer."},{"question":"Is this spread too much for a small issue?","answer":"Sometimes. For simpler questions, a shorter spread may be more efficient and easier to act on."},{"question":"Does a Celtic Cross predict a fixed future?","answer":"No. It shows the current trajectory, influences, and likely direction, while still leaving room for human choice and change."}]'::jsonb,
  seo_title = 'Celtic Cross Tarot Reading | 10 Card Major Spread',
  seo_description = 'Book a Celtic Cross tarot reading for a comprehensive major spread covering hidden influences, root causes, guidance, and likely direction.',
  image_url = '/images/services/10-card-celtic-cross.png',
  updated_at = now()
WHERE slug = '10-card-celtic-cross-major-read';

UPDATE service_templates
SET
  description = 'Productized in-depth tarot overview using the most comprehensive classic spread.',
  long_description = 'The General 10 Card Celtic Cross is a premium tarot product for clients who need a broad, structured, and symbolically rich reading. It uses the classic Celtic Cross format to explore the core issue, hidden layers, surrounding conditions, and likely direction with more depth than smaller spreads can offer. This product is ideal when a client wants a full-spectrum tarot overview with serious interpretive substance.',
  whats_included = ARRAY['A premium Celtic Cross tarot product using the classic 10 card major spread.', 'Interpretation of the central issue, hidden influences, root patterns, and likely direction.', 'A comprehensive reading format for clients who need wide-angle symbolic clarity.', 'Practical guidance that translates a major spread into usable insight and next steps.', 'A productized full-spectrum tarot experience for complex or significant situations.']::text[],
  who_its_for = ARRAY['Clients who want the most comprehensive classic tarot product in the catalog.', 'People dealing with a major life situation that needs full-spectrum symbolic analysis.', 'Anyone seeking a premium deep-dive reading rather than a concise spread.', 'Clients who value classic tarot structure, depth, and layered interpretation.']::text[],
  faq = '[{"question":"What is the main advantage of the Celtic Cross product?","answer":"It offers one of tarot’s most complete spread structures, which makes it excellent for layered, high-stakes, or emotionally complex situations."},{"question":"Should I choose this for a simple question?","answer":"Usually not. It is best when the issue is substantial enough to justify a full-spectrum reading."},{"question":"Will this product still give practical guidance?","answer":"Yes. Even though the spread is large, the interpretation is meant to stay grounded and useful."},{"question":"How does this differ from the Horseshoe product?","answer":"The Celtic Cross is typically broader and more layered, while the Horseshoe gives a strong overview with slightly less complexity."}]'::jsonb,
  seo_title = 'General Celtic Cross Tarot Reading | Major Spread Product',
  seo_description = 'Use a Celtic Cross tarot product for a full-spectrum major spread covering hidden influences, root patterns, guidance, and likely direction.',
  image_url = '/images/services/10-card-celtic-cross.png',
  updated_at = now()
WHERE slug = 'general-10-card-celtic-cross-major-read';

UPDATE service_templates
SET
  description = 'Tarot-astrology hybrid spread mapped to the 12 houses for a whole-life overview.',
  long_description = 'This twelve-card astrological spread maps tarot through the symbolic structure of the twelve houses, creating a whole-life overview that blends tarot interpretation with astrological logic. It is especially valuable for clients who want a panoramic reading across identity, money, communication, home, relationships, work, vocation, and spiritual development. The result is a major spread with strong structure, wide coverage, and a distinct tarot-astrology synthesis.',
  whats_included = ARRAY['A 12 card tarot spread mapped to the twelve astrological houses.', 'Whole-life interpretation across identity, resources, communication, home, relationships, work, and purpose.', 'A hybrid reading approach that combines tarot symbolism with house-based structure.', 'A panoramic reading for clients wanting broad insight across multiple life domains.', 'A major spread experience that reveals patterns, imbalances, and emerging priorities.']::text[],
  who_its_for = ARRAY['Clients wanting a whole-life tarot overview rather than a reading on one narrow question.', 'People who enjoy both tarot and astrology and want a hybrid symbolic framework.', 'Anyone seeking a major spread that touches all primary life areas in one session.', 'Clients ready for a broad, layered reading with strong structural logic.']::text[],
  faq = '[{"question":"Do I need my birth chart for this tarot spread?","answer":"No. The spread uses the house framework symbolically, so it does not require natal chart data."},{"question":"What makes this spread different from the Celtic Cross?","answer":"The Astrological Spread is organized by life domains through the twelve houses, while the Celtic Cross is organized around the anatomy of one situation."},{"question":"Is this a good spread for life overview readings?","answer":"Yes. It is one of the strongest tarot layouts for broad life review and whole-picture reflection."},{"question":"Can this still focus on a current life chapter?","answer":"Yes. Even though it covers the whole wheel, it often reveals which houses or life areas are asking for the most attention now."}]'::jsonb,
  seo_title = '12 Card Astrological Tarot Spread | Whole-Life Major Read',
  seo_description = 'Book a 12 card astrological tarot spread for a whole-life overview across the houses, combining tarot symbolism with an astrology-inspired structure.',
  image_url = '/images/services/12-card-astrological.png',
  updated_at = now()
WHERE slug = '12-card-astrological-spread-major-read';

UPDATE service_templates
SET
  description = 'Productized astrological tarot spread covering all major life domains.',
  long_description = 'The General 12 Card Astrological Spread is a premium tarot product for clients who want a structured whole-life overview. Using a house-based layout inspired by astrology, it reveals the condition and emphasis of each major life domain while keeping the interpretation firmly rooted in tarot symbolism. This product is ideal for broad personal review, life-audit style readings, and clients who want a panoramic symbolic map rather than a narrow answer.',
  whats_included = ARRAY['A premium 12 card tarot product organized through the structure of the twelve houses.', 'Insight across major life domains including identity, relationships, work, money, home, and purpose.', 'A hybrid tarot-astrology reading style that offers broad structural coherence.', 'A whole-life overview format for clients seeking panoramic symbolic insight.', 'A productized major spread designed for review, reflection, and pattern awareness across the full wheel of life.']::text[],
  who_its_for = ARRAY['Clients wanting a premium whole-life tarot product instead of a question-specific reading.', 'People drawn to tarot and astrology together and wanting a hybrid symbolic framework.', 'Anyone seeking a structured life overview across all major domains.', 'Clients ready for a broad major spread that highlights priorities, imbalances, and emerging themes.']::text[],
  faq = '[{"question":"What is the core value of this astrological tarot product?","answer":"It provides a broad structured overview of all major life areas, which makes it excellent for review, reflection, and whole-picture guidance."},{"question":"Do I need astrology knowledge to benefit from it?","answer":"No. The house structure supports the reading, but the interpretation is designed to be clear and usable whether or not you know astrology."},{"question":"Is this better for broad overview than a Celtic Cross?","answer":"Yes. The Celtic Cross is stronger for one complex situation, while this product is stronger for panoramic whole-life review."},{"question":"Can this still reveal current priorities?","answer":"Yes. Even in a whole-life spread, certain houses usually stand out and show where the present moment is asking for the most attention."}]'::jsonb,
  seo_title = 'General 12 Card Astrological Tarot Spread | Whole-Life Product',
  seo_description = 'Use a 12 card astrological tarot product for a structured whole-life overview across identity, relationships, work, money, home, and purpose.',
  image_url = '/images/services/12-card-astrological.png',
  updated_at = now()
WHERE slug = 'general-12-card-astrological-spread-major-read';