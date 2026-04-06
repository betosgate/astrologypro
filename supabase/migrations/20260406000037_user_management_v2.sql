-- Migration: 20260406000037_user_management_v2.sql
-- Purpose: User Management v2 — permissions, role_permissions, invitations,
--          user_relationships, user_security_events, communication_preferences,
--          user_impersonation_log, and diviners.account_status lifecycle column.
-- All tables use IF NOT EXISTS guards. Do not drop or modify existing tables.

-- ---------------------------------------------------------------------------
-- 1. permissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text        NOT NULL UNIQUE,       -- e.g. "user.create"
  name        text        NOT NULL,
  module      text        NOT NULL,              -- e.g. "users", "affiliates"
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO permissions (code, name, module, description) VALUES
  ('user.create',        'Create Users',           'users',       'Create any user type'),
  ('user.edit',          'Edit Users',             'users',       'Edit user profile and details'),
  ('user.delete',        'Delete/Archive Users',   'users',       'Soft-delete or archive users'),
  ('user.invite',        'Invite Users',           'users',       'Send email invitations'),
  ('user.activate',      'Activate Users',         'users',       'Activate suspended or pending accounts'),
  ('user.suspend',       'Suspend Users',          'users',       'Suspend active accounts'),
  ('user.unlock',        'Unlock Accounts',        'users',       'Unlock locked accounts'),
  ('user.view_all',      'View All Users',         'users',       'View users outside own scope'),
  ('user.export',        'Export Users',           'users',       'Export user data to CSV'),
  ('user.bulk_actions',  'Bulk Actions',           'users',       'Perform bulk operations on users'),
  ('role.assign',        'Assign Roles',           'users',       'Assign or change user roles'),
  ('role.manage',        'Manage Roles',           'users',       'Create and edit role definitions'),
  ('permission.manage',  'Manage Permissions',     'users',       'Assign permissions to roles'),
  ('affiliate.create',   'Create Affiliates',      'affiliates',  'Create new affiliate accounts'),
  ('affiliate.assign',   'Assign Affiliates',      'affiliates',  'Assign affiliates to diviners'),
  ('affiliate.view_all', 'View All Affiliates',    'affiliates',  'View affiliates across all diviners'),
  ('affiliate.view_own', 'View Own Affiliates',    'affiliates',  'View only own affiliate network'),
  ('affiliate.reassign', 'Reassign Affiliates',    'affiliates',  'Reassign affiliate to different diviner'),
  ('commission.view',    'View Commissions',       'commissions', 'View commission data'),
  ('commission.manage',  'Manage Commissions',     'commissions', 'Create and edit commission rules'),
  ('payout.view',        'View Payouts',           'commissions', 'View payout records'),
  ('payout.mark_paid',   'Mark Payouts Paid',      'commissions', 'Mark payout records as paid'),
  ('content.manage',     'Manage Content',         'content',     'Create and edit all platform content'),
  ('audit.view',         'View Audit Logs',        'platform',    'View system audit logs'),
  ('impersonation.use',  'Impersonate Users',      'platform',    'Log in as another user'),
  ('session.revoke',     'Revoke Sessions',        'platform',    'Force logout user sessions'),
  ('reports.view',       'View Reports',           'platform',    'Access operational reports'),
  ('diviner.manage',     'Manage Diviners',        'platform',    'Full diviner account management'),
  ('settings.manage',    'Manage Settings',        'platform',    'Modify platform settings')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. role_permissions (pivot: roles ↔ permissions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       uuid        NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid        NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- 3. invitations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invitations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text        NOT NULL,
  role_slug      text        NOT NULL,   -- references roles.slug
  invited_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  token_hash     text        NOT NULL UNIQUE,  -- sha256 / bcrypt hash of the raw token
  expires_at     timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at    timestamptz,
  cancelled_at   timestamptz,
  resent_count   integer     NOT NULL DEFAULT 0,
  last_resent_at timestamptz,
  status         text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  metadata       jsonb       DEFAULT '{}'::jsonb,  -- parent_diviner_id, commission setup, etc.
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invitations_email_idx      ON invitations(email);
CREATE INDEX IF NOT EXISTS invitations_status_idx     ON invitations(status);
CREATE INDEX IF NOT EXISTS invitations_token_hash_idx ON invitations(token_hash);

-- ---------------------------------------------------------------------------
-- 4. user_relationships (Diviner ↔ Affiliate hierarchy with full history)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_relationships (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type text        NOT NULL
    CHECK (relationship_type IN ('diviner_affiliate', 'mentor_trainee', 'admin_managed')),
  status            text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'transferred')),
  active_from       timestamptz NOT NULL DEFAULT now(),
  active_to         timestamptz,
  transferred_to    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,  -- new parent on reassignment
  notes             text,
  created_by        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_relationships_parent_idx      ON user_relationships(parent_user_id);
CREATE INDEX IF NOT EXISTS user_relationships_child_idx       ON user_relationships(child_user_id);
CREATE INDEX IF NOT EXISTS user_relationships_type_status_idx ON user_relationships(relationship_type, status);

