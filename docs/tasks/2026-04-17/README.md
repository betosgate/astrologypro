# Implementation Guide — 2026-04-17 Sprint

## READ THIS FIRST

You are implementing two connected features for the AstrologyPro Next.js app. This document is your single source of truth for execution order, rules, and context. Read it completely before touching any code.

**App location:** `/home/this-pc/Documents/Indra/Beto Project/astrologypro/`
**Stack:** Next.js 13 (App Router), Supabase (PostgreSQL), TypeScript, Tailwind, shadcn/ui
**Database:** Supabase — migrations live in `supabase/migrations/`
**Auth:** Supabase Auth — admin check via `getAdminUser()` in `src/lib/admin-auth.ts`, diviner check via `src/lib/user-roles.ts`
**Project rules:** Read `CLAUDE.md` at the repo root for engineering standards. They are non-negotiable.

---

## What You Are Building

### Feature A: Diviner Service Landing Page Access Control
**Folder:** `diviner-service-landing-pages/`
**Summary:** A diviner can only access landing pages for services explicitly enabled by an admin. Admin toggles services on/off per diviner. Backend enforces access. Diviners get a dashboard to manage their landing pages.

### Feature B: Campaign Destination Selection + Click Tracking
**Folder:** `campaign-destination-tracking/`
**Summary:** When a diviner creates a campaign, they pick a destination (their profile page OR one of their enabled service landing pages). System generates a trackable URL. Every click is logged with full attribution.

### Feature B depends on Feature A. You MUST build Feature A first (at minimum Tasks 01-05) before starting Feature B.

### Verification Follow-Ups
**Task file:** `verification-followups.md`
**Summary:** Bugs and missing items found during local verification after the feature implementation. Complete these before marking the sprint done.

---

## Global Execution Order (Follow This Exactly)

There are 13 child tasks across both features. Execute them in this exact sequence. Do NOT skip ahead. Each task's file contains the full specification.

```
STEP  TASK FILE                                                    WHAT IT DOES
────  ─────────────────────────────────────────────────────────    ──────────────────────────────────────────
 1    diviner-service-landing-pages/01-extend-diviner-services-schema.md
      → Supabase migration: add is_enabled, is_published, audit log table, indexes, RLS, triggers to diviner_services

 2    diviner-service-landing-pages/02-backfill-template-ids-and-rls.md
      → Supabase migration: backfill template_id in services table, sync diviner_services, create utility functions

 3    diviner-service-landing-pages/03-admin-service-template-crud.md
      → Admin UI + API to create/edit/delete service templates (replaces hardcoded arrays in src/lib/service-templates.ts)

 4    diviner-service-landing-pages/04-admin-diviner-service-assignment.md
      → Admin screen to enable/disable services per diviner with toggles, bulk ops, clone, audit log

 5    diviner-service-landing-pages/05-enforce-service-access-backend.md
      → *** CRITICAL *** Modify ALL service queries, APIs, and pages to check diviner_services.is_enabled

 6    diviner-service-landing-pages/06-diviner-landing-page-overrides.md
      → MODULAR PAGE BUILDER BACKEND: section type registry (15 types), service_landing_pages + service_landing_page_sections tables, section CRUD APIs, reorder/toggle/publish endpoints, draft/preview/publish workflow, admin moderation, content sanitization, public page rendering with dynamic section-renderer

 7    diviner-service-landing-pages/07-diviner-my-landing-pages-dashboard.md
      → MODULAR PAGE BUILDER FRONTEND: landing pages list + full drag-and-drop page builder UI (@dnd-kit), 15 section editor components, Tiptap rich text editing, image/gallery/video upload, add-section picker, publish workflow dialog, preview mode, responsive layout, builder state management

 8    diviner-service-landing-pages/08-service-landing-page-analytics.md
      → Full per-service per-diviner analytics: views, clicks, bookings, conversions, funnels

--- FEATURE A COMPLETE (all 8 tasks done). START FEATURE B BELOW. ---
--- NOTE: Campaign Tasks need LP Tasks 01-03 at minimum. Tasks 04-08 are recommended but not strictly blocking. ---
--- MIGRATION ORDER: All LP migrations (000001-000004, 000007) must run BEFORE campaign migrations (000010+). ---

 9    campaign-destination-tracking/01-extend-campaigns-with-destinations.md
      → Supabase migration: add destination columns to affiliate_campaigns, create campaign_clicks table, auto-pause trigger

10    campaign-destination-tracking/02-destination-selection-api.md
      → Destination options API, campaign create/update validation, status transitions, campaign code generation

11    campaign-destination-tracking/03-extend-tracking-redirect.md
      → Rewrite /r/[code] with rich click logging, entity-based URL resolution, unique click logic, bot filtering

12    campaign-destination-tracking/04-update-campaign-creation-ui.md
      → Add destination picker to campaign form, campaign URL display, copy button, auto-pause indicators

13    campaign-destination-tracking/05-campaign-destination-analytics.md
      → Campaign click analytics, destination performance comparison, admin reporting, charts
```

