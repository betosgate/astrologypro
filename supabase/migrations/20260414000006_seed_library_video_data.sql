-- ============================================================================
-- Seed library & video data for the test diviner
-- Idempotent — safe to run multiple times.
-- ============================================================================

DO $$
DECLARE
  v_diviner_id      UUID;
  v_diviner_user_id UUID;
  v_booking_id      UUID;
BEGIN

  -- Resolve Cosmic Aura (test diviner). Fall back to first active diviner.
  SELECT id, user_id INTO v_diviner_id, v_diviner_user_id
    FROM diviners
   WHERE is_active = TRUE
     AND display_name = 'Cosmic Aura'
   LIMIT 1;

  IF v_diviner_id IS NULL THEN
    SELECT id, user_id INTO v_diviner_id, v_diviner_user_id
      FROM diviners
     WHERE is_active = TRUE
     ORDER BY created_at ASC
     LIMIT 1;
  END IF;

  IF v_diviner_id IS NULL THEN
    RAISE NOTICE 'No active diviner found — skipping.';
    RETURN;
  END IF;

  -- =========================================================================
  -- 1. Backfill diviner_id on seeded tarot_readings
  --    (rows inserted in seed_session_data without diviner_id)
  -- =========================================================================
  UPDATE tarot_readings
     SET diviner_id = v_diviner_id
   WHERE id IN (
     'a3000000-0000-0000-0000-000000000001',
     'a3000000-0000-0000-0000-000000000002',
     'a3000000-0000-0000-0000-000000000003',
     'a3000000-0000-0000-0000-000000000004',
     'a3000000-0000-0000-0000-000000000005'
   )
     AND diviner_id IS NULL;

  -- =========================================================================
  -- 2. Backfill diviner_id on seeded birth_chart_results
  -- =========================================================================
  UPDATE birth_chart_results
     SET diviner_id = v_diviner_id
   WHERE id IN (
     'a4000000-0000-0000-0000-000000000001',
     'a4000000-0000-0000-0000-000000000002',
     'a4000000-0000-0000-0000-000000000003',
     'a4000000-0000-0000-0000-000000000004',
     'a4000000-0000-0000-0000-000000000005'
   )
     AND diviner_id IS NULL;

  -- =========================================================================
  -- 3. Seed astro_toolkit_readings (5 readings for the test diviner)
  -- =========================================================================
  INSERT INTO astro_toolkit_readings (id, user_id, diviner_id, reading_type, input_data, result_data, created_at)
  VALUES
    ('a5000000-0000-0000-0000-000000000001',
     v_diviner_user_id, v_diviner_id,
     'natal_chart',
     '{"name": "Sarah Moon", "birth_date": "1990-03-15", "birth_time": "14:30", "birth_place": "New York, NY"}'::jsonb,
     '{"sun_sign": "Pisces", "moon_sign": "Cancer", "rising": "Leo", "dominant_element": "Water", "chart_ruler": "Neptune"}'::jsonb,
     NOW() - INTERVAL '80 days'),

    ('a5000000-0000-0000-0000-000000000002',
     v_diviner_user_id, v_diviner_id,
     'solar_return',
     '{"name": "James Star", "birth_year": 1985, "return_year": 2025, "location": "Los Angeles, CA"}'::jsonb,
     '{"theme": "Career expansion", "key_transits": ["Jupiter conjunct Sun", "Saturn trine Moon"], "overview": "A year of professional growth and recognition."}'::jsonb,
     NOW() - INTERVAL '60 days'),

    ('a5000000-0000-0000-0000-000000000003',
     v_diviner_user_id, v_diviner_id,
     'transit',
     '{"name": "Emma Light", "birth_date": "1992-11-08", "transit_date": "2026-04-01"}'::jsonb,
     '{"active_transits": ["Pluto square Natal Sun", "Jupiter sextile Venus"], "energy_forecast": "Transformation is accelerating. Financial gains are highlighted."}'::jsonb,
     NOW() - INTERVAL '30 days'),

    ('a5000000-0000-0000-0000-000000000004',
     v_diviner_user_id, v_diviner_id,
     'saturn_return',
     '{"name": "David Cosmos", "birth_date": "1997-01-22", "return_window": "2026-2028"}'::jsonb,
     '{"phase": "First Saturn Return", "themes": ["Identity", "Responsibility", "Life structure"], "advice": "Ground your ambitions. The universe is asking you to build something lasting."}'::jsonb,
     NOW() - INTERVAL '14 days'),

    ('a5000000-0000-0000-0000-000000000005',
     v_diviner_user_id, v_diviner_id,
     'horoscope',
     '{"sign": "Scorpio", "period": "April 2026"}'::jsonb,
     '{"love": "Deep connection awaits.", "career": "Leadership opportunity emerging.", "health": "Rest and rejuvenate.", "lucky_days": ["5th", "14th", "23rd"]}'::jsonb,
     NOW() - INTERVAL '5 days')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 4. Update 3 completed bookings to have recording_url + session_notes
  --    (picks the first 3 completed bookings for this diviner)
  -- =========================================================================
  FOR v_booking_id IN
    SELECT id FROM bookings
     WHERE diviner_id = v_diviner_id
       AND status = 'completed'
       AND recording_url IS NULL
     ORDER BY scheduled_at DESC
     LIMIT 3
  LOOP
    UPDATE bookings
       SET recording_url          = 'https://recordings.example.com/session-' || LEFT(v_booking_id::text, 8) || '.mp4',
           recording_share_id     = 'share-' || LEFT(v_booking_id::text, 8),
           actual_duration_minutes = 45 + FLOOR(RANDOM() * 30)::int,
           session_notes          = 'Session went well. Client was engaged and receptive. Follow-up scheduled.'
     WHERE id = v_booking_id
       AND recording_url IS NULL;
  END LOOP;

  RAISE NOTICE 'Library seed applied for diviner %', v_diviner_id;

END $$;