-- ---------------------------------------------------------------------------
-- 5. user_security_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_security_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type   text        NOT NULL
    CHECK (event_type IN (
      'login_success', 'login_failed', 'password_changed', 'password_reset_requested',
      'password_reset_completed', 'email_verified', 'mfa_enabled', 'mfa_disabled',
      'mfa_reset', 'account_locked', 'account_unlocked', 'account_suspended',
      'account_activated', 'impersonation_start', 'impersonation_end',
      'session_revoked', 'all_sessions_revoked', 'invite_sent', 'invite_accepted',
      'role_changed', 'suspicious_login'
    )),
  ip_address   text,
  device_info  jsonb,
  metadata     jsonb       DEFAULT '{}'::jsonb,
  actor_user_id uuid       REFERENCES auth.users(id) ON DELETE SET NULL,  -- admin who triggered the action
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_security_events_user_idx    ON user_security_events(user_id);
CREATE INDEX IF NOT EXISTS user_security_events_type_idx    ON user_security_events(event_type);
CREATE INDEX IF NOT EXISTS user_security_events_created_idx ON user_security_events(created_at DESC);

-- ---------------------------------------------------------------------------
-- 6. communication_preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS communication_preferences (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_marketing           boolean     NOT NULL DEFAULT true,
  email_product_updates     boolean     NOT NULL DEFAULT true,
  email_security_alerts     boolean     NOT NULL DEFAULT true,
  email_booking_reminders   boolean     NOT NULL DEFAULT true,
  email_commission_updates  boolean     NOT NULL DEFAULT true,
  email_payout_alerts       boolean     NOT NULL DEFAULT true,
  email_newsletter          boolean     NOT NULL DEFAULT false,
  sms_booking_reminders     boolean     NOT NULL DEFAULT false,
  sms_security_alerts       boolean     NOT NULL DEFAULT false,
  push_enabled              boolean     NOT NULL DEFAULT false,
  unsubscribed_all          boolean     NOT NULL DEFAULT false,
  unsubscribed_at           timestamptz,
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. user_impersonation_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_impersonation_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  impersonated_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason           text        NOT NULL,
  started_at       timestamptz NOT NULL DEFAULT now(),
  ended_at         timestamptz,
  ip_address       text,
  actions_taken    jsonb       DEFAULT '[]'::jsonb  -- summary of what was done during session
);

CREATE INDEX IF NOT EXISTS impersonation_log_impersonator_idx ON user_impersonation_log(impersonator_id);
CREATE INDEX IF NOT EXISTS impersonation_log_impersonated_idx ON user_impersonation_log(impersonated_id);

-- ---------------------------------------------------------------------------
-- 8. diviners.account_status — richer lifecycle column (additive only)
-- ---------------------------------------------------------------------------
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN (
      'draft', 'invited', 'pending_verification', 'pending_approval',
      'active', 'suspended', 'locked', 'deactivated', 'archived'
    ));

-- Sync existing rows: if is_active = false, mark as suspended
UPDATE diviners
SET account_status = 'suspended'
WHERE is_active = false
  AND account_status = 'active';  -- only touch default value rows to avoid double-writes

-- ---------------------------------------------------------------------------
-- 9. Row Level Security
-- ---------------------------------------------------------------------------

-- permissions: publicly readable; admin-only writes
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'permissions'
      AND policyname = 'permissions_read_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "permissions_read_all"
        ON permissions FOR SELECT
        USING (true)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'permissions'
      AND policyname = 'permissions_admin_write'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "permissions_admin_write"
        ON permissions FOR ALL
        USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- role_permissions: publicly readable; admin-only writes
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'role_permissions'
      AND policyname = 'role_permissions_read_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "role_permissions_read_all"
        ON role_permissions FOR SELECT
        USING (true)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'role_permissions'
      AND policyname = 'role_permissions_admin_write'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "role_permissions_admin_write"
        ON role_permissions FOR ALL
        USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- invitations: admin full access
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'invitations'
      AND policyname = 'invitations_admin_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "invitations_admin_all"
        ON invitations FOR ALL
        USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- user_relationships: admin full; diviner reads own scope (parent or child)
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_relationships'
      AND policyname = 'user_relationships_admin_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "user_relationships_admin_all"
        ON user_relationships FOR ALL
        USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_relationships'
      AND policyname = 'user_relationships_diviner_read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "user_relationships_diviner_read"
        ON user_relationships FOR SELECT
        USING (parent_user_id = auth.uid() OR child_user_id = auth.uid())
    $p$;
  END IF;
END $$;

-- user_security_events: admin full; user reads own events
ALTER TABLE user_security_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_security_events'
      AND policyname = 'security_events_admin_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "security_events_admin_all"
        ON user_security_events FOR ALL
        USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_security_events'
      AND policyname = 'security_events_self_read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "security_events_self_read"
        ON user_security_events FOR SELECT
        USING (user_id = auth.uid())
    $p$;
  END IF;
END $$;

-- communication_preferences: admin full; user manages own row
ALTER TABLE communication_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'communication_preferences'
      AND policyname = 'comm_prefs_admin_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "comm_prefs_admin_all"
        ON communication_preferences FOR ALL
        USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'communication_preferences'
      AND policyname = 'comm_prefs_self_all'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "comm_prefs_self_all"
        ON communication_preferences FOR ALL
        USING (user_id = auth.uid())
    $p$;
  END IF;
END $$;

-- user_impersonation_log: admin read + insert only
ALTER TABLE user_impersonation_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_impersonation_log'
      AND policyname = 'impersonation_log_admin_read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "impersonation_log_admin_read"
        ON user_impersonation_log FOR SELECT
        USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'user_impersonation_log'
      AND policyname = 'impersonation_log_admin_insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "impersonation_log_admin_insert"
        ON user_impersonation_log FOR INSERT
        WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;
