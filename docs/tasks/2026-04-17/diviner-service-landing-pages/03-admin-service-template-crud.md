# Task 03 - Admin Service Template CRUD UI & API - 2026-04-17

- Status: Not Started
- Priority: P1
- Owner: Full Stack
- Parent: `00-master-task.md`
- Phase: 2 - Admin Service Template Management
- Depends On: Tasks 01, 02
- Blocks: Task 04

## Goal

Build an admin UI and API that allows admins to create, edit, activate/deactivate, and reorder the master service templates. This replaces the hardcoded seed migration with a dynamic, UI-managed approach.

## Current State

- 19 service templates exist in `service_templates` table (seeded via migration)
- `src/lib/service-templates.ts` has hardcoded `ASTROLOGY_TEMPLATES` and `TAROT_TEMPLATES` arrays used for onboarding UI
- `src/app/admin/service-config/page.tsx` exists but manages per-diviner `services`, NOT the master `service_templates`
- No admin UI exists to manage the `service_templates` table directly

## Implementation Steps

### Step 1: Extend service_templates Table

**Migration file:** `supabase/migrations/20260417000003_extend_service_templates.sql`

Add columns for admin management:

```sql
ALTER TABLE service_templates
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon_name VARCHAR(50),
  ADD COLUMN IF NOT EXISTS color VARCHAR(7),
  ADD COLUMN IF NOT EXISTS long_description TEXT,
  ADD COLUMN IF NOT EXISTS whats_included TEXT[],
  ADD COLUMN IF NOT EXISTS who_its_for TEXT[],
  ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(70),
  ADD COLUMN IF NOT EXISTS seo_description VARCHAR(160),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
```

**Column purposes:**
| Column | Purpose |
|---|---|
| is_active | Admin can deactivate a template without deleting it |
| display_order | Controls ordering in UI (replaces sort_order if different) |
| icon_name | Icon identifier for UI rendering |
| color | Hex color for service cards |
| long_description | Extended description for landing pages |
| whats_included | Array of bullet points for "What's Included" section |
| who_its_for | Array of bullet points for "Who This Is For" section |
| faq | JSON array of {question, answer} objects |
| seo_title | SEO title override for the service landing page |
| seo_description | SEO description override |
| created_by | Admin who created this template |
| updated_at | Last modification timestamp |
| updated_by | Admin who last modified |

### Step 2: Admin API Routes

**Files to create:**

#### `src/app/api/admin/service-templates/route.ts`

```
GET /api/admin/service-templates
- Auth: admin only (getAdminUser())
- Query params: ?search=&category=&is_active=&sort_by=&sort_dir=
- Returns: all service templates with pagination
- Include: count of diviners using each template (from diviner_services)

POST /api/admin/service-templates
- Auth: admin only
- Body: { name, slug, category, description, long_description, duration_minutes,
          base_price, overage_rate, is_primary, requires_birth_data, trigger_event,
          display_order, icon_name, color, whats_included, who_its_for, faq,
          seo_title, seo_description }
- Validation:
  - name: required, max 100 chars
  - slug: required, unique, kebab-case only (regex: ^[a-z0-9]+(-[a-z0-9]+)*$)
  - category: required, must be 'astrology' or 'tarot'
  - duration_minutes: required, positive integer
  - base_price: required, positive decimal
- Returns: created template record
- Audit: log 'template_created' (use a general admin action log or separate)
```

#### `src/app/api/admin/service-templates/[id]/route.ts`

```
GET /api/admin/service-templates/[id]
- Auth: admin only
- Returns: full template detail including diviner count, diviner list

PATCH /api/admin/service-templates/[id]
- Auth: admin only
- Body: partial update of any template field
- Validation: same rules as POST for provided fields
- Slug change: if slug changes, must check no active services reference old slug
  (warn admin, don't silently break)
- Returns: updated template record
- Audit: log changes with old_value/new_value

DELETE /api/admin/service-templates/[id]
- Auth: admin only
- Validation: cannot delete if any diviner_services rows reference this template
  with is_enabled = true. Return 409 Conflict with list of affected diviners.
- Soft delete: set is_active = false instead of actual DELETE
- Returns: { success: true, deactivated: true }
```

### Step 3: Admin UI Page

**File to create:** `src/app/admin/service-templates/page.tsx`

**Layout:**
```
+------------------------------------------------------------------+
| Service Templates                              [+ Add Template]  |
+------------------------------------------------------------------+
| Search: [____________]  Category: [All v]  Status: [All v]       |
+------------------------------------------------------------------+
| # | Name                    | Category | Duration | Price | Active| Diviners | Actions |
|---|-------------------------|----------|----------|-------|-------|----------|---------|
| 1 | Nativity Birth Chart    | Astrology| 90 min   | $175  |  Yes  |    12    | Edit    |
| 2 | Solar Return            | Astrology| 60 min   | $125  |  Yes  |     8    | Edit    |
| 3 | 3 Card Basic Question   | Tarot    | 20 min   | $35   |  Yes  |    15    | Edit    |
|...|                         |          |          |       |       |          |         |
+------------------------------------------------------------------+
```

