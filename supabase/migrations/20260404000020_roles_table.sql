-- Roles table for admin role management
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access roles"
  ON roles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX roles_status_idx ON roles(status);
CREATE INDEX roles_priority_idx ON roles(priority);
CREATE INDEX roles_created_at_idx ON roles(created_at);
CREATE INDEX roles_updated_at_idx ON roles(updated_at);
