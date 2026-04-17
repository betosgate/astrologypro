# Task 05 - Enforce Service Access Control in Backend - 2026-04-17

- Status: Not Started
- Priority: P0
- Owner: Full Stack
- Parent: `00-master-task.md`
- Phase: 3 - Backend Access Control Enforcement
- Depends On: Tasks 01, 02, 04
- Blocks: Tasks 06, 07, 08

## Goal

Modify ALL existing service-related queries, API routes, and page renders to enforce `diviner_services.is_enabled` and `diviner_services.is_published` checks. This is the MOST CRITICAL task — without this, the entire access control system is cosmetic.

## Core Principle

**Frontend hiding alone is NOT security. Every query and API must enforce access at the data layer.**

## Files That Must Be Modified

### 1. Public-Facing Pages

#### `src/app/[username]/services/page.tsx` — Diviner's Services Listing

**Current behavior:** Queries `services` table WHERE `diviner_id = X AND is_active = true`
**Required change:** Also check that each service's template has `diviner_services.is_enabled = true AND diviner_services.is_published = true`

**How:**
```
- Join services with diviner_services ON services.template_id = diviner_services.template_id
  AND diviner_services.diviner_id = services.diviner_id
- Add WHERE diviner_services.is_enabled = true AND diviner_services.is_published = true
- Services with template_id = NULL (custom freestyle services) continue to show
  based only on services.is_active (they're not template-managed)
```

#### `src/app/[username]/services/[slug]/page.tsx` — Diviner's Specific Service Detail

