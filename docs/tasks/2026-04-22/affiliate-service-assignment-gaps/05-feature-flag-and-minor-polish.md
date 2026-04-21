# Task 05 — Feature Flag Gating and Minor Polish

- Status: Not Started
- Priority: P1 (Minor but user-visible)
- Depends On: Tasks 01–04 ideally landed first; can run in parallel if needed
- Blocks: Safe progressive rollout of the V2 affiliate flow; admin abuse detection

## Goal

Close three smaller gaps flagged in the audit that aren't individually critical but together reduce rollout risk and complete the admin feature set:

1. Feature flag `isAffiliateAssignmentV2Enabled` is enforced inconsistently across pages/nav, so rollout safety still depends too much on route-level checks.
2. `/advocate/earnings` exists, but it still reads the legacy affiliate model rather than the new assignment/campaign/conversion model.
3. Affiliate deep-dive already has a basic abuse-signals card, but it is shallower than the parent task expected and should be tightened into a clearer anomaly panel.

## Current State

- `src/lib/feature-flags.ts:4,14,18` defines `isAffiliateAssignmentV2Enabled()`.
- Flag is checked in `src/app/api/dashboard/affiliate-assignments/route.ts:17-23` and similar API routes.
- Some page-level/nav-level gating is still missing or incomplete — confirm the current state in `/dashboard/affiliates/assignments`, `/advocate/assignments`, `/advocate/campaigns`, and surrounding nav entry points before editing.
- The legacy "Enrolled Affiliates" panel is already removed from `src/app/dashboard/campaigns/[id]/page.tsx`; do not spend time re-removing it.
- `/advocate/earnings` already exists as a dedicated route, but it still uses legacy `affiliate_referrals` plus `social_advocates.total_earned/total_paid`.
- `/admin/analytics/affiliates/[id]/page.tsx` already has a lightweight abuse-signals block based on bot-rate / clicks-per-unique / top-IP share.

## Implementation Steps

### Part A — Feature flag gating for UI

1. **Server-side gate**: in each of the following page files, call `isAffiliateAssignmentV2Enabled()` at the top if that guard is not already present. If false, `notFound()` (returns 404) or `redirect()` to the legacy equivalent:
   - `src/app/dashboard/affiliates/assignments/page.tsx`
   - `src/app/dashboard/affiliates/assignments/[id]/page.tsx`
   - `src/app/advocate/assignments/page.tsx`
   - `src/app/advocate/assignments/[id]/campaigns/page.tsx` (if it exists)
   - `src/app/advocate/campaigns/page.tsx`
   - `src/app/advocate/campaigns/[id]/page.tsx`

2. **Nav gating**: in the diviner sidebar and advocate sidebar, conditionally render the new entries only when the flag is on. Confirm the flag is resolvable server-side where the nav renders — if nav is a Client Component, expose the flag via a small server-rendered wrapper or a cookie-set boolean. Do NOT leak the flag decision logic to the client.

3. **Per-diviner override**: if the project's flag system supports per-user overrides (check `src/lib/feature-flags.ts`), document how to flip it for a single diviner for staged rollout.

### Part B — `/advocate/earnings` V2 alignment

Update the existing `src/app/advocate/earnings/page.tsx` instead of creating a new page. It should read from the V2 assignment/campaign/conversion model, not the legacy affiliate model.

Layout:
- Summary tiles: lifetime commission, 30d commission, pending payout, paid payout
- Breakdown table by diviner: assignment, scope (PROFILE/SERVICE), destination label, commission rate, clicks, conversions, commission earned
- Breakdown table by campaign: campaign name, diviner, clicks, conversions, commission earned
- Time-range selector (7d / 30d / 90d / all)

Data source: V2 assignment/campaign/conversion tables for `affiliate_id = <current advocate>`. Reuse the same V2 aggregator that should also back `/advocate/campaigns` and the assignments summary once Task 09 lands.

Do not fork legacy and V2 earnings logic. Hoist the shared V2 aggregator into a library helper and call it from both the assignments summary and the earnings page.

### Part C — Deepen the admin affiliate anomaly panel

Upgrade the existing signals block in `src/app/admin/analytics/affiliates/[id]/page.tsx` into a clearer "Anomaly Signals" panel. Computed server-side. No ML — simple rule-based detection:

| Signal | Rule | Severity |
|---|---|---|
| Abnormal CTR | CVR > 50% over last 7d with >20 clicks | High |
| IP concentration | >60% of clicks from a single `ip_hash` over 30d | High |
| Self-referral | Any `campaign_clicks.session_id` matches an auth session belonging to the affiliate | Critical |
| Conversion spike | 30d conversions > 10× trailing 90d median | Medium |
| Short click-to-book window | Median click→book < 30s | Medium |
| Refund rate | Reversed conversions / total conversions > 20% | Medium |

Render as a small card stack above the performance chart. Each card: signal name, severity badge, one-line explanation, and the metric that tripped it. No action buttons — this is observational only.

Computation: a server function in `src/lib/admin/affiliate-signals.ts`. Cache per affiliate for 5 minutes (Hard Law #19 — classify the cache: `user-scoped` + `revalidate: 300`).

## Verification Plan

### Part A
1. With flag off, visit `/dashboard/affiliates/assignments` → 404 (or redirect to legacy).
2. With flag off, diviner sidebar shows no "Assignments" entry.
3. Flip flag on → new pages reachable and only one navigation path is visible for the affiliate flow.

### Part B
1. `/advocate/earnings` loads for a logged-in advocate with assignments; totals match the V2 assignments/campaign summaries.
2. Range selector changes totals.
3. Advocate with no assignments sees an empty-state card, not a crash.

### Part C
1. Seed a scenario that trips one signal (e.g., 30 clicks from the same ip_hash in 1d). Visit the deep-dive page → "IP concentration" card appears.
2. Clean affiliate with normal metrics → panel renders an empty or "No anomalies" state.
3. Non-admin cannot access the deep-dive page (already enforced — regression-check).

## Edge Cases

- Part A: a user mid-session when the flag flips: server re-evaluates on the next page load, no stale UI from SSR caching (ensure the pages are `dynamic = 'force-dynamic'` or re-validate per request). Don't cache the flag read for more than 60s.
- Part B: if legacy-only rows still exist for an affiliate, be explicit whether the page is V2-only or whether a backfill/migration path is expected. Do not silently merge incompatible models.
- Part C: affiliates with <10 total clicks ever: skip all signals (insufficient data) and render "Insufficient history for anomaly detection."

## Out of Scope

- ML-based anomaly detection. Rule-based only.
- Automatic affiliate suspension on red flags. Observational only.
- Payout actions on the earnings page (separate payout sprint).

## Rollback Plan

- Part A: remove the flag guards. The pages become visible regardless of flag — acceptable if V2 is generally launched.
- Part B: revert the earnings page back to its prior legacy-backed implementation and remove any new shared V2 aggregator/helper introduced by this task.
- Part C: delete the signals panel and helper. Deep-dive page returns to its current state.
