# Task 05 — Diviner Dashboard Simplification

- Status: Not Started
- Priority: P2
- Depends On: Task 02 (public route), Task 03 (builder + API)
- Blocks: none
- Feature flag: `LANDING_PAGE_V2`

## Goal

Rebuild [src/app/dashboard/landing-pages/page.tsx](../../../../src/app/dashboard/landing-pages/page.tsx) around the simplified model:

- **One** actionable toggle per service — "Live" / "Offline" — writes `diviner_services.is_published`.
- Direct link into the builder for the two slots.
- Admin state (`is_active`, `is_enabled`) shown as read-only with clear copy when either is false ("Deactivated by admin — contact support").
- No "Published / Draft / Unpublished" badges driven by `service_landing_pages.status`. That concept is gone.
- No preview button on the dashboard — preview lives inside the builder (per Task 03). Dashboard surfaces a "View live page" link only when the service is actually Live.

## Current State

The current dashboard ([dashboard/landing-pages/page.tsx:67-94](../../../../src/app/dashboard/landing-pages/page.tsx#L67-L94)) surfaces four statuses (Published / Draft / Unpublished / Flagged) and three actions (Open Builder / Preview / Publish|Unpublish). The status derives from a mix of `diviner_services.is_published`, `service_landing_pages.status`, and `moderation_status` — exactly the mix that drifted in the 2026-04-21 incident.

## Target UI

### Per-service row

```
┌───────────────────────────────────────────────────────────────────────┐
│ [icon] Nativity Birth Chart              [Live ●]  [Customize]  [⋮]   │
│        Astrology · 90 min · $175                                       │
│        2 custom blocks · 3 days since last edit                       │
│                                                                        │
│ ─or (admin-disabled)─                                                  │
│                                                                        │
│ [icon] Nativity Birth Chart              [Offline ○]  disabled         │
│        Deactivated by admin — contact support to re-enable             │
└───────────────────────────────────────────────────────────────────────┘
```

| Element | Binding | Notes |
|---|---|---|
| Live / Offline toggle | `diviner_services.is_published` | POST to `/api/dashboard/landing-pages/:templateId/toggle-live` — see API Contract below |
| "Customize" button | Routes to `/dashboard/landing-pages/:templateId/builder` | Always visible, even when Offline or admin-disabled (the diviner can still edit blocks regardless of live state) |
| "View live page" link | Routes to `/:username/services/:slug` (new tab) | **Shown only when the service is Live.** Hidden entirely when Offline or admin-disabled to avoid sending the diviner to a 404. |
| Block count | `COUNT(*)` on blocks where `is_enabled=true` for both slots | |
| "Deactivated by admin" message | Shown when `services.is_active=false` OR `diviner_services.is_enabled=false` | Toggle disabled; diviner cannot flip to Live |

### Summary bar at top

```
Total services: N   |   Live: N   |   Offline: N   |   Admin-disabled: N
```

No "Views (30d)" for now — keep the analytics panel as a separate link on each row (`/dashboard/landing-pages/:templateId/analytics`).

### Filter / search

Keep search. Simplify status filter to two options: `Live` / `Offline` (including admin-disabled in Offline).

## API Contract (from Task 03)

### `GET /api/dashboard/landing-pages`

Response:
```ts
{
  services: Array<{
    template_id: string;
    template_name: string;
    template_slug: string;
    template_category: string;
    price: number;
    duration_minutes: number;
    is_active: boolean;          // from services.is_active (admin)
    is_enabled: boolean;         // from diviner_services.is_enabled (admin)
    is_published: boolean;       // from diviner_services.is_published (diviner)
    admin_disabled: boolean;     // !is_active || !is_enabled — convenience
    block_count: {
      about_diviner: number;
      extra: number;
    };
    last_edited_at: string | null;
    builder_url: string;
    public_url: string;
    analytics_url: string;
  }>;
  summary: {
    total: number;
    live: number;
    offline: number;
    admin_disabled: number;
  };
}
```

No more `has_landing_page`, `landing_page_status`, `custom_section_count`, `moderation_status`, `publish_status` fields. All gone.

### `POST /api/dashboard/landing-pages/:templateId/toggle-live`

Request:
```ts
{ is_published: boolean }
```

Authorization — owning diviner only (via `diviner_services`). Enforces:
- If `is_active=false` or `is_enabled=false`, return 409 `{ title: "Cannot toggle — service is admin-disabled" }`.
- Otherwise update `diviner_services.is_published` and return the new row.

## Files Touched

| File | Change |
|---|---|
| `src/app/dashboard/landing-pages/page.tsx` | Rewrite to match the contract above |
| `src/app/api/dashboard/landing-pages/route.ts` | Response shape simplified per contract |
| `src/app/api/dashboard/landing-pages/[templateId]/toggle-live/route.ts` | **New file** (renamed from `publish/route.ts` per Task 03). Accepts `{ is_published: boolean }`, returns 409 when admin-disabled. |

(Task 03 owns the rename of `publish/route.ts` → `toggle-live/route.ts` and the delete of `unpublish/route.ts`. This task just consumes the new `toggle-live` endpoint.)

## Acceptance Criteria

- [ ] Dashboard shows one "Live / Offline" toggle per service.
- [ ] Toggling on writes `diviner_services.is_published=true` and no other field.
- [ ] Toggle is disabled with explanatory copy when admin has set `is_active=false` or `is_enabled=false`.
- [ ] No "Publish / Draft / Unpublished" badges anywhere.
- [ ] No "Preview" button on the dashboard. "View live page" link shown only when Live; hidden for Offline and admin-disabled services.
- [ ] Clicking "Customize" works regardless of Live/Offline state.
- [ ] Block count derives from enabled blocks only (disabled blocks excluded).
- [ ] `grep -r "landing_page_status" src/app/dashboard/` returns zero.
- [ ] Type-check and lint pass. New E2E test covers: toggle behavior for Live, Offline, and admin-disabled states; correct visibility of "View live page" link in each state.

## Rollback

Flip `LANDING_PAGE_V2` off. Old dashboard resumes. Keep the old API endpoints alive behind the flag until Task 03 removes them in the cooling-period cleanup.

## Out of Scope

- Analytics panel rework (stays as-is, linked from the row).
- Notifications when admin disables a service (future task — probably via email or in-app notification system, not this dashboard).
- Bulk actions (toggle multiple services at once).
