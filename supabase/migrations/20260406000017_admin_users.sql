-- Admin users table — drives admin access in production
-- Supersedes the ADMIN_EMAILS env var check (kept only as bootstrap fallback)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  granted_by TEXT DEFAULT 'bootstrap',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only service_role can read/write — never exposed to client
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_admin_users" ON admin_users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
