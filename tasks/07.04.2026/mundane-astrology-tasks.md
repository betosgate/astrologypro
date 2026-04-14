# Mundane Astrology Dashboard — Task Breakdown
> Generated: 2026-04-14 | Source: mundane-astrology-dashboard-requirements.txt

---

## PHASE 1 — MVP

---

### M01 · Auth & RBAC

| # | Task | Layer |
|---|------|-------|
| M01-1 | Create `workspaces` table (id, name, owner_id, settings jsonb, tradition enum western/vedic/hybrid) | DB |
| M01-2 | Create `workspace_members` table (workspace_id, user_id, role enum: super_admin/admin/astrologer/researcher/editor/client/viewer) | DB |
| M01-3 | Create `audit_logs` table (id, user_id, workspace_id, action, entity_type, entity_id, diff jsonb, created_at) | DB |
| M01-4 | Seed default roles and permissions matrix | DB |
| M01-5 | `POST /api/workspaces` — create workspace, auto-add creator as admin | API |
| M01-6 | `POST /api/workspaces/:id/invite` — invite member by email, assign role | API |
| M01-7 | `GET /api/workspaces/:id/members` — list members with roles | API |
| M01-8 | RBAC middleware: enforce role check on every API route (page/action/data level) | API |
| M01-9 | Audit log writer utility — call on every create/update/delete mutation | API |
| M01-10 | Workspace selector UI — create/switch workspace from top nav | UI |
| M01-11 | Invite member UI — modal with email + role selector | UI |
| M01-12 | Members settings page — list, change role, remove member | UI |
| M01-13 | MFA/OTP setup page (optional in MVP — stub with "coming soon" if not wiring) | UI |

---

### M02 · Dashboard Home

| # | Task | Layer |
|---|------|-------|
| M02-1 | `GET /api/dashboard/mundane/summary` — returns today's events, active alerts, watched entity count, open projects | API |
| M02-2 | Dashboard home page `/dashboard/mundane` — shell with widget grid layout | UI |
| M02-3 | Widget: Today's astronomical events (ingresses, lunations, stations from event calendar) | UI |
| M02-4 | Widget: Active alerts count + top 3 alerts | UI |
| M02-5 | Widget: Watched countries/entities list with current signal badge | UI |
| M02-6 | Widget: Open research projects list | UI |
| M02-7 | Widget: Recent notes (last 5, linked to project) | UI |
| M02-8 | Widget: Upcoming forecast windows (next 7 days) | UI |
| M02-9 | Tradition view toggle (Western / Vedic / Hybrid) — stored in workspace settings | UI |

---

### M03 · Country / Entity Registry

| # | Task | Layer |
|---|------|-------|
| M03-1 | `mundane_entities` table — fully supports: name, type, region, continent, lat, lng, timezone, capital, tags, active, notes, source_refs | DB ✅ |
| M03-2 | `mundane_entity_charts` table — chart_title, chart_type, event_date, event_time, timezone, is_primary, notes, chart_url | DB ✅ |
| M03-3 | Index: `entity_charts(entity_id, is_primary)` | DB ✅ |
| M03-4 | `GET /api/mundane/entities` — list with filters: type, region, active, search | API ✅ |
| M03-5 | `POST /api/mundane/entities` — create entity | API ✅ |
| M03-6 | `PATCH /api/mundane/entities/:id` — update entity | API ✅ |
| M03-7 | `GET /api/mundane/entities/:id` — entity detail with charts and events | API ✅ |
| M03-8 | `POST /api/mundane/entities/:id/charts` — add chart record | API |
| M03-9 | `PATCH /api/mundane/entities/:id/charts/:chartId` — update chart | API |
| M03-10 | `POST /api/mundane/entities/:id/charts/:chartId/set-primary` — mark as primary | API |
| M03-11 | Entity registry list page | UI ✅ (admin) |
| M03-12 | Entity detail page — profile + charts + signals + events + notes tabs | UI ✅ (admin) |
| M03-13 | Add/edit entity form | UI ✅ (admin) |
| M03-14 | Chart record form — chart_type, datetime+timezone, source, confidence, primary flag | UI |
| M03-15 | Alternative charts panel — list, set primary, compare buttons | UI |

---

