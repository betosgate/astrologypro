-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260417000001_diviner_service_access_control.sql
-- Feature A – Task 01: Extend diviner_services + create audit log
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Extend diviner_services with access control columns ───────────────────

ALTER TABLE diviner_services
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enabled_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enabled_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS disabled_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) DEFAULT 'draft'
    CHECK (publish_status IN ('draft', 'published', 'unpublished', 'archived')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unpublished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── 2. Add template_id FK to services table ──────────────────────────────────

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES service_templates(id) ON DELETE SET NULL;

-- ── 3. Create service_access_audit_log table ─────────────────────────────────

CREATE TABLE IF NOT EXISTS service_access_audit_log (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id          UUID        NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  service_template_id UUID        REFERENCES service_templates(id) ON DELETE SET NULL,
  diviner_service_id  UUID        REFERENCES diviner_services(id)  ON DELETE SET NULL,
  action              VARCHAR(50) NOT NULL CHECK (action IN (
    'service_enabled',
    'service_disabled',
    'landing_page_published',
    'landing_page_unpublished',
    'landing_page_archived',
    'override_applied',
    'override_removed',
    'custom_content_updated',
    'link_copied',
    'link_shared',
    'route_changed'
  )),
  performed_by        UUID        NOT NULL REFERENCES auth.users(id),
  performed_by_role   VARCHAR(20) NOT NULL CHECK (performed_by_role IN ('admin', 'diviner', 'system')),
  old_value           JSONB,
  new_value           JSONB,
  reason              TEXT,
  ip_address          INET,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Indexes ────────────────────────────────────────────────────────────────

-- diviner_services: fast lookup of enabled services per diviner
CREATE INDEX IF NOT EXISTS idx_diviner_services_enabled
  ON diviner_services(diviner_id, is_enabled)
  WHERE is_enabled = TRUE;

-- diviner_services: fast lookup of diviners with a specific template enabled
CREATE INDEX IF NOT EXISTS idx_diviner_services_template
  ON diviner_services(template_id, is_enabled)
  WHERE is_enabled = TRUE;

-- diviner_services: fast lookup of published landing pages
CREATE INDEX IF NOT EXISTS idx_diviner_services_published
  ON diviner_services(diviner_id, is_published)
  WHERE is_published = TRUE;

-- audit log: by diviner (most common admin/diviner read pattern)
CREATE INDEX IF NOT EXISTS idx_audit_log_diviner
  ON service_access_audit_log(diviner_id, created_at DESC);

-- audit log: by admin performer
CREATE INDEX IF NOT EXISTS idx_audit_log_performer
  ON service_access_audit_log(performed_by, created_at DESC);

-- audit log: by action type
CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON service_access_audit_log(action, created_at DESC);

-- ── 5. updated_at trigger for diviner_services ───────────────────────────────

CREATE OR REPLACE FUNCTION update_diviner_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_diviner_services_updated_at ON diviner_services;

CREATE TRIGGER trg_diviner_services_updated_at
  BEFORE UPDATE ON diviner_services
  FOR EACH ROW
  EXECUTE FUNCTION update_diviner_services_updated_at();

-- ── 6. Check constraint: disabled service cannot be published ─────────────────

-- Drop first in case it already exists (idempotent)
ALTER TABLE diviner_services
  DROP CONSTRAINT IF EXISTS chk_disabled_not_published;

ALTER TABLE diviner_services
  ADD CONSTRAINT chk_disabled_not_published
  CHECK (
    (is_enabled = TRUE) OR (is_published = FALSE)
  );

-- ── 7. RLS on service_access_audit_log ───────────────────────────────────────

ALTER TABLE service_access_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin can read all audit logs
DROP POLICY IF EXISTS audit_log_admin_read ON service_access_audit_log;
CREATE POLICY audit_log_admin_read ON service_access_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Diviner can read their own audit logs
DROP POLICY IF EXISTS audit_log_diviner_read ON service_access_audit_log;
CREATE POLICY audit_log_diviner_read ON service_access_audit_log
  FOR SELECT
  USING (
    diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  );

-- Service role (admin client) can insert
DROP POLICY IF EXISTS audit_log_insert ON service_access_audit_log;
CREATE POLICY audit_log_insert ON service_access_audit_log
  FOR INSERT
  WITH CHECK (TRUE);

-- ── 8. Additional RLS on diviner_services ────────────────────────────────────

-- Admin full access
DROP POLICY IF EXISTS diviner_services_admin_all ON diviner_services;
CREATE POLICY diviner_services_admin_all ON diviner_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Diviner can update their own rows (for publish/customize — NOT is_enabled, enforced at API layer)
DROP POLICY IF EXISTS diviner_services_owner_update ON diviner_services;
CREATE POLICY diviner_services_owner_update ON diviner_services
  FOR UPDATE
  USING (
    diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  );
