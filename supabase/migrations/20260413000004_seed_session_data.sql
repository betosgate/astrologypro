-- ============================================================================
-- Seed realistic test data for all session-era features
-- Idempotent: uses ON CONFLICT DO NOTHING and existence checks throughout.
-- ============================================================================

DO $$
DECLARE
  v_diviner_id       UUID;
  v_diviner_user_id  UUID;
  v_client1_id       UUID;
  v_client2_id       UUID;
  v_client3_id       UUID;
  v_client4_id       UUID;
  v_client5_id       UUID;
  v_user1_id         UUID := 'aa000000-0000-4000-a000-000000000001';
  v_user2_id         UUID := 'aa000000-0000-4000-a000-000000000002';
  v_user3_id         UUID := 'aa000000-0000-4000-a000-000000000003';
  v_user4_id         UUID := 'aa000000-0000-4000-a000-000000000004';
  v_user5_id         UUID := 'aa000000-0000-4000-a000-000000000005';
  v_service_astro_id UUID;
  v_service_tarot_id UUID;
  v_service_phone_id UUID;
  v_booking_ids      UUID[];
  v_aff1_id          UUID;
  v_aff2_id          UUID;
  v_aff3_id          UUID;
  v_link1_id         UUID;
  v_link2_id         UUID;
  v_link3_id         UUID;