### M04 · Chart Studio — Basic (MVP)

| # | Task | Layer |
|---|------|-------|
| M04-1 | `chart_calculations` table — inputs, outputs, house_system, zodiac_type, engine_version | DB |
| M04-2 | `chart_snapshots` table — label, user_id, chart_calc_id | DB |
| M04-3 | Swiss Ephemeris or compatible lib — dedicated server-side domain module | API |
| M04-4 | `POST /api/mundane/entities/:id/calculate-chart` — compute + store positions | API |
| M04-5 | `POST /api/charts/compare` — bi/tri-wheel merged data | API |
| M04-6 | `GET /api/charts/:id/aspects` — aspect table with orbs | API |
| M04-7 | Chart studio page `/admin/mundane/chart-studio` | UI ✅ (shell + wheel renderer) |
| M04-8 | SVG natal wheel renderer — planets, houses, aspects, glyphs | UI ✅ |
| M04-9 | Bi-wheel renderer | UI |
| M04-10 | Aspect table panel | UI ✅ |
| M04-11 | Planetary dignities / condition summary panel | UI |
| M04-12 | Chart-specific notes panel | UI |
| M04-13 | Export chart PNG/SVG/PDF | UI |
| M04-14 | Save chart snapshot | UI |
| M04-15 | House system + zodiac + ayanamsa config panel | UI |

---

### M05 · Astronomical Event Calendar

| # | Task | Layer |
|---|------|-------|
| M05-1 | `mundane_astro_events` table — event_type, planet_primary, planet_secondary, sign, event_datetime_utc | DB ✅ |
| M05-2 | Index: `astro_events(event_datetime_utc, event_type)` | DB ✅ |
| M05-3 | Event generation job — pre-calculate ingresses, lunations, eclipses for 12 months | API |
| M05-4 | `GET /api/mundane/astro-events` — date range + type filter | API ✅ |
| M05-5 | `POST /api/mundane/astro-events` — manually add custom event | API |
| M05-6 | `PUT /api/mundane/astro-events/:id/link-entity` — link event to entity | API |
| M05-7 | Calendar page — monthly grid | UI ✅ (admin) |
| M05-8 | Calendar — week and day view | UI |
| M05-9 | Calendar — timeline band view | UI |
| M05-10 | Calendar — filter panel: event type, planet, tradition | UI ✅ |
| M05-11 | Event detail drawer | UI |

---

### M06 · Forecast Journal

| # | Task | Layer |
|---|------|-------|
| M06-1 | `mundane_forecasts` table with outcome_status, confidence_level, narrative, astro_basis | DB ✅ |
| M06-2 | `forecast_evidence` table (chart_calc_id, event_id, note) | DB |
| M06-3 | `POST /api/mundane/forecasts` — create forecast | API ❌ missing |
| M06-4 | `PATCH /api/mundane/forecasts/:id` — update + outcome tracking | API |
| M06-5 | `GET /api/mundane/forecasts` — list with filters | API ✅ |
| M06-6 | `GET /api/mundane/forecasts/:id` — detail with evidence | API |
| M06-7 | Forecast journal list page | UI ✅ (admin) |
| M06-8 | Create forecast form | UI ✅ (admin) |
| M06-9 | Forecast detail page | UI |
| M06-10 | Outcome status update flow | UI |

---

### M07 · Research Workspace

| # | Task | Layer |
|---|------|-------|
| M07-1 | `mundane_research_projects` table | DB ✅ |
| M07-2 | `mundane_project_notes` table | DB ✅ |
| M07-3 | `POST /api/mundane/projects` — create project | API ✅ |
| M07-4 | `PATCH /api/mundane/projects/:id` — update | API ✅ |
| M07-5 | `GET /api/mundane/projects` — list | API ✅ |
| M07-6 | `POST /api/mundane/projects/:id/notes` — add note | API ✅ |
| M07-7 | `DELETE /api/mundane/projects/:id/notes/:noteId` — delete note | API ❌ missing |
| M07-8 | Research project list page | UI ✅ (admin) |
| M07-9 | Project workspace page — notes + entity panel | UI ✅ (admin) |
| M07-10 | Rich text notes editor | UI ✅ |
| M07-11 | Attach entity/chart/forecast to project | UI |
| M07-12 | Task checklist within note | UI |