---

## How To Read Each Task File

Every task file follows the same structure:

| Section | What It Tells You |
|---|---|
| **Status / Priority / Depends On / Blocks** | Metadata — check "Depends On" before starting |
| **Goal** | One paragraph — what this task achieves |
| **Current State** | What exists RIGHT NOW in the codebase. Read this to understand the starting point. |
| **Implementation Steps** | Numbered steps with exact code, SQL, file paths, API contracts. Follow these. |
| **Verification Plan** | How to test. Run every check after implementation. |
| **Edge Cases** | Scenarios that will break if not handled. Handle all of them. |
| **Rollback Plan** | How to undo if something goes wrong. |

---

## Critical Rules — Read Before Every Task

### Rule 1: Do NOT Rebuild What Already Exists

The codebase has extensive existing infrastructure. The task files list what exists under "Current State" or "Existing Assets." If a table, route, component, or library already exists — **extend it, do not create a parallel version.**

**Already exists — DO NOT recreate:**
- `affiliate_campaigns` table (migration `20260413000005`) — extend with destination columns
- `tracking_links` table (migration `20260331000001`) — extend with campaign fields
- `/r/[code]` redirect route (`src/app/r/[code]/route.ts`) — extend with rich logging
- `/api/ref/[slug]` affiliate redirect (`src/app/api/ref/[slug]/route.ts`) — leave untouched
- Campaign CRUD APIs (`src/app/api/dashboard/campaigns/`) — extend with destination fields
- Campaign dashboard UI (`src/app/dashboard/campaigns/`) — extend with destination picker
- Admin campaign UI (`src/app/admin/campaigns/`) — extend with destination columns
- Rate limiting (`src/lib/rate-limit.ts`) — reuse it
- Bot detection (`src/proxy.ts`) — reuse the regex pattern
- Attribution tracking (`src/lib/diviner-analytics.ts`) — reuse the patterns
- Page tracker (`src/components/landing/page-tracker.tsx`) — extend with service-level tracking
- `diviner_services` table (migration `20260403000005`) — extend with new columns
- `service_templates` table (migration `20260331000001`) — extend with admin fields
- Service landing pages (`src/app/services/[slug]/page.tsx`, `src/app/[username]/services/[slug]/page.tsx`) — modify, don't recreate
- Onboarding (`src/app/onboarding/page.tsx`) — modify service selection step
- `diviner_activity_events` table (migration `20260413000170`) — extend with service fields

### Rule 2: Backward Compatibility Is Mandatory

All new columns must be nullable or have defaults. Existing data must not break. Existing APIs must continue to work for callers that don't send the new fields. Test by loading existing pages and using existing features AFTER your changes.

### Rule 3: No Separate landing_pages Table

