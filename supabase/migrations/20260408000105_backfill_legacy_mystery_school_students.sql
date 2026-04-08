-- ============================================================
-- Migration: Backfill Legacy Mystery School Students
--
-- Creates authoritative mystery_school_students rows for legacy
-- community_members entries that still use membership_type =
-- 'mystery_school' and do not yet have a matching student record.
-- ============================================================

INSERT INTO mystery_school_students (
  user_id,
  community_member_id,
  enrolled_at,
  enrollment_date,
  start_quarter,
  training_status,
  stripe_subscription_id,
  one_time_fee_paid,
  one_time_fee_amount,
  status
)
SELECT
  cm.user_id,
  cm.id,
  COALESCE(cm.joined_at, NOW()),
  COALESCE(cm.joined_at, NOW()),
  'next',
  'foundation',
  cm.stripe_subscription_id,
  TRUE,
  97.00,
  CASE
    WHEN cm.membership_status = 'active' THEN 'active'
    ELSE 'cancelled'
  END
FROM community_members cm
LEFT JOIN mystery_school_students mss
  ON mss.user_id = cm.user_id
WHERE cm.membership_type = 'mystery_school'
  AND mss.user_id IS NULL;