BEGIN

  -- =========================================================================
  -- 1. Resolve existing diviner (skip if none exists)
  -- =========================================================================
  SELECT id, user_id INTO v_diviner_id, v_diviner_user_id
    FROM diviners
   WHERE is_active = TRUE
   ORDER BY created_at ASC
   LIMIT 1;

  IF v_diviner_id IS NULL THEN
    RAISE NOTICE 'No active diviner found — skipping FK-dependent seeds.';
    RETURN;
  END IF;

  -- =========================================================================
  -- 2a. Seed auth.users for test clients (required FK for clients table)
  -- =========================================================================
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
  VALUES
    (v_user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'seedclient1@test.com', extensions.crypt('SeedPass1!', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (v_user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'seedclient2@test.com', extensions.crypt('SeedPass2!', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (v_user3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'seedclient3@test.com', extensions.crypt('SeedPass3!', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (v_user4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'seedclient4@test.com', extensions.crypt('SeedPass4!', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),
    (v_user5_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'seedclient5@test.com', extensions.crypt('SeedPass5!', extensions.gen_salt('bf')),
     NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Also create auth.identities for each user (required by Supabase GoTrue)
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES
    (v_user1_id, v_user1_id, v_user1_id::text, 'email', jsonb_build_object('sub', v_user1_id::text, 'email', 'seedclient1@test.com'), NOW(), NOW(), NOW()),
    (v_user2_id, v_user2_id, v_user2_id::text, 'email', jsonb_build_object('sub', v_user2_id::text, 'email', 'seedclient2@test.com'), NOW(), NOW(), NOW()),
    (v_user3_id, v_user3_id, v_user3_id::text, 'email', jsonb_build_object('sub', v_user3_id::text, 'email', 'seedclient3@test.com'), NOW(), NOW(), NOW()),
    (v_user4_id, v_user4_id, v_user4_id::text, 'email', jsonb_build_object('sub', v_user4_id::text, 'email', 'seedclient4@test.com'), NOW(), NOW(), NOW()),
    (v_user5_id, v_user5_id, v_user5_id::text, 'email', jsonb_build_object('sub', v_user5_id::text, 'email', 'seedclient5@test.com'), NOW(), NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- 2b. Test Clients (5 clients with birth data)
  -- =========================================================================
  INSERT INTO clients (id, user_id, email, full_name, birth_date, birth_time, birth_city, phone)
  VALUES
    ('a0000000-0000-0000-0000-000000000001', v_user1_id, 'seedclient1@test.com', 'Sarah Moon',    '1990-03-15', '14:30', 'New York, NY',     '(555) 100-0001'),
    ('a0000000-0000-0000-0000-000000000002', v_user2_id, 'seedclient2@test.com', 'James Star',    '1985-07-22', '09:15', 'Los Angeles, CA',   '(555) 100-0002'),
    ('a0000000-0000-0000-0000-000000000003', v_user3_id, 'seedclient3@test.com', 'Emma Light',    '1992-11-08', '22:00', 'Chicago, IL',       '(555) 100-0003'),
    ('a0000000-0000-0000-0000-000000000004', v_user4_id, 'seedclient4@test.com', 'David Cosmos',  '1988-01-30', '06:45', 'Houston, TX',       '(555) 100-0004'),
    ('a0000000-0000-0000-0000-000000000005', v_user5_id, 'seedclient5@test.com', 'Lily Neptune',  '1995-09-12', '18:20', 'Miami, FL',         '(555) 100-0005')
  ON CONFLICT (id) DO NOTHING;

  v_client1_id := 'a0000000-0000-0000-0000-000000000001';
  v_client2_id := 'a0000000-0000-0000-0000-000000000002';
  v_client3_id := 'a0000000-0000-0000-0000-000000000003';
  v_client4_id := 'a0000000-0000-0000-0000-000000000004';
  v_client5_id := 'a0000000-0000-0000-0000-000000000005';

  -- =========================================================================
  -- 3. Resolve or seed services for the diviner
  -- =========================================================================
  SELECT id INTO v_service_astro_id
    FROM services
   WHERE diviner_id = v_diviner_id AND category = 'astrology'
   ORDER BY sort_order ASC LIMIT 1;

  IF v_service_astro_id IS NULL THEN
    INSERT INTO services (id, diviner_id, category, name, slug, description, duration_minutes, base_price, overage_rate, is_primary, sort_order)
    VALUES ('b0000000-0000-0000-0000-000000000001', v_diviner_id, 'astrology', 'Birth Chart Reading', 'birth-chart-reading',
            'Full natal chart interpretation.', 60, 120.00, 0.50, TRUE, 1)
    ON CONFLICT (id) DO NOTHING;
    v_service_astro_id := 'b0000000-0000-0000-0000-000000000001';
  END IF;

  SELECT id INTO v_service_tarot_id
    FROM services
   WHERE diviner_id = v_diviner_id AND category = 'tarot'
   ORDER BY sort_order ASC LIMIT 1;

  IF v_service_tarot_id IS NULL THEN
    INSERT INTO services (id, diviner_id, category, name, slug, description, duration_minutes, base_price, overage_rate, is_primary, sort_order)
    VALUES ('b0000000-0000-0000-0000-000000000002', v_diviner_id, 'tarot', 'Celtic Cross Tarot', 'celtic-cross-tarot',
            'Classic 10-card Celtic Cross spread.', 45, 85.00, 0.50, TRUE, 2)
    ON CONFLICT (id) DO NOTHING;
    v_service_tarot_id := 'b0000000-0000-0000-0000-000000000002';
  END IF;

  -- =========================================================================
  -- 4. Bookings (15 across various statuses and last 90 days)
  -- =========================================================================
  INSERT INTO bookings (id, diviner_id, client_id, service_id, status, scheduled_at,
    duration_minutes, base_price, total_amount, actual_duration_minutes,
    recording_url, canceled_at, cancellation_reason,
    no_show_type, no_show_processed_at,
    diviner_joined_at, client_joined_at, created_at)
  VALUES
    -- Completed bookings (with actual_duration, total)
    ('c0000000-0000-0000-0000-000000000001', v_diviner_id, v_client1_id, v_service_astro_id,
     'completed', NOW() - INTERVAL '85 days', 60, 120.00, 135.00, 65,
     'https://recordings.example.com/session-001.mp4', NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '85 days' + INTERVAL '1 minute', NOW() - INTERVAL '85 days' + INTERVAL '3 minutes',
     NOW() - INTERVAL '86 days'),

    ('c0000000-0000-0000-0000-000000000002', v_diviner_id, v_client2_id, v_service_tarot_id,
     'completed', NOW() - INTERVAL '72 days', 45, 85.00, 85.00, 42,
     'https://recordings.example.com/session-002.mp4', NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '72 days' + INTERVAL '2 minutes', NOW() - INTERVAL '72 days' + INTERVAL '1 minute',
     NOW() - INTERVAL '73 days'),

    ('c0000000-0000-0000-0000-000000000003', v_diviner_id, v_client3_id, v_service_astro_id,
     'completed', NOW() - INTERVAL '60 days', 60, 120.00, 150.00, 70,
     NULL, NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '5 minutes',
     NOW() - INTERVAL '61 days'),

    ('c0000000-0000-0000-0000-000000000004', v_diviner_id, v_client4_id, v_service_tarot_id,
     'completed', NOW() - INTERVAL '45 days', 45, 85.00, 95.00, 50,
     'https://recordings.example.com/session-004.mp4', NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '45 days' + INTERVAL '1 minute', NOW() - INTERVAL '45 days',
     NOW() - INTERVAL '46 days'),

    ('c0000000-0000-0000-0000-000000000005', v_diviner_id, v_client5_id, v_service_astro_id,
     'completed', NOW() - INTERVAL '30 days', 60, 120.00, 120.00, 58,
     NULL, NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '2 minutes',
     NOW() - INTERVAL '31 days'),

    ('c0000000-0000-0000-0000-000000000006', v_diviner_id, v_client1_id, v_service_tarot_id,
     'completed', NOW() - INTERVAL '20 days', 45, 85.00, 85.00, 44,
     'https://recordings.example.com/session-006.mp4', NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '1 minute',
     NOW() - INTERVAL '21 days'),

    -- Confirmed bookings (upcoming)
    ('c0000000-0000-0000-0000-000000000007', v_diviner_id, v_client2_id, v_service_astro_id,
     'confirmed', NOW() + INTERVAL '2 days', 60, 120.00, NULL, NULL,
     NULL, NULL, NULL, NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '5 days'),

    ('c0000000-0000-0000-0000-000000000008', v_diviner_id, v_client3_id, v_service_tarot_id,
     'confirmed', NOW() + INTERVAL '5 days', 45, 85.00, NULL, NULL,
     NULL, NULL, NULL, NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '3 days'),

    ('c0000000-0000-0000-0000-000000000009', v_diviner_id, v_client5_id, v_service_astro_id,
     'confirmed', NOW() + INTERVAL '7 days', 60, 120.00, NULL, NULL,
     NULL, NULL, NULL, NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '1 day'),

    -- Canceled bookings
    ('c0000000-0000-0000-0000-000000000010', v_diviner_id, v_client4_id, v_service_astro_id,
     'canceled', NOW() - INTERVAL '40 days', 60, 120.00, NULL, NULL,
     NULL, NOW() - INTERVAL '42 days', 'Schedule conflict — client requested reschedule.',
     NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '50 days'),

    ('c0000000-0000-0000-0000-000000000011', v_diviner_id, v_client1_id, v_service_tarot_id,
     'canceled', NOW() - INTERVAL '15 days', 45, 85.00, NULL, NULL,
     NULL, NOW() - INTERVAL '16 days', 'Personal emergency.',
     NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '25 days'),

    -- No-show bookings
    ('c0000000-0000-0000-0000-000000000012', v_diviner_id, v_client3_id, v_service_tarot_id,
     'no_show', NOW() - INTERVAL '55 days', 45, 85.00, 42.50, NULL,
     NULL, NULL, NULL, 'client', NOW() - INTERVAL '55 days' + INTERVAL '15 minutes',
     NOW() - INTERVAL '55 days' + INTERVAL '1 minute', NULL,
     NOW() - INTERVAL '56 days'),

    ('c0000000-0000-0000-0000-000000000013', v_diviner_id, v_client5_id, v_service_astro_id,
     'no_show', NOW() - INTERVAL '25 days', 60, 120.00, 120.00, NULL,
     NULL, NULL, NULL, 'diviner', NOW() - INTERVAL '25 days' + INTERVAL '12 minutes',
     NULL, NOW() - INTERVAL '25 days' + INTERVAL '2 minutes',
     NOW() - INTERVAL '26 days'),

    -- Pending booking
    ('c0000000-0000-0000-0000-000000000014', v_diviner_id, v_client2_id, v_service_tarot_id,
     'pending', NOW() + INTERVAL '10 days', 45, 85.00, NULL, NULL,
     NULL, NULL, NULL, NULL, NULL, NULL, NULL,
     NOW()),

    -- In-progress booking (today)
    ('c0000000-0000-0000-0000-000000000015', v_diviner_id, v_client4_id, v_service_astro_id,
     'in_progress', NOW() - INTERVAL '30 minutes', 60, 120.00, NULL, NULL,
     NULL, NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '28 minutes',
     NOW() - INTERVAL '2 days')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 5. Phone Sessions (5 sessions)
  -- =========================================================================
  INSERT INTO phone_sessions (id, booking_id, diviner_id, client_id, caller_phone,
    session_type, phone_provider, started_at, ended_at, duration_seconds,
    platform_cost, amount_charged, status, created_at)
  VALUES
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
     v_diviner_id, v_client1_id, '(555) 100-0001', 'scheduled_dialin', 'twilio',
     NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days' + INTERVAL '65 minutes',
     3900, 1.85, 135.00, 'completed', NOW() - INTERVAL '85 days'),

    ('d0000000-0000-0000-0000-000000000002', NULL,
     v_diviner_id, v_client2_id, '(555) 100-0002', 'standalone', 'twilio',
     NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days' + INTERVAL '32 minutes',
     1920, 1.15, 50.00, 'completed', NOW() - INTERVAL '50 days'),

    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004',
     v_diviner_id, v_client4_id, '(555) 100-0004', 'scheduled_dialin', 'chime',
     NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days' + INTERVAL '50 minutes',
     3000, 0.90, 95.00, 'completed', NOW() - INTERVAL '45 days'),

    ('d0000000-0000-0000-0000-000000000004', NULL,
     v_diviner_id, v_client3_id, '(555) 100-0003', 'standalone', 'chime',
     NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '28 minutes',
     1680, 0.72, 45.00, 'completed', NOW() - INTERVAL '18 days'),

    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005',
     v_diviner_id, v_client5_id, '(555) 100-0005', 'scheduled_dialin', 'twilio',
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '58 minutes',
     3480, 1.65, 120.00, 'completed', NOW() - INTERVAL '30 days')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 6. Video Sessions (5 sessions)
  -- =========================================================================
  INSERT INTO video_sessions (id, booking_id, diviner_id, client_id,
    room_id, room_name, provider, status,
    started_at, ended_at, duration_seconds, recording_url, created_at)
  VALUES
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
     v_diviner_id, v_client2_id,
     'seed-room-001', 'Tarot-JamesStar-001', 'daily', 'ended',
     NOW() - INTERVAL '72 days', NOW() - INTERVAL '72 days' + INTERVAL '42 minutes',
     2520, 'https://recordings.example.com/video-001.mp4',
     NOW() - INTERVAL '72 days'),

    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003',
     v_diviner_id, v_client3_id,
     'seed-room-002', 'Astro-EmmaLight-002', 'chime', 'ended',
     NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '70 minutes',
     4200, NULL,
     NOW() - INTERVAL '60 days'),

    ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006',
     v_diviner_id, v_client1_id,
     'seed-room-003', 'Tarot-SarahMoon-003', 'daily', 'ended',
     NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '44 minutes',
     2640, 'https://recordings.example.com/video-003.mp4',
     NOW() - INTERVAL '20 days'),

    ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007',
     v_diviner_id, v_client2_id,
     'seed-room-004', 'Astro-JamesStar-004', 'chime', 'created',
     NULL, NULL, NULL, NULL,
     NOW() - INTERVAL '5 days'),

    ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000015',
     v_diviner_id, v_client4_id,
     'seed-room-005', 'Astro-DavidCosmos-005', 'daily', 'live',
     NOW() - INTERVAL '30 minutes', NULL, NULL, NULL,
     NOW() - INTERVAL '2 days')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 7. Social Advocates (old affiliates table — 3 advocates)
  -- =========================================================================
  INSERT INTO affiliates (id, diviner_id, name, email, phone, referral_code,
    commission_percent, total_referrals, total_earned, total_paid, is_active, created_at)
  VALUES
    ('f0000000-0000-0000-0000-000000000001', v_diviner_id,
     'Maria Advocate', 'maria.advocate@test.com', '(555) 200-0001',
     'MARIA2026', 15.00, 12, 540.00, 300.00, TRUE, NOW() - INTERVAL '80 days'),
    ('f0000000-0000-0000-0000-000000000002', v_diviner_id,
     'Carlos Promoter', 'carlos.promoter@test.com', '(555) 200-0002',
     'CARLOS2026', 10.00, 8, 320.00, 200.00, TRUE, NOW() - INTERVAL '60 days'),
    ('f0000000-0000-0000-0000-000000000003', v_diviner_id,
     'Priya Referrer', 'priya.referrer@test.com', '(555) 200-0003',
     'PRIYA2026', 12.00, 5, 180.00, 100.00, TRUE, NOW() - INTERVAL '45 days')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 8. Affiliate Referrals (linked to advocates and bookings)
  -- =========================================================================
  INSERT INTO affiliate_referrals (id, affiliate_id, client_id, booking_id,
    commission_amount, status, paid_at, created_at)
  VALUES
    (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000001', v_client1_id,
     'c0000000-0000-0000-0000-000000000001', 20.25, 'paid',
     NOW() - INTERVAL '80 days', NOW() - INTERVAL '85 days'),
    (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000001', v_client2_id,
     'c0000000-0000-0000-0000-000000000002', 12.75, 'paid',
     NOW() - INTERVAL '65 days', NOW() - INTERVAL '72 days'),
    (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000001', v_client3_id,
     'c0000000-0000-0000-0000-000000000003', 22.50, 'earned',
     NULL, NOW() - INTERVAL '60 days'),
    (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000002', v_client4_id,
     'c0000000-0000-0000-0000-000000000004', 9.50, 'paid',
     NOW() - INTERVAL '40 days', NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000002', v_client5_id,
     'c0000000-0000-0000-0000-000000000005', 12.00, 'earned',
     NULL, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000003', v_client1_id,
     'c0000000-0000-0000-0000-000000000006', 10.20, 'pending',
     NULL, NOW() - INTERVAL '20 days'),
    (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000002', v_client3_id,
     NULL, 8.50, 'pending',
     NULL, NOW() - INTERVAL '10 days'),
    (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000003', v_client4_id,
     NULL, 14.40, 'earned',
     NULL, NOW() - INTERVAL '5 days')
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- 9. Diviner Affiliates (new commission-based affiliates — 3 per diviner)
  -- =========================================================================
  INSERT INTO diviner_affiliates (id, diviner_id, name, email, phone, status,
    default_commission_type, default_commission_value, created_at)
  VALUES
    ('a1000000-0000-0000-0000-000000000001', v_diviner_id,
     'Alex Partner', 'alex.partner@test.com', '(555) 300-0001',
     'active', 'percentage', 15.0000, NOW() - INTERVAL '70 days'),
    ('a1000000-0000-0000-0000-000000000002', v_diviner_id,
     'Jordan Affiliate', 'jordan.affiliate@test.com', '(555) 300-0002',
     'active', 'percentage', 10.0000, NOW() - INTERVAL '50 days'),
    ('a1000000-0000-0000-0000-000000000003', v_diviner_id,
     'Sam Referrer', 'sam.referrer@test.com', '(555) 300-0003',
     'pending', 'fixed', 500.0000, NOW() - INTERVAL '10 days')
  ON CONFLICT (id) DO NOTHING;

  v_aff1_id := 'a1000000-0000-0000-0000-000000000001';
  v_aff2_id := 'a1000000-0000-0000-0000-000000000002';
  v_aff3_id := 'a1000000-0000-0000-0000-000000000003';

  -- =========================================================================
  -- 10. Affiliate Referral Links (5 links)
  -- =========================================================================
  INSERT INTO affiliate_referral_links (id, affiliate_id, diviner_id, slug,
    clicks, conversions, is_active, created_at)
  VALUES
    ('a2000000-0000-0000-0000-000000000001', v_aff1_id, v_diviner_id,
     'seed-alex-general', 245, 18, TRUE, NOW() - INTERVAL '70 days'),
    ('a2000000-0000-0000-0000-000000000002', v_aff1_id, v_diviner_id,
     'seed-alex-astro', 132, 9, TRUE, NOW() - INTERVAL '65 days'),
    ('a2000000-0000-0000-0000-000000000003', v_aff2_id, v_diviner_id,
     'seed-jordan-general', 189, 12, TRUE, NOW() - INTERVAL '50 days'),
    ('a2000000-0000-0000-0000-000000000004', v_aff2_id, v_diviner_id,
     'seed-jordan-tarot', 78, 5, TRUE, NOW() - INTERVAL '40 days'),
    ('a2000000-0000-0000-0000-000000000005', v_aff3_id, v_diviner_id,
     'seed-sam-general', 34, 0, TRUE, NOW() - INTERVAL '10 days')
  ON CONFLICT (id) DO NOTHING;

  v_link1_id := 'a2000000-0000-0000-0000-000000000001';
  v_link2_id := 'a2000000-0000-0000-0000-000000000003';
  v_link3_id := 'a2000000-0000-0000-0000-000000000005';

  -- =========================================================================
  -- 11. Affiliate Commissions (8 entries)
  -- =========================================================================
  INSERT INTO affiliate_commissions (id, affiliate_id, diviner_id, link_id,
    order_reference, order_amount_cents, commission_type, commission_rate,
    commission_amount_cents, status, approved_at, created_at)
  VALUES
    (gen_random_uuid(), v_aff1_id, v_diviner_id, v_link1_id,
     'pi_seed_001', 12000, 'percentage', 15.0000, 1800, 'paid',
     NOW() - INTERVAL '80 days', NOW() - INTERVAL '85 days'),
    (gen_random_uuid(), v_aff1_id, v_diviner_id, v_link1_id,
     'pi_seed_002', 8500, 'percentage', 15.0000, 1275, 'paid',
     NOW() - INTERVAL '65 days', NOW() - INTERVAL '70 days'),
    (gen_random_uuid(), v_aff1_id, v_diviner_id, v_link2_id,
     'pi_seed_003', 15000, 'percentage', 15.0000, 2250, 'approved',
     NOW() - INTERVAL '55 days', NOW() - INTERVAL '58 days'),
    (gen_random_uuid(), v_aff2_id, v_diviner_id, v_link2_id,
     'pi_seed_004', 9500, 'percentage', 10.0000, 950, 'approved',
     NOW() - INTERVAL '40 days', NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), v_aff2_id, v_diviner_id, v_link2_id,
     'pi_seed_005', 12000, 'percentage', 10.0000, 1200, 'pending',
     NULL, NOW() - INTERVAL '30 days'),
    (gen_random_uuid(), v_aff2_id, v_diviner_id, v_link2_id,
     'pi_seed_006', 8500, 'percentage', 10.0000, 850, 'pending',
     NULL, NOW() - INTERVAL '20 days'),
    (gen_random_uuid(), v_aff1_id, v_diviner_id, v_link1_id,
     'pi_seed_007', 12000, 'percentage', 15.0000, 1800, 'pending',
     NULL, NOW() - INTERVAL '10 days'),
    (gen_random_uuid(), v_aff1_id, v_diviner_id, v_link1_id,
     'pi_seed_008', 8500, 'percentage', 15.0000, 1275, 'rejected',
     NULL, NOW() - INTERVAL '5 days')
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- 12. Page Views (75 rows spread across last 30 days)
  -- =========================================================================
  INSERT INTO page_views (diviner_id, path, referrer, ip_hash, created_at)
  SELECT
    v_diviner_id,
    (ARRAY[
      '/' || (SELECT username FROM diviners WHERE id = v_diviner_id),
      '/get-started',
      '/discover',
      '/services',
      '/book',
      '/tarot',
      '/about'
    ])[1 + (gs % 7)],
    (ARRAY[
      'https://www.google.com',
      'https://www.instagram.com',
      'https://www.facebook.com',
      'https://www.tiktok.com',
      NULL
    ])[1 + (gs % 5)],
    md5('seed-visitor-' || gs::text),
    NOW() - (gs * INTERVAL '9.6 hours')
  FROM generate_series(1, 75) AS gs
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- 13. User Activity Log entries (15 events)
  -- =========================================================================
  INSERT INTO user_activity_log (id, user_id, event_category, event_type, metadata, created_at)
  VALUES
    (gen_random_uuid(), v_diviner_user_id, 'booking', 'booking.created',
     '{"booking_id": "c0000000-0000-0000-0000-000000000001", "client_name": "Sarah Moon"}'::jsonb,
     NOW() - INTERVAL '86 days'),
    (gen_random_uuid(), v_diviner_user_id, 'payment', 'payment.succeeded',
     '{"booking_id": "c0000000-0000-0000-0000-000000000001", "amount": 135.00}'::jsonb,
     NOW() - INTERVAL '85 days'),
    (gen_random_uuid(), v_diviner_user_id, 'booking', 'booking.created',
     '{"booking_id": "c0000000-0000-0000-0000-000000000002", "client_name": "James Star"}'::jsonb,
     NOW() - INTERVAL '73 days'),
    (gen_random_uuid(), v_diviner_user_id, 'payment', 'payment.succeeded',
     '{"booking_id": "c0000000-0000-0000-0000-000000000002", "amount": 85.00}'::jsonb,
     NOW() - INTERVAL '72 days'),
    (gen_random_uuid(), v_diviner_user_id, 'booking', 'booking.created',
     '{"booking_id": "c0000000-0000-0000-0000-000000000003", "client_name": "Emma Light"}'::jsonb,
     NOW() - INTERVAL '61 days'),
    (gen_random_uuid(), v_diviner_user_id, 'payment', 'payment.succeeded',
     '{"booking_id": "c0000000-0000-0000-0000-000000000003", "amount": 150.00}'::jsonb,
     NOW() - INTERVAL '60 days'),
    (gen_random_uuid(), v_diviner_user_id, 'booking', 'booking.canceled',
     '{"booking_id": "c0000000-0000-0000-0000-000000000010", "reason": "Schedule conflict"}'::jsonb,
     NOW() - INTERVAL '42 days'),
    (gen_random_uuid(), v_diviner_user_id, 'booking', 'booking.no_show',
     '{"booking_id": "c0000000-0000-0000-0000-000000000012", "no_show_type": "client"}'::jsonb,
     NOW() - INTERVAL '55 days'),
    (gen_random_uuid(), v_diviner_user_id, 'payment', 'payment.failed',
     '{"booking_id": "c0000000-0000-0000-0000-000000000014", "error": "card_declined"}'::jsonb,
     NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), v_diviner_user_id, 'reading', 'reading.tarot_completed',
     '{"spread": "Celtic Cross", "client_name": "Sarah Moon"}'::jsonb,
     NOW() - INTERVAL '20 days'),
    (gen_random_uuid(), v_diviner_user_id, 'profile', 'profile.updated',
     '{"fields": ["bio", "specialties"]}'::jsonb,
     NOW() - INTERVAL '15 days'),
    (gen_random_uuid(), v_diviner_user_id, 'auth', 'auth.login',
     '{"method": "email"}'::jsonb,
     NOW() - INTERVAL '10 days'),
    (gen_random_uuid(), v_diviner_user_id, 'booking', 'booking.created',
     '{"booking_id": "c0000000-0000-0000-0000-000000000007", "client_name": "James Star"}'::jsonb,
     NOW() - INTERVAL '5 days'),
    (gen_random_uuid(), v_diviner_user_id, 'booking', 'booking.confirmed',
     '{"booking_id": "c0000000-0000-0000-0000-000000000008", "client_name": "Emma Light"}'::jsonb,
     NOW() - INTERVAL '3 days'),
    (gen_random_uuid(), v_diviner_user_id, 'system', 'system.session_started',
     '{"booking_id": "c0000000-0000-0000-0000-000000000015", "provider": "daily"}'::jsonb,
     NOW() - INTERVAL '30 minutes')
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- 14. Tarot Readings (5 readings)
  -- =========================================================================
  INSERT INTO tarot_readings (id, user_id, spread_id, spread_name, cards, notes, created_at)
  VALUES
    ('a3000000-0000-0000-0000-000000000001', v_diviner_user_id,
     'celtic-cross', 'Celtic Cross',
     '[
       {"position": 1, "position_name": "Present", "card_name": "The Fool", "is_reversed": false, "keywords": ["beginnings","spontaneity"], "meaning": "A new journey awaits."},
       {"position": 2, "position_name": "Challenge", "card_name": "The Tower", "is_reversed": true, "keywords": ["upheaval","revelation"], "meaning": "Resistance to necessary change."},
       {"position": 3, "position_name": "Past", "card_name": "The Star", "is_reversed": false, "keywords": ["hope","inspiration"], "meaning": "Past hope guides present choices."}
     ]'::jsonb,
     'Client was receptive. Focus on new beginnings despite fears.',
     NOW() - INTERVAL '72 days'),

    ('a3000000-0000-0000-0000-000000000002', v_diviner_user_id,
     'three-card', 'Three Card Spread',
     '[
       {"position": 1, "position_name": "Past", "card_name": "Ten of Cups", "is_reversed": false, "keywords": ["fulfillment","family"], "meaning": "Strong family foundation."},
       {"position": 2, "position_name": "Present", "card_name": "Eight of Swords", "is_reversed": false, "keywords": ["restriction","self-imposed"], "meaning": "Feeling trapped by own thoughts."},
       {"position": 3, "position_name": "Future", "card_name": "The Sun", "is_reversed": false, "keywords": ["joy","success"], "meaning": "Bright future ahead."}
     ]'::jsonb,
     'Encouraged client to release limiting beliefs.',
     NOW() - INTERVAL '45 days'),

    ('a3000000-0000-0000-0000-000000000003', v_diviner_user_id,
     'celtic-cross', 'Celtic Cross',
     '[
       {"position": 1, "position_name": "Present", "card_name": "Queen of Pentacles", "is_reversed": false, "keywords": ["nurturing","abundance"], "meaning": "Grounded prosperity."},
       {"position": 2, "position_name": "Challenge", "card_name": "Five of Wands", "is_reversed": false, "keywords": ["conflict","competition"], "meaning": "Workplace competition emerging."}
     ]'::jsonb,
     'Career-focused reading. Client considering job change.',
     NOW() - INTERVAL '20 days'),

    ('a3000000-0000-0000-0000-000000000004', v_diviner_user_id,
     'horseshoe', 'Horseshoe Spread',
     '[
       {"position": 1, "position_name": "Past", "card_name": "Ace of Cups", "is_reversed": false, "keywords": ["love","emotion"], "meaning": "New emotional beginnings."},
       {"position": 2, "position_name": "Present", "card_name": "Two of Cups", "is_reversed": false, "keywords": ["partnership","unity"], "meaning": "A meaningful connection."},
       {"position": 3, "position_name": "Future", "card_name": "The Lovers", "is_reversed": true, "keywords": ["choice","misalignment"], "meaning": "Important relationship decisions ahead."}
     ]'::jsonb,
     'Relationship-focused reading for client. Important decisions ahead.',
     NOW() - INTERVAL '10 days'),

    ('a3000000-0000-0000-0000-000000000005', v_diviner_user_id,
     'three-card', 'Three Card Spread',
     '[
       {"position": 1, "position_name": "Mind", "card_name": "The Hermit", "is_reversed": false, "keywords": ["introspection","wisdom"], "meaning": "Time for inner reflection."},
       {"position": 2, "position_name": "Body", "card_name": "Strength", "is_reversed": false, "keywords": ["courage","patience"], "meaning": "Inner strength prevails."},
       {"position": 3, "position_name": "Spirit", "card_name": "The High Priestess", "is_reversed": false, "keywords": ["intuition","mystery"], "meaning": "Trust your inner voice."}
     ]'::jsonb,
     'Deeply spiritual reading. Client is on a powerful path of self-discovery.',
     NOW() - INTERVAL '3 days')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 15. Birth Chart Results (5 charts)
  -- =========================================================================
  INSERT INTO birth_chart_results (id, user_id, city_label,
    birth_day, birth_month, birth_year, birth_hour, birth_min,
    lat, lon, tzone, chart_url, astro_data, created_at)
  VALUES
    ('a4000000-0000-0000-0000-000000000001', v_diviner_user_id,
     'New York, NY', 15, 3, 1990, 14, 30,
     40.712776, -74.005974, 'America/New_York',
     'https://charts.example.com/chart-001.svg',
     '{"sun_sign": "Pisces", "moon_sign": "Cancer", "rising_sign": "Leo", "mercury": "Pisces", "venus": "Aries"}'::jsonb,
     NOW() - INTERVAL '85 days'),

    ('a4000000-0000-0000-0000-000000000002', v_diviner_user_id,
     'Los Angeles, CA', 22, 7, 1985, 9, 15,
     34.052235, -118.243683, 'America/Los_Angeles',
     'https://charts.example.com/chart-002.svg',
     '{"sun_sign": "Cancer", "moon_sign": "Scorpio", "rising_sign": "Virgo", "mercury": "Leo", "venus": "Gemini"}'::jsonb,
     NOW() - INTERVAL '72 days'),

    ('a4000000-0000-0000-0000-000000000003', v_diviner_user_id,
     'Chicago, IL', 8, 11, 1992, 22, 0,
     41.878113, -87.629799, 'America/Chicago',
     'https://charts.example.com/chart-003.svg',
     '{"sun_sign": "Scorpio", "moon_sign": "Aries", "rising_sign": "Cancer", "mercury": "Sagittarius", "venus": "Libra"}'::jsonb,
     NOW() - INTERVAL '60 days'),

    ('a4000000-0000-0000-0000-000000000004', v_diviner_user_id,
     'Houston, TX', 30, 1, 1988, 6, 45,
     29.760427, -95.369804, 'America/Chicago',
     NULL,
     '{"sun_sign": "Aquarius", "moon_sign": "Taurus", "rising_sign": "Sagittarius", "mercury": "Capricorn", "venus": "Pisces"}'::jsonb,
     NOW() - INTERVAL '45 days'),

    ('a4000000-0000-0000-0000-000000000005', v_diviner_user_id,
     'Miami, FL', 12, 9, 1995, 18, 20,
     25.761681, -80.191788, 'America/New_York',
     'https://charts.example.com/chart-005.svg',
     '{"sun_sign": "Virgo", "moon_sign": "Gemini", "rising_sign": "Pisces", "mercury": "Virgo", "venus": "Leo"}'::jsonb,
     NOW() - INTERVAL '30 days')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 16. Platform Settings — ensure no-show policy values are set
  -- =========================================================================
  UPDATE platform_settings
     SET no_show_diviner_refund_percent = 100,
         no_show_client_refund_percent  = 50,
         no_show_grace_minutes          = 10,
         updated_at                     = NOW()
   WHERE id = (SELECT id FROM platform_settings LIMIT 1);

  RAISE NOTICE 'Seed data inserted successfully for diviner %', v_diviner_id;

END $$;