The decision was made: service templates ARE landing pages. The routes `/services/[slug]` and `/[username]/services/[slug]` ARE the landing pages. The `diviner_services` table controls access. Do NOT create a `landing_pages` table.

### Rule 4: Entity-Based Destination, Not URL-Based

Campaign destinations are stored as entity IDs (`destination_profile_id`, `destination_service_template_id`), NOT as raw URLs. URLs are resolved at runtime from entity IDs. This survives username changes, slug changes, and service renames.

### Rule 5: Backend Enforces Access, Not Frontend

Frontend hiding is UX. Backend validation is security. Every API endpoint and server-rendered page that serves service data MUST check `diviner_services.is_enabled` (and `is_published` for public access). If you add a frontend filter, you MUST also add the backend check. Task 05 lists every file that needs modification.

### Rule 6: Campaign Code Format

Campaign codes use the format `cmp_` + 8 alphanumeric characters (Base62, excluding ambiguous chars 0/O/1/l/I). Example: `cmp_8FK29XQ`. Generated via `generate_campaign_code()` SQL function or TypeScript equivalent.

### Rule 7: Auto-Pause on Service Disable

When admin disables a service for a diviner (sets `diviner_services.is_enabled = false`), a database trigger automatically pauses all active campaigns pointing to that service. The trigger is created in campaign Task 01. The API validates this in campaign Task 02.

### Rule 8: Migration File Naming and Order

Supabase migrations must be named with timestamps. Use this pattern:
```
supabase/migrations/20260417NNNNNN_description.sql
```

**Exact migration sequence (run in this order):**
```
20260417000001_diviner_service_access_control.sql     (LP Task 01)
20260417000002_backfill_template_ids.sql               (LP Task 02)
20260417000003_extend_service_templates.sql             (LP Task 03)
20260417000004_landing_page_builder.sql                 (LP Task 06)
20260417000007_service_analytics.sql                    (LP Task 08)
20260417000010_campaign_destinations_and_clicks.sql     (Campaign Task 01 — MUST run after 000001)
```
LP Tasks 04, 05, 07 have no migrations (API/UI changes only).
Campaign Tasks 02-05 have no migrations (API/UI changes only).
Do NOT change these filenames — they are referenced across multiple task files.

### Rule 9: RLS Policies

Every new table must have Row Level Security enabled. Every task file specifies the exact RLS policies to create. Do not skip RLS.

### Rule 10: Audit Logging

Service enable/disable, publish/unpublish, and campaign destination changes must be logged in the `service_access_audit_log` table (created in landing page Task 01). Use the action types defined in the task file.

---

## Existing Codebase Map — Key Files You Will Touch

### Database Migrations (extend these tables)
```
supabase/migrations/20260331000001_initial_schema.sql          → services, tracking_links, service_templates tables
supabase/migrations/20260403000005_service_templates.sql       → diviner_services table
supabase/migrations/20260413000005_affiliate_campaigns.sql     → affiliate_campaigns, campaign_affiliates, campaign_conversions
supabase/migrations/20260413000170_diviner_activity_analytics.sql → diviner_activity_events, page_views
supabase/migrations/20260414000002_reseed_service_templates_catalog.sql → 19 service template seeds
```

### Library Files (modify/extend)
```
src/lib/service-landings.ts            → Add diviner_services access checks
src/lib/service-templates.ts           → Replace hardcoded arrays with DB queries
src/lib/service-commerce-validation.ts → Add enabled check
src/lib/public-services.ts             → Add enabled + published checks
src/lib/role-service-packages.ts       → Category-based access (leave as-is, just reference it)
src/lib/diviner-analytics.ts           → Add service-level event fields
src/lib/campaign-defaults.ts           → Add destination fields to defaults
src/lib/rate-limit.ts                  → Reuse for tracking redirect
```

