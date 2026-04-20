# Master Task - Diviner Service Landing Page Access Control & Publishing - 2026-04-17

> **START HERE:** Read `docs/tasks/2026-04-17/README.md` first. It contains the global execution order, critical rules, and codebase map that apply to ALL tasks.

- Status: Not Started
- Priority: P0
- Owner: Full Stack
- Module: Diviner Services + Landing Pages + Admin Controls
- PMS Type: Master Task
- Folder Path: `docs/tasks/2026-04-17/diviner-service-landing-pages`
- Task File: `docs/tasks/2026-04-17/diviner-service-landing-pages/00-master-task.md`
- Sprint Guide: `docs/tasks/2026-04-17/README.md`

## Goal

Build a complete service-based landing page access control system where diviners can only access, manage, view, share, and use landing pages for services explicitly enabled for them. Admin controls service enablement per diviner. Diviners select services during onboarding, admin can override after. Landing pages are data-driven and scalable beyond the current 19 services.

## Business Intent

- Each diviner works only with services they are authorized to offer
- System prevents accidental exposure of unavailable services
- Admins control service availability per diviner with audit trail
- Diviners use only relevant landing pages for sales, lead generation, booking, promotion
- Future service additions remain scalable (50+ services, A/B testing, localization)

## Architecture Decision: No Separate landing_pages Table

**Decision:** Do NOT create a separate `landing_pages` table. The existing `service_templates` table IS the landing page master list. The existing routes (`/services/[slug]` and `/[username]/services/[slug]`) ARE the landing pages.

**Reason:** The codebase already has:
- 19 service templates in `service_templates` table (seeded via `20260414000002_reseed_service_templates_catalog.sql`)
- Public landing pages at `/services/[slug]` (template-level) and `/[username]/services/[slug]` (diviner-level)
- `diviner_services` mapping table with `diviner_id`, `template_id`, `price`
- `services` table for per-diviner service instances
- Service landing library at `src/lib/service-landings.ts`

**Action:** Extend `diviner_services` with enable/disable/publish controls instead.

## Key Decisions (Confirmed by Product)

| # | Decision | Answer |
|---|---|---|
| 1 | Separate landing_pages table? | No. Extend diviner_services instead |
| 2 | URL Strategy | Keep existing: `/services/{slug}` + `/{username}/services/{slug}` |
| 3 | Diviner customization? | Yes. Diviners can customize banner, CTA, content per landing page |
| 4 | Who controls enablement? | Hybrid: Diviner selects during onboarding, admin can override after |
| 5 | Analytics depth? | Full: views, unique visitors, CTA clicks, leads, bookings, conversions |
| 6 | Can admin add new service templates? | Yes. Admin UI for creating/editing service templates |

## Existing Codebase Assets (Do NOT Rebuild)

| Asset | File Path | What It Does |
|---|---|---|
| Service templates (19) | `supabase/migrations/20260414000002_reseed_service_templates_catalog.sql` | Master list of all services |
| service_templates table | `supabase/migrations/20260331000001_initial_schema.sql` | DB schema for templates |
| services table | `supabase/migrations/20260331000001_initial_schema.sql` | Per-diviner service instances |
| diviner_services table | `supabase/migrations/20260403000005_service_templates.sql` | Diviner-to-template mapping (thin, needs extension) |
| Public service landing | `src/app/services/[slug]/page.tsx` | Generic landing page per service |
| Diviner service landing | `src/app/[username]/services/[slug]/page.tsx` | Diviner-specific service landing |
| Services hub | `src/app/services/page.tsx` | All services directory |
| Diviner services list | `src/app/[username]/services/page.tsx` | Diviner's services listing |
| Service landings library | `src/lib/service-landings.ts` | Data fetching for landing pages |
| Service commerce validation | `src/lib/service-commerce-validation.ts` | Validates service sellability |
| Public services filter | `src/lib/public-services.ts` | Filters visible public services |
| Role service packages | `src/lib/role-service-packages.ts` | Category-based access (astrology/tarot) |
| Service templates (code) | `src/lib/service-templates.ts` | Hardcoded template constants for UI |
| Diviner analytics | `src/lib/diviner-analytics.ts` | Activity event tracking |
| Admin service config | `src/app/admin/service-config/page.tsx` | Admin service management |
| Onboarding flow | `src/app/onboarding/page.tsx` | Diviner selects services at step 2 |
| Dashboard services | `src/app/dashboard/services/page.tsx` | Diviner manages their services |
| Public services API | `src/app/api/public/diviners/[username]/services/route.ts` | Public API for diviner services |
| Dashboard services API | `src/app/api/dashboard/services/route.ts` | Dashboard CRUD for services |
| Diviner publishing controls | `supabase/migrations/20260413000160_diviner_publish_controls.sql` | Publish/block system |