**Features:**
- Table view of all templates with sortable columns
- Search by name
- Filter by category (astrology/tarot) and status (active/inactive)
- "Diviners" column shows count of diviners with this template enabled
- Click row or "Edit" to open edit form
- "+ Add Template" button opens create form
- Drag to reorder (updates display_order)

### Step 4: Admin Template Create/Edit Form

**File to create:** `src/app/admin/service-templates/[id]/page.tsx` (edit)
**File to create:** `src/app/admin/service-templates/new/page.tsx` (create)

**Form fields:**
```
Service Template: [Create / Edit]

Basic Info:
  Name:              [_______________________________]
  Slug:              [_______________________________] (auto-generated from name, editable)
  Category:          [Astrology v]
  Description:       [_______________________________]
                     [_______________________________]
  Long Description:  [Rich text editor________________]

Pricing & Duration:
  Base Price ($):    [______]
  Overage Rate ($/min): [______]
  Duration (minutes): [______]

Configuration:
  [x] Is Primary
  [ ] Requires Birth Data
  Trigger Event:     [None v] (solar_return, jupiter_return, saturn_return, etc.)

Display:
  Icon:              [Select icon v]
  Color:             [#______ ] [color picker]
  Display Order:     [______]

Landing Page Content:
  What's Included:   [+ Add bullet]
    - [____________________________________] [x remove]
    - [____________________________________] [x remove]
  Who This Is For:   [+ Add bullet]
    - [____________________________________] [x remove]
  FAQ:               [+ Add Q&A]
    Q: [____________________________________]
    A: [____________________________________]

SEO:
  SEO Title:         [____________________________________] (max 70 chars)
  SEO Description:   [____________________________________] (max 160 chars)

Status:
  [x] Active
  
                                              [Cancel] [Save Template]
```

### Step 5: Replace Hardcoded Templates in Code

**File to modify:** `src/lib/service-templates.ts`

Replace the hardcoded `ASTROLOGY_TEMPLATES`, `TAROT_TEMPLATES`, `ALL_SERVICE_TEMPLATES` arrays with a function that fetches from the `service_templates` table:

```typescript
/**
 * Fetch all active service templates from the database.
 * Replaces the old hardcoded arrays.
 * Cached for 5 minutes since templates rarely change.
 */
export async function getActiveServiceTemplates(): Promise<ServiceTemplate[]> {
  // Query service_templates WHERE is_active = true ORDER BY display_order
}

/**
 * Fetch templates by category.
 */
export async function getServiceTemplatesByCategory(
  category: 'astrology' | 'tarot'
): Promise<ServiceTemplate[]> {
  // Query service_templates WHERE category = X AND is_active = true
}
```

**Files that import from `src/lib/service-templates.ts` and need updating:**
- `src/app/onboarding/page.tsx` (service selection step)
- Any other component using `ASTROLOGY_TEMPLATES` or `TAROT_TEMPLATES`

Search the codebase for all imports of `service-templates` to find every consumer.

### Step 6: Add Navigation Link

Add "Service Templates" to the admin sidebar/navigation at the appropriate location.

**File to modify:** Admin layout or navigation component (find the admin nav component, likely in `src/app/admin/` layout or a shared component).

## Validation Rules (Server-Side, Non-Negotiable)

1. Slug must be unique across all service_templates
2. Slug must be kebab-case: `/^[a-z0-9]+(-[a-z0-9]+)*$/`
3. Name must be non-empty, max 100 characters
4. Category must be exactly 'astrology' or 'tarot'
5. Duration must be positive integer
6. Base price must be positive decimal
7. Cannot delete (deactivate) a template that has active diviners using it without warning
8. Slug change must warn about potential URL breakage

## Verification Plan

1. Admin can view all 19 existing templates in the list
2. Admin can create a new template (20th service) with all fields
3. Admin can edit an existing template — changes persist
4. Admin can deactivate a template — it disappears from onboarding selection
5. Admin cannot delete a template that has active diviner mappings
6. Onboarding now loads templates from DB, not hardcoded array
7. New template appears in onboarding service selection immediately
8. Search, filter, and sort work correctly in the list view

## Edge Cases

- Creating a template with a slug that matches an existing deactivated template: should reactivate instead of creating duplicate
- Changing a template's category (astrology -> tarot): must check if any diviners are restricted to one category via `role_service_packages`
- Admin creates template while another admin is editing: last-write-wins with `updated_at` check (optimistic concurrency)
