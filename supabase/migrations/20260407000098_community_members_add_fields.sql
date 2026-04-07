-- Add extended profile fields to community_members for the Add Member form
-- These support the legacy-aligned field set from the Perennial flow.

ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS birth_time TIME,
  ADD COLUMN IF NOT EXISTS birth_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS zip VARCHAR(20),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS relationship_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS relation_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS intake_data JSONB DEFAULT '{}'::jsonb;

-- intake_data stores questionnaire fields:
--   personality, strengths, lifeAreasFulfilling, lifeAreasImprovement,
--   longTermGoals, majorLifeEvents, relationship_with_family,
--   biggest_current_challenges, mainConcern, additionalInfo,
--   achieveFromReading, focus_on_specific_relationships,
--   stressManagement, workLifeBalance, concerns_about_romantic_life,
--   social_life_fulfillment, spiritualPractices,
--   guidance_on_specific_decision, ongoing_projects_or_plans,
--   selfDiscovery, externalInfluences, specificQuestions, goalsOutcomes
