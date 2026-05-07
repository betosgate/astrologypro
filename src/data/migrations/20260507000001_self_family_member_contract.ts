// Bundled mirror of supabase/migrations/20260507000001_self_family_member_contract.sql
export const MIGRATION_SQL = `
-- ============================================================================
-- Community: self family member contract
--
-- The primary account owner must exist in \`community_family_members\` as a
-- canonical \`relationship='self'\` row because household products use that row's
-- id as person identity for charts, transits, and saved report linkage.
--
-- Existing product flows allow incomplete birth profiles, so the self row must
-- also be allowed to exist before the user has entered a date of birth.
-- ============================================================================

BEGIN;

ALTER TABLE public.community_family_members
  ALTER COLUMN date_of_birth DROP NOT NULL;

UPDATE public.community_family_members fm
   SET relationship = 'self',
       full_name = COALESCE(NULLIF(fm.full_name, ''), NULLIF(cm.full_name, ''), 'Self'),
       date_of_birth = COALESCE(fm.date_of_birth, cm.date_of_birth),
       birth_time = COALESCE(fm.birth_time, cm.birth_time),
       birth_city = COALESCE(fm.birth_city, cm.birth_city),
       birth_country = COALESCE(fm.birth_country, cm.birth_country),
       updated_at = NOW()
  FROM public.community_members cm
 WHERE fm.member_id = cm.id
   AND fm.user_id = cm.user_id
   AND cm.user_id IS NOT NULL
   AND LOWER(COALESCE(fm.relationship, '')) <> 'self';

INSERT INTO public.community_family_members (
  member_id,
  user_id,
  full_name,
  date_of_birth,
  birth_time,
  birth_city,
  birth_country,
  relationship,
  age_group,
  natal_status
)
SELECT
  cm.id,
  cm.user_id,
  COALESCE(NULLIF(cm.full_name, ''), 'Self'),
  cm.date_of_birth,
  cm.birth_time,
  cm.birth_city,
  cm.birth_country,
  'self',
  'adult',
  CASE WHEN cm.date_of_birth IS NULL THEN 'not_started' ELSE 'queued' END
FROM public.community_members cm
WHERE cm.user_id IS NOT NULL
  AND cm.membership_type = 'perennial_mandalism'
  AND cm.membership_status = 'active'
  AND NOT EXISTS (
    SELECT 1
      FROM public.community_family_members existing
     WHERE existing.member_id = cm.id
       AND (
         LOWER(COALESCE(existing.relationship, '')) = 'self'
         OR existing.user_id = cm.user_id
       )
  );

COMMENT ON COLUMN public.community_family_members.date_of_birth IS
  'Nullable for canonical self rows before the primary account owner completes birth details. Product readiness gates validate required birth fields before chart/transit generation.';

COMMIT;
`;
