-- Reseed service_templates with the canonical catalog names
-- (astrology package from nativity-to-uranus-opposition + tarot toolkit).
-- Uses DELETE + INSERT instead of TRUNCATE to respect FK constraints on
-- diviner_services — existing diviner_services rows that reference removed
-- templates will be cascade-deleted via the ON DELETE CASCADE FK.

-- Remove all existing templates so we start clean.
DELETE FROM service_templates;

-- ── Astrology ──────────────────────────────────────────────────────────────

INSERT INTO service_templates
  (category, name, slug, description, duration_minutes, base_price, overage_rate, is_primary, requires_birth_data, trigger_event, sort_order)
VALUES
  (
    'astrology',
    'Nativity Birth Chart',
    'nativity-birth-chart',
    'A comprehensive analysis of the natal chart, covering personality, life path, key planetary placements, houses, and aspects.',
    90, 175.00, 0.50, TRUE, TRUE, NULL, 10
  ),
  (
    'astrology',
    'Solar Return',
    'solar-return',
    'Annual forecast reading based on the solar return chart — themes, opportunities, and challenges for the coming year.',
    60, 125.00, 0.50, FALSE, TRUE, 'solar_return', 20
  ),
  (
    'astrology',
    'Weekly Transits',
    'weekly-transits',
    'Personalized transit forecast covering the current week''s planetary movements and how they activate the natal chart.',
    30, 65.00, 0.50, TRUE, TRUE, NULL, 30
  ),
  (
    'astrology',
    'Monthly Transits + Lunar Return',
    'monthly-transits-lunar-return',
    'Monthly overview combining current transits with the lunar return chart for emotional and practical themes.',
    45, 95.00, 0.50, TRUE, TRUE, NULL, 40
  ),
  (
    'astrology',
    'Romantic Relationships',
    'romantic-relationships',
    'Synastry and composite chart analysis for romantic compatibility, communication styles, and relationship dynamics.',
    60, 125.00, 0.50, TRUE, TRUE, NULL, 50
  ),
  (
    'astrology',
    'Friendship Relationships',
    'friendship-relationships',
    'Compatibility analysis for friendships — shared values, communication patterns, and long-term potential.',
    60, 125.00, 0.50, TRUE, TRUE, NULL, 60
  ),
  (
    'astrology',
    'Business Relationship',
    'business-relationship',
    'Astrological compatibility for business partnerships — strengths, blind spots, and timing considerations.',
    60, 125.00, 0.50, TRUE, TRUE, NULL, 70
  ),
  (
    'astrology',
    'Predictive Event (Horary)',
    'predictive-event-horary',
    'Horary astrology reading for a specific question or event — answer sought from the chart cast at the time of the question.',
    45, 95.00, 0.50, TRUE, FALSE, NULL, 80
  ),
  (
    'astrology',
    'Jupiter Return',
    'jupiter-return',
    'Reading focused on the Jupiter return cycle — expansion, opportunity, and growth themes for the next 12-year chapter.',
    45, 95.00, 0.50, FALSE, TRUE, 'jupiter_return', 90
  ),
  (
    'astrology',
    'Saturn Return',
    'saturn-return',
    'Deep dive into the Saturn return — major life restructuring, responsibility shifts, and long-term foundation building.',
    60, 125.00, 0.50, FALSE, TRUE, 'saturn_return', 100
  ),
  (
    'astrology',
    'Mars Return',
    'mars-return',
    'Annual Mars return forecast covering drive, ambition, conflict patterns, and action themes for the coming year.',
    45, 95.00, 0.50, FALSE, TRUE, NULL, 110
  ),
  (
    'astrology',
    'Uranus Opposition',
    'uranus-opposition',
    'Mid-life Uranus opposition reading — awakening, rebellion, liberation themes and how to navigate the transition.',
    60, 125.00, 0.50, FALSE, TRUE, NULL, 120
  );

-- ── Tarot Toolkit ──────────────────────────────────────────────────────────

INSERT INTO service_templates
  (category, name, slug, description, duration_minutes, base_price, overage_rate, is_primary, requires_birth_data, trigger_event, sort_order)
VALUES
  (
    'tarot',
    '3 Card Basic Question Spread',
    '3-card-basic-question-spread',
    'Quick focused reading using a 3-card spread — past, present, and future or situation, action, outcome.',
    20, 35.00, 0.50, TRUE, FALSE, NULL, 130
  ),
  (
    'tarot',
    '5 Card Complex Question Spread',
    '5-card-complex-question-spread',
    'In-depth reading for complex questions using a 5-card spread covering context, influences, challenge, advice, and outcome.',
    30, 55.00, 0.50, TRUE, FALSE, NULL, 140
  ),
  (
    'tarot',
    '7 Card 6 Month Forward Review',
    '7-card-6-month-forward-review',
    'Six-month forecast spread covering monthly energy themes and an overall guidance card for the period ahead.',
    45, 75.00, 0.50, TRUE, FALSE, NULL, 150
  ),
  (
    'tarot',
    '7 Card Horseshoe Spread (Major Read)',
    '7-card-horseshoe-spread-major-read',
    'Classic horseshoe spread covering past, present, hidden influences, obstacles, external influences, advice, and outcome.',
    45, 75.00, 0.50, TRUE, FALSE, NULL, 160
  ),
  (
    'tarot',
    '10 Card Relationship Spread',
    '10-card-relationship-spread',
    'Comprehensive relationship reading covering both parties'' feelings, connection dynamics, challenges, and future potential.',
    60, 95.00, 0.50, TRUE, FALSE, NULL, 170
  ),
  (
    'tarot',
    '10 Card Celtic Cross (Major Read)',
    '10-card-celtic-cross-major-read',
    'The classic Celtic Cross — a thorough 10-card reading covering the full spectrum of a situation with deep insight.',
    60, 95.00, 0.50, TRUE, FALSE, NULL, 180
  ),
  (
    'tarot',
    '12 Card Astrological Spread (Major Read)',
    '12-card-astrological-spread-major-read',
    'Twelve-card spread mapped to the astrological houses — a holistic yearly overview covering all life areas.',
    75, 125.00, 0.50, TRUE, TRUE, NULL, 190
  );
