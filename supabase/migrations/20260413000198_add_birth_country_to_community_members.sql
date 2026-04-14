-- Add birth_country to community_members for full natal chart readiness
ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS birth_country VARCHAR(100);
