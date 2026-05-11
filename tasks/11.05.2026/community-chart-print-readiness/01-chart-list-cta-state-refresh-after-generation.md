# Task - Refresh Chart List CTA State After Generation

- Status: Planned
- Priority: P1
- Area: Community / Astrology Charts / List CTA State
- Page Routes:
  - `/community/charts`
  - `/community/family`
  - `/community/transits`
  - `/community/charts/detailed`
  - `/community/family/[id]`
  - `/community/transits/detailed`
- Date: 2026-05-11

---

## Goal

Fix stale chart-list CTA labels after a user successfully generates a chart or report and returns to the list page.

After generation, the relevant list card should switch from `Generate` to `View` as soon as the generated chart/report exists. The user should not need to visit the dashboard, wait, or hard refresh.

## Current Problem

Relationship chart generation currently exposes the bug:

1. User opens `/community/charts`.
2. A relationship report CTA shows `Generate`.
3. User generates the report from `/community/charts/detailed`.
4. User goes back to `/community/charts`.
5. The same CTA can still show `Generate`.
6. After dashboard navigation, waiting, or hard refresh, the CTA updates to `View`.

This indicates the generated report is saved correctly, but the list page is showing stale client/cache state.

The same stale-state risk exists for:

- nativity chart CTAs on `/community/family`
- monthly transit report CTAs on `/community/transits`

## Root Cause Hypothesis

The list pages derive CTA labels from data fetched before generation.

When the user returns via browser Back or client navigation, the previous list component/state can be restored without refetching chart/report availability.

Current generation/detail pages call `router.refresh()` after saving, but that refresh only affects the current detail route. It does not reliably invalidate or refresh an already mounted/restored list route.

## Required Behavior

### Relationship Charts

- After generating a relationship report, returning to `/community/charts` should show `View` for the generated report type.
- This must work for pair reports and family overview reports.

### Nativity Charts

- After generating a natal chart from `/community/family/[id]`, returning to `/community/family` should show `View Chart` for that member.

### Monthly Transits

- After generating a full monthly transit report from `/community/transits/detailed`, returning to `/community/transits` should show `View Transit Report` for that member/month.

## Implementation Notes

- Audit current list-page data hydration:
  - `/community/charts` client fetches `/api/community/relationship-charts`.
  - `/community/family` client fetches `/api/community/family`.
  - `/community/transits` server-renders card data and passes it into `TransitCardExpander`.

- Add a reliable refresh path when users return to a chart list page:
  - handle `pageshow` for browser back/forward cache restores
  - handle `visibilitychange` when the document becomes visible
  - optionally handle window `focus`
  - for server-rendered list routes, use `router.refresh()` from a small client refresh helper if needed

- Preserve existing manual refresh behavior on `/community/charts`.

- Avoid heavy polling. Refetch on return/focus is enough for this bug.

- Prefer scoped refetches over full-page reloads.

- Consider an optional generation-success marker if useful:
  - after successful generation/link save, store a short-lived local/session marker with chart/report identity
  - list page can optimistically flip only the matching CTA to `View` while refetch confirms backend state

- Ensure cache-busting or `cache: "no-store"` is used where client fetches need fresh chart/report status.

## Out Of Scope

- Changing chart generation APIs.
- Changing saved report persistence schema.
- Redesigning chart list cards.
- Changing chart detail pages beyond state invalidation needs.
- Adding polling while the user remains away from the list page.
- Changing entitlement or purchase logic.

## Acceptance Criteria

- [ ] Relationship report CTA changes from `Generate` to `View` after successful generation and return to `/community/charts`.
- [ ] Family overview relationship CTA changes from `Generate` to `View` after successful generation and return to `/community/charts`.
- [ ] Nativity member CTA changes from `Generate Chart` to `View Chart` after successful generation and return to `/community/family`.
- [ ] Monthly transit CTA changes from `Generate Transit Report` to `View Transit Report` after successful generation and return to `/community/transits`.
- [ ] Browser Back navigation triggers a fresh enough state update.
- [ ] Client-side Link navigation triggers a fresh enough state update.
- [ ] Hard refresh is not required for CTA labels to update.
- [ ] Error states still show retry/generate behavior correctly.
- [ ] No unrelated list card state regresses.

## QA Checklist

- [ ] On `/community/charts`, generate a romantic relationship report, go back, and confirm the CTA says `View`.
- [ ] Repeat for friendship and business/partnership report types.
- [ ] Repeat for family overview relationship reports.
- [ ] On `/community/family`, generate a natal chart for a member, go back, and confirm the member CTA says `View Chart`.
- [ ] On `/community/transits`, generate a full monthly transit report, go back, and confirm the CTA says `View Transit Report`.
- [ ] Test browser Back, sidebar navigation away/back, and direct Link navigation.
- [ ] Confirm manual refresh on `/community/charts` still works.
- [ ] Confirm failed generation does not incorrectly flip the CTA to `View`.
