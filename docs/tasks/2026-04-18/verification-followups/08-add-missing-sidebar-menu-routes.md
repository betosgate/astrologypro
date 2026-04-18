# Task VF-08 - Add Missing Sidebar Menu Routes

- Status: Not Started
- Priority: P1
- Owner: Frontend
- Module: Admin navigation, diviner dashboard navigation
- PMS Type: Bug / UX Follow-Up
- Source: Manual verification of `docs/manual-test-checklist-2026-04-17.md`
- Created: 2026-04-18

## Problem

Some verified admin and diviner routes exist in the app but are not easy to find from the relevant sidebar/menu navigation.

Confirmed current state:

- Diviner desktop/full sidebar has `/dashboard/campaigns`, but it is nested under `Marketing`.
- Diviner bottom mobile nav does not directly show `/dashboard/campaigns`, `/dashboard/landing-pages`, or `/dashboard/analytics`.
- Admin sidebar has `/admin/campaigns`, `/admin/campaigns/reports`, `/admin/service-templates`, and `/admin/service-config`.
- Admin sidebar does not directly show `/admin/analytics/landing-pages`.
- Admin sidebar does not directly show `/admin/campaigns/analytics`.

This makes tested routes look missing to users even when the route is implemented.

## Required Changes

1. Add or improve admin sidebar entries for:
   - `/admin/analytics/landing-pages`
   - `/admin/campaigns/analytics`
2. Make diviner campaign navigation easier to discover:
   - Keep `/dashboard/campaigns` under `Marketing`, or move/add it as a top-level item if product wants it more visible.
   - Add a direct mobile menu entry for `/dashboard/campaigns` in the dashboard mobile navigation.
3. Add direct mobile menu entries, or an equivalent clear mobile path, for:
   - `/dashboard/landing-pages`
   - `/dashboard/analytics`
4. Preserve active-route highlighting for nested routes such as:
   - `/dashboard/campaigns/[id]`
   - `/dashboard/campaigns/[id]/analytics`
   - `/dashboard/landing-pages/[templateId]/builder`
   - `/dashboard/landing-pages/[templateId]/analytics`

## Files To Check

- `src/components/admin/admin-sidebar.tsx`
- `src/components/dashboard/sidebar.tsx`
- `src/components/dashboard/mobile-nav.tsx`
- `src/app/admin/layout.tsx`
- `src/app/dashboard/layout.tsx`

## Acceptance Criteria

- An admin user can find and open landing-page analytics from the admin sidebar/menu.
- An admin user can find and open campaign analytics from the admin sidebar/menu.
- A diviner can find and open campaigns from desktop sidebar navigation without knowing the URL.
- A diviner can find and open campaigns from mobile navigation without knowing the URL.
- A diviner can find and open landing pages and analytics from mobile navigation without knowing the URL.
- Active navigation styling still works for the main route and nested detail routes.
- No duplicate confusing labels are added where the destination is unclear.

## Verification Steps

1. Log in as `admin.test@astrologypro.com`.
2. Open `/admin`.
3. Confirm the admin sidebar/menu exposes:
   - Landing page analytics
   - Campaign analytics
   - Campaign reports
   - Service templates
   - Service config
4. Log in as `diviner1@test.astrologypro.com`.
5. Open `/dashboard`.
6. On desktop width, confirm the sidebar exposes:
   - Services
   - Landing Pages
   - Marketing -> Campaigns
   - Insights -> Analytics
7. On mobile width, confirm the bottom nav or mobile menu exposes:
   - Campaigns
   - Landing Pages
   - Analytics
8. Open each route from the menu, not by typing the URL.
9. Confirm the active menu state is correct after navigation.

## Notes

- Do not add routes that are detail-only pages directly to the main sidebar unless product specifically wants that. Detail routes should normally remain reachable from their parent list pages.
- If the product decision is to keep `/dashboard/campaigns` nested under `Marketing`, use clear labels so users can discover it quickly.
