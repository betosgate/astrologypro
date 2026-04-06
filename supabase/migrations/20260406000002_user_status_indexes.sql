-- User status indexes for performant status filtering
CREATE INDEX IF NOT EXISTS idx_diviners_is_active ON diviners(is_active);
CREATE INDEX IF NOT EXISTS idx_social_advocates_is_active ON social_advocates(is_active);
CREATE INDEX IF NOT EXISTS idx_community_members_membership_status ON community_members(membership_status);
CREATE INDEX IF NOT EXISTS idx_trainees_training_status ON trainees(training_status);