### Library Files (create new)
```
src/lib/diviner-service-access.ts      → Central access check utility (Task 02)
src/lib/landing-page-section-types.ts  → Section type registry with Zod schemas (Task 06)
src/lib/landing-page-builder.ts        → Page init, publish, compose logic (Task 06)
src/lib/html-sanitizer.ts              → Server-side HTML sanitization for XSS prevention (Task 06)
src/lib/campaign-click-logger.ts       → Click parsing and logging (Campaign Task 03)
src/lib/campaign-destination-resolver.ts → Entity-based URL resolution (Campaign Task 03)
src/types/diviner-service.ts           → TypeScript types (Task 01)
src/types/landing-page-builder.ts      → Page builder types (Task 06)
src/types/campaign-destination.ts      → Campaign types (Campaign Task 01)
```

### API Routes (modify)
```
src/app/api/dashboard/services/route.ts              → Add is_enabled check
src/app/api/dashboard/services/[id]/route.ts         → Add is_enabled check
src/app/api/public/diviners/[username]/services/route.ts → Filter by is_enabled + is_published
src/app/api/dashboard/campaigns/route.ts             → Add destination fields to create/list
src/app/api/dashboard/campaigns/[id]/route.ts        → Add destination to detail/update
src/app/api/admin/campaigns/route.ts                 → Add destination to admin views
src/app/api/admin/campaigns/[id]/route.ts            → Add admin destination override
src/app/r/[code]/route.ts                            → Rewrite with rich click logging
```

### API Routes (create new)
```
-- Admin service templates --
src/app/api/admin/service-templates/route.ts         → Template CRUD (Task 03)
src/app/api/admin/service-templates/[id]/route.ts    → Template detail (Task 03)

-- Admin diviner services --
src/app/api/admin/diviners/[id]/services/route.ts    → Diviner service assignment (Task 04)
src/app/api/admin/diviners/[id]/services/audit-log/route.ts → Audit log (Task 04)

-- Page builder APIs --
src/app/api/dashboard/landing-pages/route.ts         → Landing pages list (Task 07)
src/app/api/dashboard/landing-pages/[templateId]/sections/route.ts → Section CRUD: GET all, POST new (Task 06)
src/app/api/dashboard/landing-pages/[templateId]/sections/[sectionId]/route.ts → Section: GET, PATCH, DELETE (Task 06)
src/app/api/dashboard/landing-pages/[templateId]/sections/reorder/route.ts → Batch reorder sections (Task 06)
src/app/api/dashboard/landing-pages/[templateId]/sections/[sectionId]/toggle/route.ts → Toggle visibility (Task 06)
src/app/api/dashboard/landing-pages/[templateId]/publish/route.ts → Publish / unpublish page (Task 06)
src/app/api/dashboard/landing-pages/[templateId]/preview/route.ts → Preview draft content (Task 06)
src/app/api/dashboard/landing-pages/[templateId]/upload/route.ts → Image upload for sections (Task 06)

-- Admin moderation + edit on behalf --
src/app/api/admin/landing-pages/moderation/route.ts  → Moderation queue (Task 06)
src/app/api/admin/landing-pages/moderation/[targetId]/route.ts → Approve/flag/reject (Task 06)
src/app/api/admin/landing-pages/section-types/route.ts → Manage section types (Task 06)
src/app/api/admin/landing-pages/[landingPageId]/sections/route.ts → Admin: GET/POST sections on behalf (Task 06)
src/app/api/admin/landing-pages/[landingPageId]/sections/[sectionId]/route.ts → Admin: GET/PATCH section on behalf (Task 06)
src/app/api/admin/landing-pages/[landingPageId]/publish/route.ts → Admin: publish/unpublish on behalf (Task 06)

-- Analytics --
src/app/api/dashboard/landing-pages/[templateId]/analytics/route.ts → Per-service analytics (Task 08)
src/app/api/analytics/landing-page-event/route.ts    → Public event tracking (Task 08)
src/app/api/admin/analytics/landing-pages/route.ts   → Admin analytics (Task 08)

-- Campaign destination --
src/app/api/dashboard/campaigns/destinations/route.ts → Destination options (Campaign Task 02)
src/app/api/dashboard/campaigns/[id]/analytics/route.ts → Campaign analytics (Campaign Task 05)
src/app/api/dashboard/campaigns/[id]/clicks/route.ts → Click list (Campaign Task 05)
src/app/api/admin/campaigns/analytics/route.ts       → Admin campaign analytics (Campaign Task 05)
```

