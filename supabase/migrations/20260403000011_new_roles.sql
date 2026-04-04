-- New role tables: social_advocates, community_members, trainees
-- Covers: is_social_advo, is_customer_socialadvo, is_Perennial_Mandalism,
--         is_mystery_school, is_trainee

-- ── Social Advocates ─────────────────────────────────────────────────────────
-- Self-signup practitioners who promote diviners and earn commissions via
-- social sharing. is_customer_socialadvo users have BOTH a clients + social_advocates record.

CREATE TABLE social_advocates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                VARCHAR(100) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  username            VARCHAR(50) UNIQUE NOT NULL,
  bio                 TEXT,
  referral_code       VARCHAR(20) UNIQUE NOT NULL,
  social_platforms    TEXT[] DEFAULT '{}',
  commission_percent  DECIMAL(5,2) DEFAULT 10.00,
  total_referrals     INTEGER DEFAULT 0,
  total_earned        DECIMAL(10,2) DEFAULT 0.00,
  total_paid          DECIMAL(10,2) DEFAULT 0.00,
  is_active           BOOLEAN DEFAULT TRUE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_social_advocates_user_id    ON social_advocates(user_id);
CREATE UNIQUE INDEX idx_social_advocates_referral   ON social_advocates(referral_code);
CREATE UNIQUE INDEX idx_social_advocates_username   ON social_advocates(username);

-- ── Community Members ─────────────────────────────────────────────────────────
-- Covers is_Perennial_Mandalism and is_mystery_school.
-- membership_type distinguishes which program they belong to.

CREATE TYPE community_membership_type AS ENUM ('perennial_mandalism', 'mystery_school');

CREATE TABLE community_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email            VARCHAR(255) NOT NULL,
  full_name        VARCHAR(100),
  membership_type  community_membership_type NOT NULL,
  membership_status VARCHAR(20) DEFAULT 'active' CHECK (membership_status IN ('active','paused','expired','cancelled')),
  joined_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at       TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_community_members_user_id ON community_members(user_id);
CREATE INDEX idx_community_members_type          ON community_members(membership_type);
CREATE INDEX idx_community_members_status        ON community_members(membership_status);

-- ── Trainees ──────────────────────────────────────────────────────────────────
-- Apprentices learning under a diviner mentor.

CREATE TABLE trainees (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mentor_diviner_id    UUID REFERENCES diviners(id) ON DELETE SET NULL,
  name                 VARCHAR(100) NOT NULL,
  email                VARCHAR(255) NOT NULL,
  username             VARCHAR(50) UNIQUE NOT NULL,
  bio                  TEXT,
  specialties          TEXT[] DEFAULT '{}',
  training_status      VARCHAR(20) DEFAULT 'active' CHECK (training_status IN ('pending','active','graduated','paused','cancelled')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  graduated_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_trainees_user_id   ON trainees(user_id);
CREATE UNIQUE INDEX idx_trainees_username  ON trainees(username);
CREATE INDEX idx_trainees_mentor           ON trainees(mentor_diviner_id);
CREATE INDEX idx_trainees_status           ON trainees(training_status);

-- ── RLS Policies ─────────────────────────────────────────────────────────────

ALTER TABLE social_advocates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainees          ENABLE ROW LEVEL SECURITY;

-- Social advocates: own row only
CREATE POLICY "advocates_select_own" ON social_advocates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "advocates_insert_own" ON social_advocates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "advocates_update_own" ON social_advocates FOR UPDATE USING (auth.uid() = user_id);

-- Community members: own row only
CREATE POLICY "community_select_own" ON community_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "community_insert_own" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_update_own" ON community_members FOR UPDATE USING (auth.uid() = user_id);

-- Trainees: own row only; mentors can see their trainees
CREATE POLICY "trainees_select_own"   ON trainees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trainees_insert_own"   ON trainees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trainees_update_own"   ON trainees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trainees_mentor_read"  ON trainees FOR SELECT USING (
  mentor_diviner_id IN (
    SELECT id FROM diviners WHERE user_id = auth.uid()
  )
);
