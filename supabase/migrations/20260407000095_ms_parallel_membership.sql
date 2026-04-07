-- ============================================================
-- Migration: Mystery School Parallel Membership
--
-- Enables PM and Mystery School to coexist for the same user.
-- Previously community_members.membership_type was exclusive —
-- buying MS overwrote PM.  Now:
--   - community_members tracks PM membership only
--   - mystery_school_students is the authoritative MS entitlement
--   - A user with both records = dual-entitlement
--
-- Also creates platform_settings for the admin PM-discount toggle.
-- ============================================================

-- 1. Platform settings table (singleton row for global admin toggles)
CREATE TABLE IF NOT EXISTS platform_settings (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ms_pm_discount_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write platform settings
CREATE POLICY "service role full access platform_settings"
  ON platform_settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Seed a single settings row
INSERT INTO platform_settings (ms_pm_discount_enabled)
VALUES (true)
ON CONFLICT DO NOTHING;

-- 2. Update RLS policy on mystery_school_foundation_weeks
--    Old policy checked community_members.membership_type = 'mystery_school'.
--    New policy checks mystery_school_students.status = 'active' (or access_expires_at in future).
--    This allows PM users who also enrolled in MS to access foundation content
--    without their community_members.membership_type being changed.
DROP POLICY IF EXISTS "mystery school students read weeks"
  ON mystery_school_foundation_weeks;

CREATE POLICY "mystery school students read weeks"
  ON mystery_school_foundation_weeks FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM mystery_school_students mss
      WHERE mss.user_id = auth.uid()
        AND (
          mss.status = 'active'
          OR (mss.status = 'cancelled' AND mss.access_expires_at > now())
        )
    )
  );
