-- Seed campaign_affiliates + campaign_conversions for test advocate Alex Rivera
-- Advocate ID: c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe
-- Campaigns used:
--   eb1f47a5-1ecd-446f-9803-434c2bfed095  Eclipse Season Awareness (10%)
--   a585ce7d-3ebd-4ecd-9583-fef476b035f9  First-Time Tarot Intro ($8 fixed)
--   0350cb2d-c078-4521-9063-da17d8ea33e1  Mercury Retrograde Prep Pack (12%)

-- 1. Link advocate to 3 campaigns (idempotent)
INSERT INTO campaign_affiliates (id, campaign_id, affiliate_id, affiliate_type, custom_commission_value, joined_at)
VALUES
  (
    gen_random_uuid(),
    'eb1f47a5-1ecd-446f-9803-434c2bfed095',
    'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe',
    'social_advocate',
    NULL,
    NOW() - INTERVAL '60 days'
  ),
  (
    gen_random_uuid(),
    'a585ce7d-3ebd-4ecd-9583-fef476b035f9',
    'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe',
    'social_advocate',
    NULL,
    NOW() - INTERVAL '45 days'
  ),
  (
    gen_random_uuid(),
    '0350cb2d-c078-4521-9063-da17d8ea33e1',
    'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe',
    'social_advocate',
    NULL,
    NOW() - INTERVAL '30 days'
  )
ON CONFLICT DO NOTHING;

-- 2. Seed conversions for Eclipse Season Awareness (10%)
INSERT INTO campaign_conversions (id, campaign_id, affiliate_id, affiliate_type, order_reference, order_amount_cents, commission_amount_cents, converted_at)
VALUES
  (gen_random_uuid(), 'eb1f47a5-1ecd-446f-9803-434c2bfed095', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-E001', 8500,  850,  NOW() - INTERVAL '55 days'),
  (gen_random_uuid(), 'eb1f47a5-1ecd-446f-9803-434c2bfed095', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-E002', 12000, 1200, NOW() - INTERVAL '48 days'),
  (gen_random_uuid(), 'eb1f47a5-1ecd-446f-9803-434c2bfed095', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-E003', 9500,  950,  NOW() - INTERVAL '40 days'),
  (gen_random_uuid(), 'eb1f47a5-1ecd-446f-9803-434c2bfed095', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-E004', 7500,  750,  NOW() - INTERVAL '28 days'),
  (gen_random_uuid(), 'eb1f47a5-1ecd-446f-9803-434c2bfed095', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-E005', 11000, 1100, NOW() - INTERVAL '14 days');

-- 3. Seed conversions for First-Time Tarot Intro ($8 fixed = 800 cents)
INSERT INTO campaign_conversions (id, campaign_id, affiliate_id, affiliate_type, order_reference, order_amount_cents, commission_amount_cents, converted_at)
VALUES
  (gen_random_uuid(), 'a585ce7d-3ebd-4ecd-9583-fef476b035f9', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-T001', 6500,  800,  NOW() - INTERVAL '42 days'),
  (gen_random_uuid(), 'a585ce7d-3ebd-4ecd-9583-fef476b035f9', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-T002', 6500,  800,  NOW() - INTERVAL '35 days'),
  (gen_random_uuid(), 'a585ce7d-3ebd-4ecd-9583-fef476b035f9', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-T003', 6500,  800,  NOW() - INTERVAL '22 days'),
  (gen_random_uuid(), 'a585ce7d-3ebd-4ecd-9583-fef476b035f9', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-T004', 6500,  800,  NOW() - INTERVAL '10 days');

-- 4. Seed conversions for Mercury Retrograde Prep Pack (12%)
INSERT INTO campaign_conversions (id, campaign_id, affiliate_id, affiliate_type, order_reference, order_amount_cents, commission_amount_cents, converted_at)
VALUES
  (gen_random_uuid(), '0350cb2d-c078-4521-9063-da17d8ea33e1', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-M001', 14500, 1740, NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), '0350cb2d-c078-4521-9063-da17d8ea33e1', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-M002', 9500,  1140, NOW() - INTERVAL '18 days'),
  (gen_random_uuid(), '0350cb2d-c078-4521-9063-da17d8ea33e1', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-M003', 12000, 1440, NOW() - INTERVAL '8 days'),
  (gen_random_uuid(), '0350cb2d-c078-4521-9063-da17d8ea33e1', 'c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 'social_advocate', 'ORD-M004', 8500,  1020, NOW() - INTERVAL '3 days');
