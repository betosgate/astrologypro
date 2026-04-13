// AUTO-GENERATED bundled mirror of supabase/migrations/20260413000012_community_onboarding_completed.sql
export const MIGRATION_SQL = `-- Add an explicit onboarding completion flag for community members.
-- Back-fill existing fully provisioned members so the new guard only blocks
-- incomplete signup/onboarding flows.

ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE community_members
SET onboarding_completed = TRUE
WHERE onboarding_completed = FALSE
  AND (
    (first_name IS NOT NULL AND btrim(first_name) <> "")
    OR (intake_data IS NOT NULL AND intake_data <> '{}'::jsonb)
  );
`;
