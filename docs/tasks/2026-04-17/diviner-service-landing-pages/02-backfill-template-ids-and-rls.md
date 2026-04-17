# Task 02 - Backfill template_id in services & Sync diviner_services - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Backend
- Parent: `00-master-task.md`
- Phase: 1 - Data Layer Foundation
- Depends On: Task 01
- Blocks: Tasks 03-08

## Goal

Backfill `template_id` in the `services` table by matching slugs to `service_templates`. Ensure every diviner with active services also has corresponding `diviner_services` rows. Fix the data so both tables are in sync.

## Problem

Currently:
1. `services` table has no `template_id` — template matching is by slug (fragile)
2. Some diviners may have `services` rows but no `diviner_services` rows (created before the mapping table existed)
3. Some diviners may have `diviner_services` rows but the `services` rows were manually edited/deleted

## Implementation Steps

### Step 1: Create Migration File

**File:** `supabase/migrations/20260417000002_backfill_template_ids.sql`

### Step 2: Backfill template_id in services Table

```sql
-- Match services to service_templates by slug
UPDATE services s
SET template_id = st.id
FROM service_templates st
WHERE s.slug = st.slug
  AND s.template_id IS NULL;
```

**Important:** Some services may have custom slugs that don't match any template. These will remain with `template_id = NULL` — this is expected for custom/freestyle services.

### Step 3: Sync diviner_services from services Table

For diviners who have `services` rows but no `diviner_services` mapping:

```sql
-- Insert diviner_services rows for existing services that have a template match
INSERT INTO diviner_services (diviner_id, template_id, price, is_enabled, enabled_at, enabled_by)
SELECT DISTINCT
  s.diviner_id,
  s.template_id,
  s.base_price,
  TRUE,           -- enabled since they already had the service
  s.created_at,   -- use original service creation date
  (SELECT user_id FROM diviners WHERE id = s.diviner_id)  -- self-enabled
FROM services s
WHERE s.template_id IS NOT NULL
  AND s.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM diviner_services ds
    WHERE ds.diviner_id = s.diviner_id
      AND ds.template_id = s.template_id
  );
```

### Step 4: Set is_published for Existing Active Services

For existing diviner_services rows where the diviner already has an active, public-facing service, auto-publish:

```sql
-- Auto-publish existing active services so they don't break
UPDATE diviner_services ds
SET
  is_published = TRUE,
  publish_status = 'published',
  published_at = now()
WHERE ds.is_enabled = TRUE
  AND EXISTS (
    SELECT 1 FROM services s
    WHERE s.diviner_id = ds.diviner_id
      AND s.template_id = ds.template_id
      AND s.is_active = TRUE
  );
```

**Why:** Without this, all existing landing pages would become invisible after access control enforcement (Task 05). This backfill ensures continuity.

### Step 5: Verification Queries

Run these after migration to validate:

```sql
-- Check: how many services rows got a template_id
SELECT
  COUNT(*) AS total_services,
  COUNT(template_id) AS with_template,
  COUNT(*) - COUNT(template_id) AS without_template
FROM services;

-- Check: orphaned services (no template match) — these are custom services
SELECT id, diviner_id, name, slug
FROM services
WHERE template_id IS NULL AND is_active = TRUE;

-- Check: diviner_services coverage
SELECT
  d.id AS diviner_id,
  d.username,
  COUNT(DISTINCT s.id) AS service_count,
  COUNT(DISTINCT ds.id) AS mapping_count
FROM diviners d
LEFT JOIN services s ON s.diviner_id = d.id AND s.is_active = TRUE
LEFT JOIN diviner_services ds ON ds.diviner_id = d.id AND ds.is_enabled = TRUE
GROUP BY d.id, d.username
HAVING COUNT(DISTINCT s.id) != COUNT(DISTINCT ds.id);

-- Check: all published mappings have corresponding active services
SELECT ds.id, ds.diviner_id, ds.template_id, ds.is_published
FROM diviner_services ds
WHERE ds.is_published = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM services s
    WHERE s.diviner_id = ds.diviner_id
      AND s.template_id = ds.template_id
      AND s.is_active = TRUE
  );
```

### Step 6: Create Utility Functions for Service Access Check

**File:** `src/lib/diviner-service-access.ts`

**IMPORTANT:** These functions MUST be fully implemented in this task (not left as pseudocode). Tasks 05, 07, and Campaign Tasks 02-03 all depend on these being real, working functions.

This is the single source of truth for checking whether a diviner has access to a service landing page.

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { DivinerServiceRecord } from '@/types/diviner-service';

/**
 * Check if a diviner has access to a specific service template.
 * Returns the diviner_services record if access is granted, null otherwise.
 *
 * Access is granted when:
 * 1. diviner_services row exists for (diviner_id, template_id)
 * 2. is_enabled = true
 * 3. Optionally: is_published = true (for public access)
 */
export async function checkDivinerServiceAccess(
  supabase: SupabaseClient,
  divinerId: string,
  templateId: string,
  requirePublished: boolean = false
): Promise<DivinerServiceRecord | null> {
  let query = supabase
    .from('diviner_services')
    .select('*')
    .eq('diviner_id', divinerId)
    .eq('template_id', templateId)
    .eq('is_enabled', true);

  if (requirePublished) {
    query = query.eq('is_published', true);
  }

  const { data } = await query.maybeSingle();
  return data;
}

