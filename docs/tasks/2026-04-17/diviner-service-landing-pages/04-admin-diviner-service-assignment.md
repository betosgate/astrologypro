# Task 04 - Admin Diviner Service Assignment Screen - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Full Stack
- Parent: `00-master-task.md`
- Phase: 2 - Admin Service Template Management
- Depends On: Tasks 01, 02, 03
- Blocks: Task 05

## Goal

Build the admin screen where an admin can enable/disable services for a specific diviner using toggles. This is the primary admin control point for the entire landing page access system.

## Current State

- Admin diviner detail page exists at `src/app/admin/diviners/[id]/page.tsx`
- It already has tabs/sections for publishing controls, SEO, live platforms, voicemails
- No section exists for service assignment
- `diviner_services` table now has `is_enabled`, `enabled_by`, `enabled_at`, etc. (from Task 01)

## Implementation Steps

### Step 1: Admin API for Diviner Service Assignment

#### `src/app/api/admin/diviners/[id]/services/route.ts`

```
GET /api/admin/diviners/[id]/services
- Auth: admin only
- Returns: {
    diviner: { id, username, display_name },
    services: [
      {
        template_id: "uuid",
        template_name: "Nativity Birth Chart",
        template_slug: "nativity-birth-chart",
        template_category: "astrology",
        is_enabled: true,
        is_published: true,
        publish_status: "published",
        enabled_at: "2026-04-10T...",
        enabled_by: "admin-uuid",
        enabled_by_name: "Admin User",
        price: 175.00,
        notes: "Enabled during onboarding",
        has_custom_service: true,     // has a row in services table
        custom_service_id: "uuid",
        landing_page_url: "/luna/services/nativity-birth-chart",
        analytics_summary: {          // optional, quick stats
          total_views: 245,
          total_bookings: 12,
          last_30_days_views: 45
        }
      },
      ...all 19+ templates with their status for this diviner
    ]
  }
- Logic:
  1. Fetch all active service_templates
  2. LEFT JOIN with diviner_services for this diviner
  3. LEFT JOIN with services for custom service data
  4. Return merged list showing all templates with their assignment status
  Templates not assigned show: is_enabled: false, null dates
```

#### `POST /api/admin/diviners/[id]/services`

```
POST /api/admin/diviners/[id]/services
- Auth: admin only
- Body: {
    template_id: "uuid",
    price: 175.00,      // optional, defaults to template base_price
    notes: "string"     // optional
  }
- Action: Create a new diviner_services row with is_enabled = true
- Also creates a services row if one doesn't exist for this diviner+template
- Audit: log 'service_enabled'
- Returns: created diviner_services record
- Validation:
  - template must exist and be active
  - diviner must exist and be active
  - duplicate check: if diviner_services row already exists, return 409
  - category check: if diviner is restricted to astrology-only or tarot-only
    (via role_service_packages), reject template of wrong category
```

#### `PATCH /api/admin/diviners/[id]/services/[templateId]`

```
PATCH /api/admin/diviners/[id]/services/[templateId]
- Auth: admin only
- Body: {
    is_enabled: boolean,       // toggle on/off
    is_published: boolean,     // toggle publish
    publish_status: string,    // draft/published/unpublished/archived
    notes: string,             // admin note
    price: number              // optional price override
  }
- Logic:
  When disabling (is_enabled: false):
    - Set is_published = false (constraint: disabled cannot be published)
    - Set disabled_at = now()
    - Set disabled_by = admin user_id
    - Audit: log 'service_disabled' with old_value/new_value
  When enabling (is_enabled: true):
    - Set enabled_at = now()
    - Set enabled_by = admin user_id
    - Clear disabled_at, disabled_by
    - Audit: log 'service_enabled'
  When publishing (is_published: true):
    - Validate is_enabled = true first
    - Set publish_status = 'published'
    - Set published_at = now()
    - Audit: log 'landing_page_published'
  When unpublishing:
    - Set publish_status = 'unpublished'
    - Set unpublished_at = now()
    - Audit: log 'landing_page_unpublished'
- Returns: updated diviner_services record
```

#### Bulk Operations

```
POST /api/admin/diviners/[id]/services/bulk
- Auth: admin only
- Body: {
    action: "enable" | "disable" | "publish" | "unpublish",
    template_ids: ["uuid1", "uuid2", ...],
    notes: "string"
  }
- Applies the action to all specified templates for this diviner
- Audit: logs each change individually
- Returns: { updated: number, errors: [] }
```

#### Clone Service Setup

```
POST /api/admin/diviners/[id]/services/clone
- Auth: admin only
- Body: {
    source_diviner_id: "uuid",
    include_prices: boolean,    // copy prices or use template defaults
    include_publish: boolean    // copy publish state or default to draft
  }
- Copies all enabled diviner_services from source diviner to target
- Skips templates already assigned to target
- Audit: logs each new assignment
- Returns: { cloned: number, skipped: number }
```

### Step 2: Admin UI - Diviner Service Assignment Section

**File to create:** `src/app/admin/diviners/[id]/service-assignment.tsx`

This is a new component added to the existing diviner detail page.

**Layout:**

