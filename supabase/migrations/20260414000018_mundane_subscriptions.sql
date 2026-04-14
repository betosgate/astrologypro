CREATE TABLE IF NOT EXISTS mundane_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES mundane_workspaces(id) ON DELETE CASCADE,
  subscriber_email VARCHAR(255) NOT NULL,
  subscriber_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic','premium','enterprise')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  access_level VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('viewer','reader')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(workspace_id, subscriber_email)
);

ALTER TABLE mundane_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms_owner" ON mundane_subscriptions FOR ALL
  USING (workspace_id IN (SELECT id FROM mundane_workspaces WHERE owner_id = auth.uid()));
CREATE POLICY "ms_subscriber" ON mundane_subscriptions FOR SELECT
  USING (subscriber_user_id = auth.uid());
CREATE POLICY "ms_service_role" ON mundane_subscriptions FOR ALL TO service_role USING (true);