### NPM Packages to Install
```bash
# Required for Task 06 (page builder):
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities sanitize-html
npm install -D @types/sanitize-html

# Required for Campaign Task 03 (user-agent parsing):
npm install ua-parser-js
npm install -D @types/ua-parser-js
```

### Pages (modify)
```
src/app/[username]/services/page.tsx                 → Add access control check
src/app/[username]/services/[slug]/page.tsx          → Add access control + override content
src/app/[username]/book/[serviceSlug]/page.tsx       → Add access control check
src/app/services/page.tsx                            → Filter inactive templates
src/app/services/[slug]/page.tsx                     → Filter disabled diviners
src/app/onboarding/page.tsx                          → Set diviner_services fields correctly
src/app/dashboard/campaigns/page.tsx                 → Add destination picker + URL display
src/app/dashboard/campaigns/[id]/page.tsx            → Add destination detail section
src/app/admin/campaigns/page.tsx                     → Add destination columns
src/app/admin/diviners/[id]/page.tsx                 → Add service assignment section
```

### Pages (create new)
```
src/app/admin/service-templates/page.tsx             → Template list (Task 03)
src/app/admin/service-templates/[id]/page.tsx        → Template edit (Task 03)
src/app/admin/service-templates/new/page.tsx         → Template create (Task 03)
src/app/dashboard/landing-pages/page.tsx             → Landing pages list (Task 07)
src/app/dashboard/landing-pages/[templateId]/builder/page.tsx → Page builder UI (Task 07)
src/app/dashboard/landing-pages/[templateId]/analytics/page.tsx → Analytics (Task 08)
src/app/admin/analytics/landing-pages/page.tsx       → Admin analytics (Task 08)
src/app/admin/campaigns/analytics/page.tsx           → Admin campaign analytics (Campaign Task 05)
src/app/dashboard/campaigns/[id]/analytics/page.tsx  → Campaign analytics (Campaign Task 05)
```

