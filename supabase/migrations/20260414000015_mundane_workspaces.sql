-- Workspace (team) for collaborative mundane research
CREATE TABLE IF NOT EXISTS mundane_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tradition VARCHAR(20) NOT NULL DEFAULT 'western' CHECK (tradition IN ('western','vedic','hybrid')),
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mundane_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES mundane_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('super_admin','admin','astrologer','researcher','editor','viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS mundane_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES mundane_workspaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  diff JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mw_owner ON mundane_workspaces(owner_id);
CREATE INDEX idx_mwm_workspace ON mundane_workspace_members(workspace_id);
CREATE INDEX idx_mwm_user ON mundane_workspace_members(user_id);
CREATE INDEX idx_mal_workspace ON mundane_audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_mal_user ON mundane_audit_logs(user_id, created_at DESC);

ALTER TABLE mundane_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundane_workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundane_audit_logs ENABLE ROW LEVEL SECURITY;

-- Owner and members can see their workspace
CREATE POLICY "mw_member_read" ON mundane_workspaces FOR SELECT
  USING (owner_id = auth.uid() OR id IN (
    SELECT workspace_id FROM mundane_workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "mw_owner_write" ON mundane_workspaces FOR ALL
  USING (owner_id = auth.uid());
CREATE POLICY "mw_service_role" ON mundane_workspaces FOR ALL TO service_role USING (true);

CREATE POLICY "mwm_member_read" ON mundane_workspace_members FOR SELECT
  USING (user_id = auth.uid() OR workspace_id IN (
    SELECT id FROM mundane_workspaces WHERE owner_id = auth.uid()
  ));
CREATE POLICY "mwm_admin_write" ON mundane_workspace_members FOR ALL
  USING (workspace_id IN (
    SELECT id FROM mundane_workspaces WHERE owner_id = auth.uid()
  ) OR workspace_id IN (
    SELECT workspace_id FROM mundane_workspace_members
    WHERE user_id = auth.uid() AND role IN ('super_admin','admin')
  ));
CREATE POLICY "mwm_service_role" ON mundane_workspace_members FOR ALL TO service_role USING (true);

CREATE POLICY "mal_member_read" ON mundane_audit_logs FOR SELECT
  USING (user_id = auth.uid() OR workspace_id IN (
    SELECT id FROM mundane_workspaces WHERE owner_id = auth.uid()
  ));
CREATE POLICY "mal_service_role" ON mundane_audit_logs FOR ALL TO service_role USING (true);