## Known Blockers to Resolve During Implementation

| Blocker | Severity | Detail | Resolution |
|---|---|---|---|
| Dual service tables | Medium | Both `services` and `diviner_services` exist with overlapping purpose. Onboarding writes to BOTH. | Make `diviner_services` the source of truth for "is this template enabled for this diviner." `services` table remains for per-diviner customized service instances (name, price, description overrides). |
| No template FK in services table | Medium | `services` table has no `template_id` column. Template matching uses slug (fragile). | Add `template_id` FK to `services` table. Backfill from slug matching against `service_templates`. |
| Onboarding flow conflict | Low | Onboarding lets diviners pick services freely. If admin must approve, onboarding needs to respect admin-enabled service list. | Decision: Hybrid. Diviner picks freely during onboarding, admin can override (disable) after. Onboarding creates `diviner_services` rows with `is_enabled = true` by default. |
| No audit infrastructure | Low | No generic audit log table exists for service assignment changes. | Create `service_access_audit_log` table. |
| Hardcoded templates in code | Low | `src/lib/service-templates.ts` has hardcoded arrays duplicating DB data. | Phase 2: Replace hardcoded arrays with DB queries from `service_templates`. Admin can then add templates via UI. |

## Child Tasks In Scope

### Phase 1 - Data Layer Foundation
1. `01-extend-diviner-services-schema.md` - Extend diviner_services table, add template_id to services, create audit log table
2. `02-backfill-template-ids-and-rls.md` - Backfill template_id in services table, add RLS policies

### Phase 2 - Admin Service Template Management
3. `03-admin-service-template-crud.md` - Admin UI + API to create/edit/delete service templates
4. `04-admin-diviner-service-assignment.md` - Admin screen to enable/disable services per diviner with toggles

### Phase 3 - Backend Access Control Enforcement
5. `05-enforce-service-access-backend.md` - Modify all service queries, APIs, and pages to check diviner_services.is_enabled

### Phase 4 - Modular Landing Page Builder: Backend
6. `06-diviner-landing-page-overrides.md` - Full modular page builder backend: section type registry, service_landing_pages + service_landing_page_sections tables, section CRUD APIs, drag-and-drop reorder, draft/preview/publish workflow, admin moderation, content sanitization

### Phase 5 - Modular Landing Page Builder: Frontend + Dashboard
7. `07-diviner-my-landing-pages-dashboard.md` - Landing pages list page + full page builder UI with drag-and-drop section management (@dnd-kit), per-type section editors (15 types), Tiptap rich text editing, image upload, preview mode, publish workflow, responsive layout

### Phase 6 - Analytics
8. `08-service-landing-page-analytics.md` - Full per-service per-diviner analytics with all metrics

## Delivery Expectations

1. No separate `landing_pages` table - extend existing infrastructure
2. All existing routes (`/services/[slug]`, `/[username]/services/[slug]`) continue working
3. Backend enforces access control - frontend hiding alone is NOT security
4. Admin can manage service templates and per-diviner assignments
5. Diviners see only enabled service landing pages in their dashboard
6. Full analytics tracking at service-level per diviner
7. Audit trail for all enable/disable/publish actions
8. Scalable to 50+ services without code changes

## Done Definition

- diviner_services table extended with enable/disable/publish controls
- services table has template_id FK with backfill complete
- Admin can create/edit service templates from UI
- Admin can enable/disable services per diviner with audit trail
- Backend enforces access on ALL service endpoints and pages
- Diviner dashboard shows "My Landing Pages" with preview, copy URL, analytics
- Diviners can customize landing page content (banner, CTA, content)
- Full analytics: views, unique visitors, CTA clicks, leads, bookings, conversions
- Public landing pages respect enabled/published state
- Onboarding flow creates diviner_services records correctly
- All 8 child tasks complete

## Verification Gate

1. Review each child task file before implementation
2. Execute in phase order (1 through 6)
3. After each phase, verify no regression in existing service/landing flows
4. Run security test: URL tampering, permission bypass, unauthorized API access
5. Run UAT: admin enables 3 services for new diviner -> diviner sees exactly 3 -> admin disables one -> diviner loses access immediately -> public users see only valid published pages
