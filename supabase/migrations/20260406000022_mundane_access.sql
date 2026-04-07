-- User-level mundane astrology access control
CREATE TABLE IF NOT EXISTS mundane_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level VARCHAR(10) NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'write')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE mundane_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_mundane" ON mundane_access
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "user_read_own_mundane" ON mundane_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_mundane_access_user ON mundane_access(user_id);
