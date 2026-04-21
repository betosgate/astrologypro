-- Populate the general nativity template with a complete set of admin-editable
-- content fields so it can serve as the reference implementation for the
-- non-diviner-specific catalog.

UPDATE service_templates
SET
  description = 'A complete natal chart consultation covering identity, timing patterns, life direction, relationship dynamics, career emphasis, and the deeper themes shaping your path.',
  long_description = 'The General Nativity Birth Chart service is a full-spectrum astrology reading designed for clients who want more than a surface-level personality overview. This session interprets the natal chart as a living map of temperament, motivations, talents, blind spots, relationship patterns, vocation, and long-term growth cycles. It is structured to help the client understand both who they are and how to work with the timing of their life more consciously. The reading can be used as a first foundational consultation, as a reset point during a major transition, or as a deep orientation session before exploring more specialized readings like returns, transits, or compatibility work.',
  base_price = 175.00,
  min_price = 175.00,
  max_price = 350.00,
  overage_rate = 0.50,
  duration_minutes = 90,
  is_primary = TRUE,
  requires_birth_data = TRUE,
  trigger_event = NULL,
  display_order = 1010,
  sort_order = 1010,
  icon_name = 'Sun',
  color = '#d97706',
  whats_included = ARRAY[
    'Full natal chart interpretation with emphasis on Sun, Moon, Ascendant, chart ruler, houses, and major aspects.',
    'Clear explanation of repeating life themes, core strengths, growth edges, and decision-making patterns.',
    'Focused guidance on relationships, purpose, career direction, and periods of change or pressure.',
    'Client-friendly synthesis that translates technical chart symbolism into practical language.',
    'Time for questions so the reading can be tailored to the client''s current priorities.'
  ]::text[],
  who_its_for = ARRAY[
    'Clients booking their first serious astrology reading and wanting a complete foundation.',
    'People navigating a major life transition such as career change, identity shift, relocation, or relationship crossroads.',
    'Clients who know their birth time and want a deeper understanding of their personal wiring and life timing.',
    'Anyone preparing for follow-up work in transits, returns, compatibility, or predictive astrology.'
  ]::text[],
  faq = '[
    {
      "question": "What birth details are needed for this reading?",
      "answer": "This service works best with birth date, exact birth time, and birthplace. Accurate birth time improves house placement, rising sign, and timing precision."
    },
    {
      "question": "Is this suitable for a first-time astrology client?",
      "answer": "Yes. This is the best entry-point reading because it establishes the core chart framework that later transit, return, and compatibility readings build on."
    },
    {
      "question": "What topics can be covered during the session?",
      "answer": "The reading can address personality structure, emotional needs, vocation, relationships, recurring patterns, life transitions, and major growth periods. The astrologer can adjust emphasis based on the client''s questions."
    },
    {
      "question": "Will I receive predictions in this reading?",
      "answer": "The main focus is the natal blueprint, but timing themes and developmental periods can be discussed when they are clearly relevant to the chart."
    }
  ]'::jsonb,
  seo_title = 'General Nativity Birth Chart Reading | Complete Natal Astrology Overview',
  seo_description = 'Book a complete nativity birth chart reading with a full overview of personality, life path, relationships, vocation, and major themes in your natal chart.',
  updated_at = now()
WHERE slug = 'general-nativity-birth-chart';