### Components (create new)
```
-- Landing page list components --
src/components/dashboard/landing-page-card.tsx
src/components/dashboard/landing-page-filters.tsx
src/components/dashboard/landing-page-summary.tsx
src/components/dashboard/landing-page-empty-state.tsx

-- Page builder components --
src/components/dashboard/builder/builder-context.tsx
src/components/dashboard/builder/section-list.tsx
src/components/dashboard/builder/section-list-item.tsx
src/components/dashboard/builder/section-editor-panel.tsx
src/components/dashboard/builder/add-section-dialog.tsx
src/components/dashboard/builder/publish-dialog.tsx
src/components/dashboard/builder/page-settings-panel.tsx
src/components/dashboard/builder/builder-toolbar.tsx

-- Section editors (one per type, 15 total) --
src/components/dashboard/builder/section-editors/hero-editor.tsx
src/components/dashboard/builder/section-editors/pricing-editor.tsx
src/components/dashboard/builder/section-editors/booking-cta-editor.tsx
src/components/dashboard/builder/section-editors/bio-editor.tsx
src/components/dashboard/builder/section-editors/expertise-editor.tsx
src/components/dashboard/builder/section-editors/text-content-editor.tsx
src/components/dashboard/builder/section-editors/image-banner-editor.tsx
src/components/dashboard/builder/section-editors/cta-editor.tsx
src/components/dashboard/builder/section-editors/faq-editor.tsx
src/components/dashboard/builder/section-editors/video-embed-editor.tsx
src/components/dashboard/builder/section-editors/testimonials-editor.tsx
src/components/dashboard/builder/section-editors/gallery-editor.tsx
src/components/dashboard/builder/section-editors/rich-content-editor.tsx
src/components/dashboard/builder/section-editors/whats-included-editor.tsx
src/components/dashboard/builder/section-editors/who-its-for-editor.tsx

-- Public landing page section renderers (one per type, 15 total) --
src/components/landing/section-renderer.tsx
src/components/landing/preview-banner.tsx
src/components/landing/sections/hero-section.tsx
src/components/landing/sections/bio-section.tsx
src/components/landing/sections/expertise-section.tsx
src/components/landing/sections/text-content-section.tsx
src/components/landing/sections/image-banner-section.tsx
src/components/landing/sections/cta-section.tsx
src/components/landing/sections/faq-section.tsx
src/components/landing/sections/video-embed-section.tsx
src/components/landing/sections/testimonials-section.tsx
src/components/landing/sections/gallery-section.tsx
src/components/landing/sections/rich-content-section.tsx
src/components/landing/sections/whats-included-section.tsx
src/components/landing/sections/who-its-for-section.tsx
src/components/landing/sections/pricing-section.tsx
src/components/landing/sections/booking-cta-section.tsx

-- Campaign components --
src/components/dashboard/campaign-destination-picker.tsx
src/components/dashboard/campaign-url-display.tsx
src/components/dashboard/campaign-auto-pause-banner.tsx
src/components/dashboard/campaign-destination-badge.tsx

-- Admin components --
src/app/admin/diviners/[id]/service-assignment.tsx
```

---

## Verification After Each Task

After completing each task:

1. **Run `supabase db reset`** if you created migrations — verify no SQL errors
2. **Check existing pages still work:**
   - `/services` — loads service directory
   - `/[username]/services/[slug]` — loads diviner service page
   - `/dashboard/campaigns` — loads campaign list
   - `/admin/campaigns` — loads admin campaign list
3. **Run the verification plan** listed in the task file — every item
4. **Check backward compatibility** — existing data and flows must not break
5. **Only then move to the next task**

---

## If Something Goes Wrong

- Each task file has a **Rollback Plan** section with exact SQL to undo changes
- Supabase migrations can be rolled back: `supabase migration repair --status reverted`
- Git: commit after each task so you can revert individual tasks
- If a migration fails: read the error, fix the SQL, re-run. Do NOT skip the migration.

---

## Questions You Should NOT Need To Ask

These decisions are already made. Do not re-ask or override them:

| Decision | Answer | Where It's Documented |
|---|---|---|
| Separate landing_pages table? | NO — extend diviner_services | Master task (landing pages) |
| URL pattern | Keep `/{username}/services/{slug}` | Master task (landing pages) |
| New campaigns table? | NO — extend affiliate_campaigns | Master task (campaigns) |
| New redirect route? | NO — extend `/r/[code]` | Master task (campaigns) |
| Service disabled → campaign? | Auto-pause | Master task (campaigns) |
| Campaign code format | `cmp_` + 8 alphanumeric chars | Master task (campaigns) |
| Who controls service enablement? | Hybrid: diviner selects at onboarding, admin overrides | Master task (landing pages) |
| Can admin add service templates? | Yes, via UI | Task 03 (landing pages) |
| Diviner can customize landing page? | Yes (banner, CTA, content) | Task 06 (landing pages) |
| Analytics depth | Full: views, unique visitors, CTA clicks, leads, bookings, conversions | Task 08 (landing pages) |

---

## Start Here

1. Read this README completely _(you just did)_
2. Read `CLAUDE.md` at the repo root for engineering standards
3. Open `diviner-service-landing-pages/01-extend-diviner-services-schema.md`
4. Follow the implementation steps exactly
5. Run the verification plan
6. Move to task 02
7. Continue in order through all 13 tasks