/**
 * Check if a service is publicly accessible for a diviner.
 * Used by public pages and booking flow.
 * Checks: diviner_services.is_enabled AND is_published
 * Also handles freestyle services (template_id = null) which are always accessible if active.
 */
export async function isServicePubliclyAccessible(
  supabase: SupabaseClient,
  divinerId: string,
  serviceSlug: string
): Promise<boolean> {
  // 1. Get the service record
  const { data: service } = await supabase
    .from('services')
    .select('id, template_id, is_active')
    .eq('diviner_id', divinerId)
    .eq('slug', serviceSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (!service) return false;

  // 2. Freestyle services (no template) are accessible if active
  if (!service.template_id) return true;

  // 3. Template-based services must be enabled AND published
  const access = await checkDivinerServiceAccess(supabase, divinerId, service.template_id, true);
  return access !== null;
}

/**
 * Check if a service is accessible from the diviner dashboard.
 * Dashboard access requires only is_enabled (not is_published).
 */
export async function isServiceDashboardAccessible(
  supabase: SupabaseClient,
  divinerId: string,
  templateId: string
): Promise<boolean> {
  const access = await checkDivinerServiceAccess(supabase, divinerId, templateId, false);
  return access !== null;
}

/**
 * Get all enabled services for a diviner.
 * Used by diviner dashboard "My Landing Pages" section.
 */
export async function getDivinerEnabledServices(
  supabase: SupabaseClient,
  divinerId: string
): Promise<DivinerServiceWithTemplate[]> {
  const { data } = await supabase
    .from('diviner_services')
    .select(`
      *,
      service_templates (id, name, slug, category, description, base_price, duration_minutes, is_primary, requires_birth_data, trigger_event, sort_order)
    `)
    .eq('diviner_id', divinerId)
    .eq('is_enabled', true)
    .order('created_at', { ascending: true });

  return data || [];
}

/**
 * Get all published landing pages for a diviner.
 * Used by public-facing pages.
 */
export async function getDivinerPublishedLandingPages(
  supabase: SupabaseClient,
  divinerId: string
): Promise<DivinerServiceWithTemplate[]> {
  const { data } = await supabase
    .from('diviner_services')
    .select(`
      *,
      service_templates (id, name, slug, category, description, base_price, duration_minutes, is_primary, requires_birth_data, trigger_event, sort_order)
    `)
    .eq('diviner_id', divinerId)
    .eq('is_enabled', true)
    .eq('is_published', true)
    .order('created_at', { ascending: true });

  return data || [];
}

/**
 * Get the access status for all services of a diviner.
 * Returns a map of template_id -> { is_enabled, is_published, publish_status }
 * Used by: dashboard to render enabled/disabled states
 */
export async function getDivinerServiceAccessMap(
  supabase: SupabaseClient,
  divinerId: string
): Promise<Map<string, { is_enabled: boolean; is_published: boolean; publish_status: string }>> {
  const { data } = await supabase
    .from('diviner_services')
    .select('template_id, is_enabled, is_published, publish_status')
    .eq('diviner_id', divinerId);

  const map = new Map();
  for (const row of data || []) {
    map.set(row.template_id, {
      is_enabled: row.is_enabled,
      is_published: row.is_published,
      publish_status: row.publish_status,
    });
  }
  return map;
}

// Type for joined query results
export interface DivinerServiceWithTemplate {
  id: string;
  diviner_id: string;
  template_id: string;
  price: number;
  is_enabled: boolean;
  is_published: boolean;
  publish_status: string;
  enabled_at: string | null;
  disabled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  service_templates: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string | null;
    base_price: number;
    duration_minutes: number;
    is_primary: boolean;
    requires_birth_data: boolean;
    trigger_event: string | null;
    sort_order: number;
  };
}
```

### Step 7: Update Onboarding to Set Correct Fields

**File to modify:** `src/app/onboarding/page.tsx`

When onboarding inserts into `diviner_services`, it must now set:
- `is_enabled = true`
- `enabled_at = now()`
- `enabled_by = auth.uid()`
- `is_published = true` (auto-publish on onboarding selection — diviner chose it)
- `publish_status = 'published'`
- `published_at = now()`

When onboarding inserts into `services`, it must now set:
- `template_id = selected template's UUID`

## Verification Plan

1. Run migration on local Supabase
2. Execute all verification queries from Step 5 — no mismatches should exist
3. Verify existing public landing pages still render correctly at `/[username]/services/[slug]`
4. Verify onboarding creates both `diviner_services` and `services` rows with correct new fields
5. Test `checkDivinerServiceAccess()` with:
   - Enabled service → returns record
   - Disabled service → returns null
   - Non-existent mapping → returns null
   - Published check → respects is_published flag

## Rollback Plan

The backfill is additive only:
- `template_id` values can be set back to NULL
- New `diviner_services` rows can be identified by `enabled_at` timestamp and removed
- `is_published` and `publish_status` can be reset

## Edge Cases

- Services with custom slugs not matching any template: `template_id` stays NULL, these are freestyle services not managed by the template system
- Diviner with services in `diviner_services` but service was deleted from `services` table: the mapping row persists, dashboard shows template info, diviner can re-create the service instance
- Multiple services for same template from same diviner (e.g., created twice): only one `diviner_services` row due to UNIQUE constraint, backfill picks the first match