```
+------------------------------------------------------------------+
| Service Assignment                                                |
+------------------------------------------------------------------+
| Quick Actions: [Enable All] [Disable All] [Clone from Diviner v] |
| Filter: [All v] [Astrology v] [Tarot v] [Enabled v] [Disabled v] |
+------------------------------------------------------------------+
|                                                                   |
| ASTROLOGY SERVICES                                                |
| +---------+--------------------------------------+--------+------+|
| | Enabled | Service                              | Price  |Publish||
| +---------+--------------------------------------+--------+------+|
| | [ON]    | Nativity Birth Chart                 | $175   | [ON] ||
| |         | 90 min | Enabled Apr 10 by Admin      |        |      ||
| |         | Note: "Core service"                  |        |      ||
| |         | Views: 245 | Bookings: 12             |        |      ||
| |         | URL: /luna/services/nativity-birth-ch  [Copy] ||
| +---------+--------------------------------------+--------+------+|
| | [OFF]   | Solar Return (greyed out)             | $125   | --   ||
| |         | 60 min | Disabled Apr 15 by Admin      |        |      ||
| |         | Note: "Diviner not certified yet"      |        |      ||
| +---------+--------------------------------------+--------+------+|
| | [ON]    | Weekly Transits                       | $65    | [OFF]||
| |         | 30 min | Enabled Apr 10 by Self        |        |      ||
| |         | Status: Draft (not published yet)      |        |      ||
| +---------+--------------------------------------+--------+------+|
|                                                                   |
| TAROT SERVICES                                                    |
| +---------+--------------------------------------+--------+------+|
| | [ON]    | 3 Card Basic Question                | $35    | [ON] ||
| |         | 20 min | Enabled Apr 10 by Self        |        |      ||
| +---------+--------------------------------------+--------+------+|
| | [--]    | 5 Card Complex Question (not assigned)| --     | --   ||
| |         | [+ Assign to Diviner]                 |        |      ||
| +---------+--------------------------------------+--------+------+|
|                                                                   |
+------------------------------------------------------------------+
| Audit Log (last 10 changes)                                      |
| Apr 15 14:30 | Admin disabled Solar Return | "Not certified yet" |
| Apr 10 09:00 | Diviner enabled Nativity Birth Chart | Onboarding |
| ...                                                               |
+------------------------------------------------------------------+
```

**UI States per Service Template:**

| State | Enable Toggle | Publish Toggle | Visual |
|---|---|---|---|
| Not assigned | No toggle, show [+ Assign] button | Hidden | Light grey row |
| Assigned & Enabled | ON (green) | Visible | Normal row |
| Assigned & Disabled | OFF (red) | Hidden/greyed | Greyed row, strikethrough name |
| Enabled & Published | ON | ON (green) | Normal + "Published" badge |
| Enabled & Draft | ON | OFF (amber) | Normal + "Draft" badge |
| Enabled & Unpublished | ON | OFF (grey) | Normal + "Unpublished" badge |

**Toggle Behavior:**
- Enable toggle: immediate PATCH call, no confirmation needed
- Disable toggle: show confirmation dialog "This will unpublish the landing page and remove diviner access. Continue?"
- Publish toggle: immediate PATCH call
- [+ Assign] button: opens mini-form to set price and optional note, then POST

**Additional Features:**
- Each row shows: last enabled/disabled date and by whom
- Copy URL button per published service
- Quick stats (views, bookings) if analytics data exists
- Notes field editable inline
- Audit log section at bottom showing recent changes for this diviner

### Step 3: Integrate into Diviner Detail Page

**File to modify:** `src/app/admin/diviners/[id]/page.tsx`

Add the `ServiceAssignment` component as a new section/tab in the existing diviner detail page. Place it logically near or after the "Publishing Controls" section.

```tsx
import ServiceAssignment from './service-assignment';

// In the page component, add:
<ServiceAssignment divinerId={id} />
```

### Step 4: Add Admin Summary View

**File to modify:** Admin diviners list page (if exists) or create summary endpoint.

Add a column or indicator to the admin diviners list showing:
- Number of enabled services (e.g., "8/19 services")
- Quick visual indicator of service coverage

### Step 5: Audit Log API

**File to create:** `src/app/api/admin/diviners/[id]/services/audit-log/route.ts`

```
GET /api/admin/diviners/[id]/services/audit-log
- Auth: admin only
- Query params: ?limit=20&offset=0&action=&date_from=&date_to=
- Returns: paginated list of service_access_audit_log entries for this diviner
- Include: performer name, service template name
```

## Validation Rules

1. Admin auth required for ALL endpoints
2. Diviner must exist and ID must be valid UUID
3. Template must exist and be active to assign
4. Cannot enable a service if template is inactive
5. Cannot publish if service is disabled
6. Category restriction: if diviner has role_service_packages limiting to astrology-only or tarot-only, respect it
7. Duplicate prevention: UNIQUE(diviner_id, template_id) constraint handles this at DB level
8. Bulk operations: fail individually, don't rollback entire batch. Report per-item success/failure.

## Verification Plan

1. Admin sees all 19 templates for a diviner, with correct enabled/disabled state
2. Admin toggles enable ON for a new service → `diviner_services` row created, `services` row created
3. Admin toggles enable OFF → row updated, is_published set to false
4. Admin toggles publish ON → landing page becomes publicly visible
5. Admin toggles publish OFF → landing page hidden from public
6. Audit log shows all actions with correct actor, timestamp, old/new values
7. Bulk enable/disable works for multiple services at once
8. Clone copies service setup from one diviner to another
9. Category restrictions enforced (astrology-only diviner cannot get tarot services)
10. Enable All / Disable All buttons work correctly
11. Notes persist and display correctly
12. URL copy button works for published services

## Edge Cases

- Admin enables a service for a diviner who has no Stripe setup: allow enable, but service commerce validation will flag it. Landing page can exist but booking won't work until Stripe is ready.
- Admin disables a service that has active bookings: the disable should not cancel existing bookings. Only prevent new ones.
- Admin enables a service, diviner customizes it, admin disables it, admin re-enables it: diviner's customizations should persist across the disable/re-enable cycle.
- Two admins editing the same diviner's services simultaneously: last-write-wins. Consider adding a "last modified" indicator.
