-- ============================================================================
-- Seed realistic revenue ledger entries and discount rules for the finance
-- and discounts dashboards to display data.
-- Idempotent: uses ON CONFLICT DO NOTHING and existence checks throughout.
-- ============================================================================

DO $$
DECLARE
  v_diviner_id  UUID;
  v_client1_id  UUID := 'a0000000-0000-0000-0000-000000000001';
  v_client2_id  UUID := 'a0000000-0000-0000-0000-000000000002';
  v_client3_id  UUID := 'a0000000-0000-0000-0000-000000000003';
  v_client4_id  UUID := 'a0000000-0000-0000-0000-000000000004';
  v_client5_id  UUID := 'a0000000-0000-0000-0000-000000000005';
  v_rule1_id    UUID := 'dr100000-0000-0000-0000-000000000001';
  v_rule2_id    UUID := 'dr100000-0000-0000-0000-000000000002';
BEGIN

  -- Resolve the first active diviner
  SELECT id INTO v_diviner_id
    FROM diviners
   WHERE is_active = TRUE
   ORDER BY created_at ASC
   LIMIT 1;

  IF v_diviner_id IS NULL THEN
    RAISE NOTICE 'No active diviner found — skipping finance seed.';
    RETURN;
  END IF;

  -- =========================================================================
  -- 1. Discount Rules
  -- =========================================================================
  INSERT INTO discount_rules (id, diviner_id, name, type, min_sessions, discount_percent, is_active)
  VALUES
    (v_rule1_id, v_diviner_id, 'Loyal Client — 5th Session', 'session_count', 5, 10.00, TRUE),
    (v_rule2_id, v_diviner_id, 'VIP Package — 10% Off',      'package',       NULL, 10.00, TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 2. Revenue Ledger Entries — 6 months of booking revenue
  -- =========================================================================
  INSERT INTO revenue_ledger_entries (
    id, diviner_id, client_id,
    source_type, source_reference,
    gross_amount_cents, platform_fee_cents, diviner_gross_amount_cents,
    affiliate_commission_cents, diviner_net_amount_cents, platform_net_amount_cents,
    refunded_gross_amount_cents, refunded_affiliate_commission_cents, refunded_diviner_net_amount_cents,
    settlement_status, recognized_at
  ) VALUES
  -- October 2025
  ('le100000-0000-0000-0000-000000000001', v_diviner_id, v_client1_id,
   'booking', 'c0000000-0000-0000-0000-000000000001',
   13500, 1080, 12420, 0, 12420, 1080,
   0, 0, 0, 'settled', NOW() - INTERVAL '180 days'),

  ('le100000-0000-0000-0000-000000000002', v_diviner_id, v_client2_id,
   'booking', 'c0000000-0000-0000-0000-000000000002',
   8500, 680, 7820, 850, 6970, 680,
   0, 0, 0, 'settled', NOW() - INTERVAL '172 days'),

  -- November 2025
  ('le100000-0000-0000-0000-000000000003', v_diviner_id, v_client3_id,
   'booking', 'c0000000-0000-0000-0000-000000000003',
   15000, 1200, 13800, 0, 13800, 1200,
   0, 0, 0, 'settled', NOW() - INTERVAL '155 days'),

  ('le100000-0000-0000-0000-000000000004', v_diviner_id, v_client4_id,
   'booking', 'c0000000-0000-0000-0000-000000000004',
   12000, 960, 11040, 1200, 9840, 960,
   0, 0, 0, 'settled', NOW() - INTERVAL '148 days'),

  ('le100000-0000-0000-0000-000000000005', v_diviner_id, v_client5_id,
   'booking', 'c0000000-0000-0000-0000-000000000005',
   8500, 680, 7820, 0, 7820, 680,
   0, 0, 0, 'settled', NOW() - INTERVAL '140 days'),

  -- December 2025
  ('le100000-0000-0000-0000-000000000006', v_diviner_id, v_client1_id,
   'booking', 'c0000000-0000-0000-0000-000000000006',
   13500, 1080, 12420, 0, 12420, 1080,
   0, 0, 0, 'settled', NOW() - INTERVAL '118 days'),

  ('le100000-0000-0000-0000-000000000007', v_diviner_id, v_client2_id,
   'booking', 'c0000000-0000-0000-0000-000000000007',
   8500, 680, 7820, 850, 6970, 680,
   8500, 850, 6970, 'refunded', NOW() - INTERVAL '110 days'),

  ('le100000-0000-0000-0000-000000000008', v_diviner_id, v_client3_id,
   'booking', 'c0000000-0000-0000-0000-000000000008',
   20000, 1600, 18400, 2000, 16400, 1600,
   0, 0, 0, 'settled', NOW() - INTERVAL '105 days'),

  -- January 2026
  ('le100000-0000-0000-0000-000000000009', v_diviner_id, v_client4_id,
   'booking', 'c0000000-0000-0000-0000-000000000009',
   12000, 960, 11040, 0, 11040, 960,
   0, 0, 0, 'settled', NOW() - INTERVAL '85 days'),

  ('le100000-0000-0000-0000-000000000010', v_diviner_id, v_client5_id,
   'booking', 'c0000000-0000-0000-0000-000000000010',
   8500, 680, 7820, 0, 7820, 680,
   0, 0, 0, 'settled', NOW() - INTERVAL '78 days'),

  ('le100000-0000-0000-0000-000000000011', v_diviner_id, v_client1_id,
   'booking', 'c0000000-0000-0000-0000-000000000011',
   15000, 1200, 13800, 1500, 12300, 1200,
   0, 0, 0, 'settled', NOW() - INTERVAL '70 days'),

  -- February 2026
  ('le100000-0000-0000-0000-000000000012', v_diviner_id, v_client2_id,
   'booking', 'c0000000-0000-0000-0000-000000000012',
   8500, 680, 7820, 0, 7820, 680,
   0, 0, 0, 'settled', NOW() - INTERVAL '55 days'),

  ('le100000-0000-0000-0000-000000000013', v_diviner_id, v_client3_id,
   'booking', 'c0000000-0000-0000-0000-000000000013',
   13500, 1080, 12420, 0, 12420, 1080,
   0, 0, 0, 'settled', NOW() - INTERVAL '48 days'),

  ('le100000-0000-0000-0000-000000000014', v_diviner_id, v_client4_id,
   'booking', 'c0000000-0000-0000-0000-000000000014',
   20000, 1600, 18400, 0, 18400, 1600,
   0, 0, 0, 'settled', NOW() - INTERVAL '42 days'),

  -- March 2026
  ('le100000-0000-0000-0000-000000000015', v_diviner_id, v_client5_id,
   'booking', 'c0000000-0000-0000-0000-000000000015',
   8500, 680, 7820, 850, 6970, 680,
   0, 0, 0, 'settled', NOW() - INTERVAL '30 days'),

  ('le100000-0000-0000-0000-000000000016', v_diviner_id, v_client1_id,
   'booking', 'c0000000-0000-0000-0000-000000000016',
   15000, 1200, 13800, 0, 13800, 1200,
   0, 0, 0, 'settled', NOW() - INTERVAL '22 days'),

  ('le100000-0000-0000-0000-000000000017', v_diviner_id, v_client2_id,
   'telephony', 'phone-session-001',
   6000, 480, 5520, 0, 5520, 480,
   0, 0, 0, 'settled', NOW() - INTERVAL '15 days'),

  -- April 2026 (recent)
  ('le100000-0000-0000-0000-000000000018', v_diviner_id, v_client3_id,
   'booking', 'c0000000-0000-0000-0000-000000000018',
   13500, 1080, 12420, 0, 12420, 1080,
   0, 0, 0, 'pending', NOW() - INTERVAL '7 days'),

  ('le100000-0000-0000-0000-000000000019', v_diviner_id, v_client4_id,
   'booking', 'c0000000-0000-0000-0000-000000000019',
   12000, 960, 11040, 1200, 9840, 960,
   0, 0, 0, 'pending', NOW() - INTERVAL '3 days'),

  ('le100000-0000-0000-0000-000000000020', v_diviner_id, v_client5_id,
   'booking', 'c0000000-0000-0000-0000-000000000020',
   8500, 680, 7820, 0, 7820, 680,
   0, 0, 0, 'pending', NOW() - INTERVAL '1 day')

  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 3. Refund Events (linked to the one refunded ledger entry)
  -- =========================================================================
  INSERT INTO refund_events (id, diviner_id, client_id, amount_cents, reason, status, created_at)
  VALUES
    ('re100000-0000-0000-0000-000000000001', v_diviner_id, v_client2_id,
     8500, 'Client requested cancellation', 'succeeded', NOW() - INTERVAL '108 days')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- 4. Mark some bookings with discount rule usage
  -- =========================================================================
  UPDATE bookings
     SET discount_rule_id = v_rule1_id,
         discount_amount_saved = 12.00
   WHERE id IN (
     'c0000000-0000-0000-0000-000000000001',
     'c0000000-0000-0000-0000-000000000006'
   )
     AND diviner_id = v_diviner_id;

  UPDATE bookings
     SET discount_rule_id = v_rule2_id,
         discount_amount_saved = 8.50
   WHERE id IN (
     'c0000000-0000-0000-0000-000000000003'
   )
     AND diviner_id = v_diviner_id;

  RAISE NOTICE 'Finance seed data inserted for diviner %', v_diviner_id;

END $$;
