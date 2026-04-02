INSERT INTO service_templates (category, name, slug, description, duration_minutes, base_price, is_primary, requires_birth_data, trigger_event, sort_order) VALUES
-- Astrology
('astrology', 'Natal Chart Reading', 'natal-chart', 'A comprehensive reading of your birth chart revealing your personality, strengths, challenges, and life purpose.', 60, 100.00, TRUE, TRUE, NULL, 1),
('astrology', 'Solar Return Reading', 'solar-return', 'Your yearly forecast based on the Sun returning to its natal position. Reveals themes for your upcoming birthday year.', 60, 100.00, FALSE, TRUE, 'solar_return', 2),
('astrology', 'Monthly Transit Reading', 'monthly-transit', 'Monthly overview including lunar return analysis. Understand the energies and opportunities of the coming month.', 30, 50.00, TRUE, TRUE, NULL, 3),
('astrology', 'Saturn Return Reading', 'saturn-return', 'Navigate this pivotal life passage (ages ~29, 58). Understand the lessons and transformations ahead.', 60, 100.00, FALSE, TRUE, 'saturn_return', 4),
('astrology', 'Jupiter Return Reading', 'jupiter-return', 'Harness the expansion and growth of your Jupiter return cycle for maximum opportunity.', 60, 100.00, FALSE, TRUE, 'jupiter_return', 5),
('astrology', 'Weekly Transit Reading', 'weekly-transits', 'Detailed weekly forecast with daily highlights. Perfect for staying aligned with cosmic energies.', 30, 50.00, TRUE, TRUE, NULL, 6),
('astrology', 'Romantic Relationship Reading', 'romantic-relationships', 'Synastry and composite chart analysis for romantic partners. Understand your connection deeply.', 60, 100.00, TRUE, TRUE, NULL, 7),
('astrology', 'Friendship Compatibility Reading', 'friendship-relationships', 'Explore the astrological dynamics of your friendship. Strengthen understanding and connection.', 60, 100.00, TRUE, TRUE, NULL, 8),
('astrology', 'Business Relationship Reading', 'business-relationships', 'Partnership synastry for business. Identify strengths, challenges, and optimal collaboration strategies.', 60, 100.00, TRUE, TRUE, NULL, 9),
('astrology', 'Horary (Predictive Event) Reading', 'horary', 'Answer a specific question using the chart of the moment. Will I get the job? Should I move?', 30, 50.00, TRUE, FALSE, NULL, 10),
('astrology', 'Freelance Astrology Reading', 'astrology-freelance', 'Open-format astrology session. Discuss any topic or combination of techniques.', 30, 50.00, TRUE, TRUE, NULL, 11),
-- Tarot
('tarot', '3-Card Basic Spread', '3-card-basic', 'Past, Present, Future — a quick and focused reading for simple questions.', 30, 50.00, TRUE, FALSE, NULL, 12),
('tarot', '5-Card Complex Spread', '5-card-complex', 'A deeper dive into complex questions with multiple influencing factors.', 30, 50.00, TRUE, FALSE, NULL, 13),
('tarot', '7-Card 6-Month Forecast', '7-card-forecast', 'Six months ahead — one card per month plus a theme card. Plan your future.', 30, 50.00, TRUE, FALSE, NULL, 14),
('tarot', '7-Card Horseshoe Spread', '7-card-horseshoe', 'A major reading covering past influences, present situation, and future possibilities.', 60, 100.00, TRUE, FALSE, NULL, 15),
('tarot', '10-Card Relationship Spread', '10-card-relationship', 'In-depth relationship analysis covering both partners perspectives and the relationship itself.', 60, 100.00, TRUE, FALSE, NULL, 16),
('tarot', '10-Card Celtic Cross', '10-card-celtic-cross', 'The classic comprehensive tarot reading. Covers all aspects of your question in depth.', 60, 100.00, TRUE, FALSE, NULL, 17),
('tarot', '12-Card Astrological Spread', '12-card-astrological', 'One card per astrological house. A complete life reading covering all areas.', 60, 100.00, TRUE, FALSE, NULL, 18),
('tarot', 'Freelance Tarot Reading', 'tarot-freelance', 'Open-format tarot session. Any spread, any topic, tailored to your needs.', 30, 50.00, TRUE, FALSE, NULL, 19);