---

### M08 · Alerts & Watchlists (Basic)

| # | Task | Layer |
|---|------|-------|
| M08-1 | `mundane_watchlists` table | DB ✅ |
| M08-2 | `alert_rules` table | DB |
| M08-3 | `alert_notifications` table | DB |
| M08-4 | `GET/PATCH /api/mundane/watchlist` — get or update watchlist | API ✅ |
| M08-5 | `GET /api/alerts` — list notifications | API |
| M08-6 | Alert evaluation job | API |
| M08-7 | Watchlist management page | UI |
| M08-8 | Alert center page | UI |
| M08-9 | Alert bell in nav | UI |

---

### M09 · Leader Registry

| # | Task | Layer |
|---|------|-------|
| M09-1 | `mundane_leaders` table | DB ✅ |
| M09-2 | `GET /api/mundane/leaders` — list | API ✅ |
| M09-3 | `POST /api/mundane/leaders` — create leader | API ❌ missing |
| M09-4 | `PATCH /api/mundane/leaders/:id` — update | API |
| M09-5 | Leaders list page | UI ✅ (admin) |
| M09-6 | Create leader form | UI ✅ (admin) |
| M09-7 | Leader detail page — bio, office timeline, charts | UI |
| M09-8 | Leader ↔ entity chart compare in studio | UI |

---

## PHASE 2

### P2-01 · World Map Intelligence ✅ (basic shell built)
- Missing: Time slider, signal scoring overlay, eclipse path overlay

### P2-02 · Forecast Scoring Engine
- Missing: scoring_models table, entity_stress_scores table, score API, score timeline UI

### P2-03 · Advanced Search ✅ (admin search page built)
- Missing: Full-text pg_trgm index, saved searches

### P2-04 · Report Builder
- Missing: publications table, report builder page, PDF generation, share links

---

## PHASE 3

### P3-01 · Backtesting Engine
- Missing: backtest_runs table, backtest job, results UI

### P3-02 · Vedic / Hybrid Calculation Pack
- Missing: Vedic calc pack, varshaphal chart type, nakshatra overlay, panchanga panel

### P3-03 · External Feeds & Import
- Missing: imports table, CSV import flow, mapping UI

### P3-04 · Client / Subscriber Portal
- Missing: client viewer role, subscriber dashboard, subscription gate

### P3-05 · AI Assistance
- Missing: summarize-notes API, weekly-brief API, AI output display

---

## PHASE 4

### P4-01 · Advanced Geo Overlays
### P4-02 · Market / Weather / Agriculture Intelligence
### P4-03 · Historical Analog Engine
### P4-04 · Large-Scale Publication Workflows

---

## Cross-Cutting (All Phases)

| # | Task | Status |
|---|------|--------|
| CC-1 | Calculation domain module — server-side only, versioned | Partial (stub calculation) |
| CC-2 | All chart calcs store inputs + outputs + engine_version | Missing |
| CC-3 | Deterministic ORDER BY (created_at DESC, id DESC) on all queries | ✅ Done |
| CC-4 | RBAC middleware on all API routes | Partial |
| CC-5 | Rate limiting on public endpoints | Missing |
| CC-6 | Background job system for: event generation, scoring, PDF, import, backtest | Missing |
| CC-7 | `loading.tsx` for every major route | Missing for mundane routes |
| CC-8 | Dark mode — chart studio dark-first | ✅ Done |
| CC-9 | Keyboard shortcuts for chart studio | Missing |
| CC-10 | OpenAPI spec for all API routes | Missing |

---

## Immediate Next Actions (by priority)

1. ❌ `POST /api/mundane/leaders` — wire create form to API
2. ❌ `POST /api/mundane/forecasts` — wire create form to API  
3. ❌ `DELETE /api/mundane/projects/:id/notes/:noteId` — note delete
4. ❌ Seed migration — fill all mundane tables with sample data so pages show content
5. ❌ Enhance `/dashboard/mundane/page.tsx` — show astro events, open projects, forecasts, watched entities
6. ❌ `POST /api/mundane/entities/:id/calculate-chart` — stub calculation (return sample data)
7. ❌ `loading.tsx` for mundane admin routes
