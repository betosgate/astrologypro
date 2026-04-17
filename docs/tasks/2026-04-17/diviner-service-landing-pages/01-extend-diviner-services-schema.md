# Task 01 - Extend diviner_services Schema & Create Audit Log - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Backend
- Parent: `00-master-task.md`
- Phase: 1 - Data Layer Foundation
- Depends On: None
- Blocks: All subsequent tasks

## Goal

Extend the existing `diviner_services` table with enable/disable/publish controls. Add `template_id` FK to the `services` table. Create the `service_access_audit_log` table for tracking all changes.

## Current State

### diviner_services table (exists at `supabase/migrations/20260403000005_service_templates.sql`)
```sql
CREATE TABLE IF NOT EXISTS diviner_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE,
  template_id UUID REFERENCES service_templates(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(diviner_id, template_id)
);
```
Current RLS: `diviner_services_owner` policy allows diviner to see their own rows.

### services table (exists at `supabase/migrations/20260331000001_initial_schema.sql`)
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(20) CHECK (category IN ('astrology', 'tarot')),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  base_price DECIMAL(10,2),
  overage_rate DECIMAL(10,2) DEFAULT 0.50,
  is_primary BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  requires_birth_data BOOLEAN DEFAULT TRUE,
  trigger_event VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
**Problem:** No `template_id` FK. Template matching happens by slug (fragile).

## Implementation Steps

### Step 1: Create Supabase Migration File

**File to create:** `supabase/migrations/20260417000001_diviner_service_access_control.sql`

### Step 2: Extend diviner_services Table

Add these columns to `diviner_services`:

```sql
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
```

**Column definitions:**
| Column | Type | Purpose |
|---|---|---|
| is_enabled | BOOLEAN | Admin toggle - controls whether diviner can use this service |
| is_published | BOOLEAN | Whether the landing page is publicly visible |
| enabled_at | TIMESTAMPTZ | When the service was last enabled |
| disabled_at | TIMESTAMPTZ | When the service was last disabled |
| enabled_by | UUID | Who enabled it (admin user_id or diviner user_id during onboarding) |
| disabled_by | UUID | Who disabled it |
| publish_status | VARCHAR(20) | draft / published / unpublished / archived |
| published_at | TIMESTAMPTZ | When last published |
| unpublished_at | TIMESTAMPTZ | When last unpublished |
| notes | TEXT | Admin notes for why enabled/disabled |
| updated_at | TIMESTAMPTZ | Last modification timestamp |

### Step 3: Add template_id FK to services Table

```sql
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES service_templates(id) ON DELETE SET NULL;
```

**Why SET NULL on delete:** If a template is removed, the per-diviner service instance should survive but lose its template link. This prevents cascade deletion of diviner customizations.

### Step 4: Create service_access_audit_log Table

```sql
CREATE TABLE service_access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  service_template_id UUID REFERENCES service_templates(id) ON DELETE SET NULL,
  diviner_service_id UUID REFERENCES diviner_services(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL
    CHECK (action IN (
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
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_by_role VARCHAR(20) NOT NULL CHECK (performed_by_role IN ('admin', 'diviner', 'system')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying audit log by diviner
CREATE INDEX idx_audit_log_diviner ON service_access_audit_log(diviner_id, created_at DESC);

-- Index for querying audit log by admin user
CREATE INDEX idx_audit_log_performer ON service_access_audit_log(performed_by, created_at DESC);

-- Index for querying by action type
CREATE INDEX idx_audit_log_action ON service_access_audit_log(action, created_at DESC);
```

### Step 5: Add Indexes to diviner_services

```sql
-- Fast lookup: which services are enabled for a diviner
CREATE INDEX IF NOT EXISTS idx_diviner_services_enabled
  ON diviner_services(diviner_id, is_enabled)
  WHERE is_enabled = TRUE;

-- Fast lookup: which diviners have a specific template enabled
CREATE INDEX IF NOT EXISTS idx_diviner_services_template
  ON diviner_services(template_id, is_enabled)
  WHERE is_enabled = TRUE;

-- Fast lookup: published landing pages
CREATE INDEX IF NOT EXISTS idx_diviner_services_published
  ON diviner_services(diviner_id, is_published)
  WHERE is_published = TRUE;
```

### Step 6: Add updated_at Trigger

```sql
CREATE OR REPLACE FUNCTION update_diviner_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_diviner_services_updated_at
  BEFORE UPDATE ON diviner_services
  FOR EACH ROW
  EXECUTE FUNCTION update_diviner_services_updated_at();
```