**Current behavior:** Fetches service by slug and diviner username
**Required change:** After fetching the service, validate:
1. Service exists and is_active
2. If service has template_id: check diviner_services mapping is_enabled AND is_published
3. If validation fails: return 404 page (NOT a generic error — security: don't reveal the page exists)

#### `src/app/services/[slug]/page.tsx` — Global Service Landing (shows all diviners)

**Current behavior:** Calls `getServiceLandingDiviners(slug)` which queries all diviners offering a service
**Required change:** Filter out diviners whose `diviner_services.is_enabled = false` or `is_published = false`

#### `src/app/services/page.tsx` — Services Hub

**Current behavior:** Lists all service templates
**Required change:** Only show templates where `service_templates.is_active = true`

### 2. Library Functions

#### `src/lib/service-landings.ts`

**Function: `getServiceLandingDiviners(serviceSlug)`**

This is the central function that powers `/services/[slug]`. Currently:
1. Queries `services` where `slug = serviceSlug` and `is_active = true`
2. Left joins `diviners`
3. Filters by `canPubliclySellService()`

**Required changes:**
```
- After step 1, also JOIN diviner_services:
  LEFT JOIN diviner_services ds
    ON ds.diviner_id = s.diviner_id
    AND ds.template_id = s.template_id
- Add to WHERE: (ds.is_enabled = true AND ds.is_published = true)
  OR s.template_id IS NULL  -- allow freestyle services
```

**Function: `getServiceLandingTemplates()`**

Currently queries all service_templates.

**Required change:** Filter by `is_active = true`

#### `src/lib/public-services.ts`

**Function: `filterVisiblePublicServices()`**

**Required change:** Accept `divinerId` parameter. When filtering services for a specific diviner, check `diviner_services` mapping.

#### `src/lib/service-commerce-validation.ts`

**Required change:** Add a validation check:
- If service has a template_id, verify diviner_services mapping exists and is_enabled
- If not enabled, add error: "Service template not enabled for this diviner"

### 3. API Routes

#### `src/app/api/public/diviners/[username]/services/route.ts`

**Current behavior:** Returns all active services for a diviner
**Required change:**
```
- Join with diviner_services ON template_id match
- Filter: only return services where diviner_services.is_enabled = true
  AND diviner_services.is_published = true
- OR services.template_id IS NULL (freestyle services)
```

#### `src/app/api/dashboard/services/route.ts`

**GET handler:**
**Current behavior:** Returns diviner's services for dashboard management
**Required change:**
- Still return all services (enabled and disabled) for dashboard view
- But add `is_enabled` and `is_published` flags from diviner_services to each service
- Diviner can see disabled services (greyed out) but cannot perform actions on them

**POST handler (create new service):**
**Required change:**
- When a diviner creates a new service from a template, check:
  1. The template exists and is active
  2. A diviner_services mapping exists and is_enabled = true for this template
  3. If not enabled, reject with 403: "This service is not enabled for your account"
- If creating a freestyle service (no template), allow it

**PATCH handler (update service):**
**Required change:**
- Before allowing update, check diviner_services.is_enabled = true for this service's template
- If disabled, reject with 403

**DELETE handler (deactivate service):**
**Required change:**
- Diviner can deactivate their service instance even if the template is disabled
- This only affects the `services` table, not `diviner_services`

#### `src/app/api/dashboard/services/[id]/route.ts`

Same PATCH/DELETE enforcement as above.

### 4. Booking Flow

#### `src/app/[username]/book/page.tsx` and `src/app/[username]/book/[serviceSlug]/page.tsx`

**Required change:**
- Before rendering the booking page, validate:
  1. Diviner exists and is active
  2. Service exists and is active
  3. If service has template_id: diviner_services.is_enabled AND is_published
- If validation fails: redirect to diviner's main page or show "Service unavailable" message

### 5. Onboarding Flow

#### `src/app/onboarding/page.tsx`

**Current behavior:** Shows all service templates, diviner selects freely
**Required change (Hybrid model):**
- Still show all active templates during onboarding
- When diviner selects services, create `diviner_services` rows with `is_enabled = true, enabled_by = self`
- This is the "diviner self-selects" part of the hybrid model
- Admin can override (disable) these later

## Implementation Pattern: Centralized Access Check

**PREREQUISITE:** The utility functions in `src/lib/diviner-service-access.ts` MUST be fully implemented in Task 02 before starting this task. They are not pseudocode — Task 02 provides complete TypeScript implementations of `checkDivinerServiceAccess()`, `isServicePubliclyAccessible()`, `isServiceDashboardAccessible()`, `getDivinerEnabledServices()`, `getDivinerPublishedLandingPages()`, and `getDivinerServiceAccessMap()`. Verify they exist and work before proceeding.

Use these shared utilities in ALL the files listed above:

```typescript
/**
 * For PUBLIC access: checks is_enabled AND is_published
 * Used by: public pages, public APIs, booking flow
 */
export async function isServicePubliclyAccessible(
  supabase: SupabaseClient,
  divinerId: string,
  serviceSlug: string
): Promise<boolean>

/**
 * For DASHBOARD access: checks only is_enabled
 * Used by: diviner dashboard, diviner APIs
 */
export async function isServiceDashboardAccessible(
  supabase: SupabaseClient,
  divinerId: string,
  templateId: string
): Promise<boolean>

/**
 * Get the access status for all services of a diviner
 * Returns a map of template_id -> { is_enabled, is_published, publish_status }
 * Used by: dashboard to render enabled/disabled states
 */
export async function getDivinerServiceAccessMap(
  supabase: SupabaseClient,
  divinerId: string
): Promise<Map<string, ServiceAccessStatus>>
```

## Security Validation Checklist

These tests MUST pass before this task is marked done:

| # | Test | Expected Result |
|---|---|---|
| 1 | Diviner with disabled service visits `/{username}/services/{slug}` | 404 page |
| 2 | Diviner with enabled but unpublished service: public user visits URL | 404 page |
| 3 | Diviner with enabled and published service: public user visits URL | Service page renders |
| 4 | Direct API call `GET /api/public/diviners/{username}/services` for diviner with 3/19 enabled | Returns only 3 services |
| 5 | Diviner tries to create service via dashboard API for disabled template | 403 Forbidden |
| 6 | Diviner tries to update service via dashboard API for disabled template | 403 Forbidden |
| 7 | URL tampering: change service slug in URL to a disabled service | 404 page |
| 8 | Booking flow for disabled service | Redirect away, booking blocked |
| 9 | Global `/services/{slug}` page | Only shows diviners with enabled+published services |
| 10 | Freestyle service (no template) on diviner page | Shows normally (not affected by template access) |

## Verification Plan

1. Identify ALL files that query `services` or `service_templates` tables — grep the codebase
2. For each file, add the access control check
3. Run all security tests from the checklist above
4. Verify no regression: existing published services continue to work
5. Verify onboarding still works: new diviner can select and use services immediately
6. Verify admin override: admin disables a service → immediately inaccessible publicly

## Edge Cases

- Service with `template_id = NULL` (freestyle/custom): exempt from template access control, governed only by `services.is_active`
- Diviner has services row but no diviner_services row (pre-backfill edge): Task 02 backfill should have caught this, but add a fallback that treats missing mapping as "not enabled"
- Service was published, then disabled by admin, then shared link is clicked: must return 404
- Race condition: admin disables service while diviner is mid-booking: the booking confirmation step must re-validate access
- Cached pages: if using ISR or static generation, ensure revalidation happens when access changes. Consider using `revalidateTag()` or `revalidatePath()` when admin changes access.
