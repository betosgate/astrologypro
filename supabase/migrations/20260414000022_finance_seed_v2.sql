-- ============================================================================
-- Finance seed v2: 12 months of varied data, all 5 clients, weekly_subscription
-- and telephony entries, 3 refund events, finance goals row.
-- Idempotent: ON CONFLICT DO NOTHING throughout.
-- ============================================================================

DO $$
DECLARE
  v_diviner_id  UUID;
  v_client1_id  UUID := 'a0000000-0000-0000-0000-000000000001';
  v_client2_id  UUID := 'a0000000-0000-0000-0000-000000000002';
  v_client3_id  UUID := 'a0000000-0000-0000-0000-000000000003';
  v_client4_id  UUID := 'a0000000-0000-0000-0000-000000000004';
  v_client5_id  UUID := 'a0000000-0000-0000-0000-000000000005';
BEGIN

  SELECT id INTO v_diviner_id
    FROM diviners
   WHERE display_name = 'Cosmic Aura'
   LIMIT 1;

  IF v_diviner_id IS NULL THEN
    SELECT id INTO v_diviner_id
      FROM diviners
     WHERE is_active = TRUE
     ORDER BY created_at ASC
     LIMIT 1;
  END IF;

  IF v_diviner_id IS NULL THEN
    RAISE NOTICE 'No active diviner found — skipping finance seed v2.';
    RETURN;
  END IF;

  -- =========================================================================
  -- Additional Revenue Ledger Entries (months 1–12 ago, more variety)
  -- =========================================================================
  INSERT INTO revenue_ledger_entries (
    id, diviner_id, client_id,
    source_type, source_reference,
    gross_amount_cents, platform_fee_cents, diviner_gross_amount_cents,
    affiliate_commission_cents, diviner_net_amount_cents, platform_net_amount_cents,
    refunded_gross_amount_cents, refunded_affiliate_commission_cents, refunded_diviner_net_amount_cents,
    settlement_status, recognized_at
  ) VALUES

  -- === May 2025 (12 months ago) ===
  ('le200000-0000-0000-0000-000000000001', v_diviner_id, v_client1_id,
   'booking', 'seed2-bk-001',
   18500, 1480, 17020, 0, 17020, 1480,
   0, 0, 0, 'settled', NOW() - INTERVAL '365 days'),

  ('le200000-0000-0000-0000-000000000002', v_diviner_id, v_client2_id,
   'weekly_subscription', 'seed2-ws-001',
   9900, 792, 9108, 990, 8118, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '358 days'),

  ('le200000-0000-0000-0000-000000000003', v_diviner_id, v_client3_id,
   'telephony', 'seed2-ph-001',
   7500, 600, 6900, 0, 6900, 600,
   0, 0, 0, 'settled', NOW() - INTERVAL '350 days'),

  -- === June 2025 (11 months ago) ===
  ('le200000-0000-0000-0000-000000000004', v_diviner_id, v_client4_id,
   'booking', 'seed2-bk-002',
   15000, 1200, 13800, 1500, 12300, 1200,
   0, 0, 0, 'settled', NOW() - INTERVAL '330 days'),

  ('le200000-0000-0000-0000-000000000005', v_diviner_id, v_client5_id,
   'weekly_subscription', 'seed2-ws-002',
   9900, 792, 9108, 0, 9108, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '323 days'),

  ('le200000-0000-0000-0000-000000000006', v_diviner_id, v_client1_id,
   'booking', 'seed2-bk-003',
   22000, 1760, 20240, 2200, 18040, 1760,
   0, 0, 0, 'settled', NOW() - INTERVAL '315 days'),

  -- === July 2025 (10 months ago) ===
  ('le200000-0000-0000-0000-000000000007', v_diviner_id, v_client2_id,
   'booking', 'seed2-bk-004',
   12000, 960, 11040, 0, 11040, 960,
   0, 0, 0, 'settled', NOW() - INTERVAL '295 days'),

  ('le200000-0000-0000-0000-000000000008', v_diviner_id, v_client3_id,
   'weekly_subscription', 'seed2-ws-003',
   9900, 792, 9108, 990, 8118, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '290 days'),

  ('le200000-0000-0000-0000-000000000009', v_diviner_id, v_client4_id,
   'telephony', 'seed2-ph-002',
   8500, 680, 7820, 0, 7820, 680,
   8500, 0, 7820, 'refunded', NOW() - INTERVAL '285 days'),

  -- === August 2025 (9 months ago) ===
  ('le200000-0000-0000-0000-000000000010', v_diviner_id, v_client5_id,
   'booking', 'seed2-bk-005',
   25000, 2000, 23000, 0, 23000, 2000,
   0, 0, 0, 'settled', NOW() - INTERVAL '265 days'),

  ('le200000-0000-0000-0000-000000000011', v_diviner_id, v_client1_id,
   'weekly_subscription', 'seed2-ws-004',
   9900, 792, 9108, 0, 9108, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '258 days'),

  ('le200000-0000-0000-0000-000000000012', v_diviner_id, v_client2_id,
   'booking', 'seed2-bk-006',
   18500, 1480, 17020, 1850, 15170, 1480,
   0, 0, 0, 'settled', NOW() - INTERVAL '250 days'),

  -- === September 2025 (8 months ago) ===
  ('le200000-0000-0000-0000-000000000013', v_diviner_id, v_client3_id,
   'booking', 'seed2-bk-007',
   13500, 1080, 12420, 0, 12420, 1080,
   0, 0, 0, 'settled', NOW() - INTERVAL '230 days'),

  ('le200000-0000-0000-0000-000000000014', v_diviner_id, v_client4_id,
   'telephony', 'seed2-ph-003',
   6000, 480, 5520, 0, 5520, 480,
   0, 0, 0, 'settled', NOW() - INTERVAL '225 days'),

  ('le200000-0000-0000-0000-000000000015', v_diviner_id, v_client5_id,
   'weekly_subscription', 'seed2-ws-005',
   9900, 792, 9108, 990, 8118, 792,
   9900, 990, 8118, 'refunded', NOW() - INTERVAL '218 days'),

  ('le200000-0000-0000-0000-000000000016', v_diviner_id, v_client1_id,
   'booking', 'seed2-bk-008',
   20000, 1600, 18400, 0, 18400, 1600,
   0, 0, 0, 'settled', NOW() - INTERVAL '210 days'),

  -- === October–April already seeded in finance_seed_data.sql ===
  -- Add more October and November entries here to fill out:

  ('le200000-0000-0000-0000-000000000017', v_diviner_id, v_client2_id,
   'weekly_subscription', 'seed2-ws-006',
   9900, 792, 9108, 0, 9108, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '168 days'),

  ('le200000-0000-0000-0000-000000000018', v_diviner_id, v_client3_id,
   'telephony', 'seed2-ph-004',
   7200, 576, 6624, 720, 5904, 576,
   0, 0, 0, 'settled', NOW() - INTERVAL '162 days'),

  -- November extras
  ('le200000-0000-0000-0000-000000000019', v_diviner_id, v_client4_id,
   'weekly_subscription', 'seed2-ws-007',
   9900, 792, 9108, 0, 9108, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '145 days'),

  ('le200000-0000-0000-0000-000000000020', v_diviner_id, v_client5_id,
   'booking', 'seed2-bk-009',
   17500, 1400, 16100, 0, 16100, 1400,
   0, 0, 0, 'settled', NOW() - INTERVAL '138 days'),

  -- December extras
  ('le200000-0000-0000-0000-000000000021', v_diviner_id, v_client1_id,
   'weekly_subscription', 'seed2-ws-008',
   9900, 792, 9108, 0, 9108, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '115 days'),

  ('le200000-0000-0000-0000-000000000022', v_diviner_id, v_client3_id,
   'telephony', 'seed2-ph-005',
   8500, 680, 7820, 0, 7820, 680,
   0, 0, 0, 'settled', NOW() - INTERVAL '108 days'),

  -- January extras
  ('le200000-0000-0000-0000-000000000023', v_diviner_id, v_client2_id,
   'weekly_subscription', 'seed2-ws-009',
   9900, 792, 9108, 990, 8118, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '80 days'),

  ('le200000-0000-0000-0000-000000000024', v_diviner_id, v_client5_id,
   'booking', 'seed2-bk-010',
   22000, 1760, 20240, 0, 20240, 1760,
   0, 0, 0, 'settled', NOW() - INTERVAL '72 days'),

  -- February extras
  ('le200000-0000-0000-0000-000000000025', v_diviner_id, v_client4_id,
   'weekly_subscription', 'seed2-ws-010',
   9900, 792, 9108, 0, 9108, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '50 days'),

  ('le200000-0000-0000-0000-000000000026', v_diviner_id, v_client1_id,
   'telephony', 'seed2-ph-006',
   9500, 760, 8740, 950, 7790, 760,
   0, 0, 0, 'settled', NOW() - INTERVAL '44 days'),

  -- March extras
  ('le200000-0000-0000-0000-000000000027', v_diviner_id, v_client3_id,
   'weekly_subscription', 'seed2-ws-011',
   9900, 792, 9108, 0, 9108, 792,
   0, 0, 0, 'settled', NOW() - INTERVAL '25 days'),

  ('le200000-0000-0000-0000-000000000028', v_diviner_id, v_client5_id,
   'telephony', 'seed2-ph-007',
   6500, 520, 5980, 0, 5980, 520,
   0, 0, 0, 'settled', NOW() - INTERVAL '18 days')

  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- Additional Refund Events
  -- =========================================================================
  INSERT INTO refund_events (
    id, diviner_id, client_id,
    initiated_by_role,
    amount_cents, reason, status, created_at
  ) VALUES
    ('re200000-0000-0000-0000-000000000001', v_diviner_id, v_client4_id,
     'admin',
     8500, 'Technical issue during session', 'processed', NOW() - INTERVAL '283 days'),

    ('re200000-0000-0000-0000-000000000002', v_diviner_id, v_client5_id,
     'diviner',
     9900, 'Subscription cancelled mid-cycle', 'processed', NOW() - INTERVAL '216 days'),

    ('re200000-0000-0000-0000-000000000003', v_diviner_id, v_client2_id,
     'admin',
     6000, 'Duplicate charge corrected', 'processed', NOW() - INTERVAL '40 days')
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================================
  -- Finance Goals row for this diviner
  -- $8,000/month goal, 28% tax reserve
  -- =========================================================================
  INSERT INTO diviner_finance_goals (diviner_id, monthly_revenue_goal_cents, tax_reserve_percent)
  VALUES (v_diviner_id, 800000, 28.00)
  ON CONFLICT (diviner_id) DO UPDATE
    SET monthly_revenue_goal_cents = 800000,
        tax_reserve_percent = 28.00,
        updated_at = NOW();

  RAISE NOTICE 'Finance seed v2 complete for diviner %', v_diviner_id;

END $$;