### Step 7: RLS Policies

```sql
-- Enable RLS
ALTER TABLE service_access_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin can read all audit logs
CREATE POLICY audit_log_admin_read ON service_access_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Diviner can read their own audit logs
CREATE POLICY audit_log_diviner_read ON service_access_audit_log
  FOR SELECT
  USING (
    diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  );

-- Only server (service_role) can insert audit logs
CREATE POLICY audit_log_insert ON service_access_audit_log
  FOR INSERT
  WITH CHECK (TRUE);

-- Update existing diviner_services RLS: admin can read/write all
CREATE POLICY diviner_services_admin_all ON diviner_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Diviner can read their own (already exists, verify)
-- Diviner can update their own (for publish/customize, NOT for is_enabled)
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
```

**IMPORTANT RLS NOTE:** The `is_enabled` column should only be modifiable by admin. The RLS policy above allows diviner to update their own rows (for publish/customize), but the API layer must enforce that diviners cannot change `is_enabled`. This is enforced at the API route handler level, not RLS (Supabase RLS cannot do column-level restrictions on UPDATE).

### Step 8: Add Check Constraint for Data Integrity

```sql
-- A disabled service cannot be published
ALTER TABLE diviner_services
  ADD CONSTRAINT chk_disabled_not_published
  CHECK (
    (is_enabled = TRUE) OR (is_published = FALSE)
  );
```

This ensures: if admin disables a service, the landing page automatically cannot be in published state. The API must set `is_published = FALSE` when disabling.

## TypeScript Types to Create

**File:** `src/types/diviner-service.ts`

```typescript
export interface DivinerServiceRecord {
  id: string;
  diviner_id: string;
  template_id: string;
  price: number;
  is_enabled: boolean;
  is_published: boolean;
  enabled_at: string | null;
  disabled_at: string | null;
  enabled_by: string | null;
  disabled_by: string | null;
  publish_status: 'draft' | 'published' | 'unpublished' | 'archived';
  published_at: string | null;
  unpublished_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceAccessAuditEntry {
  id: string;
  diviner_id: string;
  service_template_id: string | null;
  diviner_service_id: string | null;
  action: ServiceAccessAction;
  performed_by: string;
  performed_by_role: 'admin' | 'diviner' | 'system';
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
}

export type ServiceAccessAction =
  | 'service_enabled'
  | 'service_disabled'
  | 'landing_page_published'
  | 'landing_page_unpublished'
  | 'landing_page_archived'
  | 'override_applied'
  | 'override_removed'
  | 'custom_content_updated'
  | 'link_copied'
  | 'link_shared'
  | 'route_changed';
```

## Verification Plan

1. Run migration against local Supabase: `supabase db reset` or `supabase migration up`
2. Verify `diviner_services` table has all new columns: `\d diviner_services` in psql
3. Verify `service_access_audit_log` table exists with correct schema
4. Verify `services.template_id` column exists
5. Verify indexes exist: `\di` in psql
6. Verify RLS policies: attempt to read audit log as diviner (should see only own), as admin (should see all)
7. Verify constraint: try to INSERT diviner_services row with `is_enabled = FALSE, is_published = TRUE` — must fail
8. Verify trigger: UPDATE a diviner_services row, check `updated_at` changed
9. Verify existing data is not affected: all existing diviner_services rows should have `is_enabled = TRUE` (default)

## Rollback Plan

```sql
ALTER TABLE diviner_services
  DROP COLUMN IF EXISTS is_enabled,
  DROP COLUMN IF EXISTS is_published,
  DROP COLUMN IF EXISTS enabled_at,
  DROP COLUMN IF EXISTS disabled_at,
  DROP COLUMN IF EXISTS enabled_by,
  DROP COLUMN IF EXISTS disabled_by,
  DROP COLUMN IF EXISTS publish_status,
  DROP COLUMN IF EXISTS published_at,
  DROP COLUMN IF EXISTS unpublished_at,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE services DROP COLUMN IF EXISTS template_id;

DROP TABLE IF EXISTS service_access_audit_log;
```

## Edge Cases

- Existing `diviner_services` rows must default to `is_enabled = TRUE` so current diviners are not broken
- `is_published` defaults to `FALSE` — existing landing pages will need a one-time publish action or a data backfill (decide in Phase 4)
- If a diviner has a `services` row but no `diviner_services` row, backfill task (Task 02) must handle this
