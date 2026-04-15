-- Fix affiliate_referrals.affiliate_id FK
-- Previously pointed to `affiliates` (diviner-linked affiliate table).
-- Social advocate portal uses social_advocates.id for referral queries.
-- Drop the old FK and re-point to social_advocates so the advocate dashboard works.

-- 1. Remove old placeholder seed rows that used affiliates.id pattern UUIDs
DELETE FROM affiliate_referrals
WHERE affiliate_id IN (
  'f0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002',
  'f0000000-0000-0000-0000-000000000003'
);

-- Also remove any rows seeded against wrong affiliates.id for test user
DELETE FROM affiliate_referrals
WHERE affiliate_id = 'c8a22a1f-23d8-4277-bec4-a612ce9d1080';

-- 2. Drop old FK constraint
ALTER TABLE affiliate_referrals
  DROP CONSTRAINT IF EXISTS affiliate_referrals_affiliate_id_fkey;

-- 3. Add new FK pointing to social_advocates
ALTER TABLE affiliate_referrals
  ADD CONSTRAINT affiliate_referrals_affiliate_id_fkey
  FOREIGN KEY (affiliate_id)
  REFERENCES social_advocates(id)
  ON DELETE CASCADE;

-- 4. Seed real referrals for test advocate (social_advocates.id = c402dcb0...)
INSERT INTO affiliate_referrals (affiliate_id, commission_amount, status, created_at)
VALUES
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 65.00, 'paid',    NOW() - INTERVAL '52 days'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 50.00, 'paid',    NOW() - INTERVAL '44 days'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 45.00, 'paid',    NOW() - INTERVAL '36 days'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 80.00, 'paid',    NOW() - INTERVAL '28 days'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 55.00, 'paid',    NOW() - INTERVAL '20 days'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 70.00, 'earned',  NOW() - INTERVAL '12 days'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 45.00, 'earned',  NOW() - INTERVAL '7 days'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 60.00, 'pending', NOW() - INTERVAL '4 days'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 50.00, 'pending', NOW() - INTERVAL '2 days'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 40.00, 'pending', NOW() - INTERVAL '1 day'),
  ('c402dcb0-6abd-446c-9ec9-b15ee5f7b4fe', 75.00, 'pending', NOW() - INTERVAL '6 hours');
