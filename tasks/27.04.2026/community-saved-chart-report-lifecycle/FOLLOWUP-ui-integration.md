# Follow-Up — UI Integration For Saved Chart Report Lifecycle

> Status: Proposal (foundation already shipped 2026-04-27)
> Area: Perennial / Community / Saved Chart Reports

The backend foundation for this task set is in place. The remaining work
is UI surgery that's safer to ship as separate focused PRs because it
touches the toolkit (3902-line file) and multiple community pages.

## What's Already Shipped

| Layer | Module | Status |
|---|---|---|
| Schema | `supabase/migrations/20260427000001_saved_report_linkage.sql` | Additive — adds linkage columns + child table |
| State model | `src/lib/community/chart-report-state.ts` | `deriveNatalReportState`, `deriveMonthlyReportState`, `deriveRelationshipReportState` + CTA mapping |
| Save+link | `src/lib/community/saved-report-link.ts` | `saveAndLinkNatalReport`, `saveAndLinkMonthlyReport`, `saveAndLinkRelationshipReport`, plus `loadLinked*` hydration helpers |
| Validators (legacy guard) | `src/lib/community/chart-validators.ts` (already shipped earlier) | Used by the new state model's "stale" detection |

These are pure backend modules — they ship without changing any
existing route, page, or API. Nothing breaks.

## What's Deferred (Recommended Phase Plan)

### Phase 1 — Wire `community/family` Generate/View CTA

**File:** `src/app/community/family/page.tsx` (620 lines)

Replace the raw `natal_chart` truthiness check on each row with
`deriveNatalReportState(...)` + `ctaForState(...)`. Pull the new
`natal_report_id`, `natal_report_status`, `natal_status` columns into
the SELECT. Render Generate / View / Regenerate / Retry / Locked
labels accordingly.

This single change closes the Vinnie failure mode at the listing level
even before the toolkit is fully repointed: if the toolkit ever writes
into `astro_ai_responses` via the save endpoint, the listing recognises
it.

### Phase 2 — Add the toolkit save callback for natal flows

**File:** `src/app/community/family/[id]/page.tsx` and the page
component that mounts `HoroscopeToolkitPage`.

Add a new server endpoint `POST /api/community/saved-reports/natal/link`
that accepts `{ familyMemberId, payload }`, calls
`saveAndLinkNatalReport(...)`, and returns the new `report_id`. When
the toolkit fires its save callback, the community wrapper hits this
endpoint so the `community_family_members` row is linked atomically.

Also add the symmetric monthly + relationship endpoints:
`POST /api/community/saved-reports/monthly/link` and
`POST /api/community/saved-reports/relationship/link`.

These endpoints must:
- verify auth
- verify the family-member id belongs to the caller
- call the right `saveAndLink*` helper
- return `{ reportId }` + the new domain status

### Phase 3 — Toolkit hydration mode (Task 08 Option B)

Build `CommunitySavedToolkitReport` wrapper around `HoroscopeToolkitPage`
that:
- accepts a `savedReport` prop
- skips compute / AI calls
- renders the saved payload directly

This is the trickiest piece because the toolkit currently always
generates on mount. Two approaches, in order of safety:

  - **Option B1 — wrapper with feature flag**: clone the rendering
    helpers from the toolkit into the wrapper and bypass the generation
    pipeline.
  - **Option B2 — extend the toolkit**: add `mode: "view-saved"` and
    `savedReport` props to `HoroscopeToolkitPage`. Higher risk because
    admin uses the same component.

Recommend Option B1 first — keep admin behavior unchanged.

### Phase 4 — Page-level state replacements

Apply `deriveMonthlyReportState` to `/community/transits` for the View
button. Apply `deriveRelationshipReportState` to `/community/charts` for
each relationship card. These are mechanical replacements of the raw
truthiness checks with the shared model.

### Phase 5 — Backfill cron

After Phase 2 has been live for a release, write a one-off backfill
cron that walks valid legacy `natal_chart` / `monthly_transits.transit_data`
rows and inserts matching `astro_ai_responses` rows so old users get
"View" instead of "Generate". Strictly read-from-old → write-new; never
deletes.

## QA Coverage Map

The acceptance checks in `10-regression-and-qa-checklist.md` map to
phases as follows:

| Spec line | Phase |
|---|---|
| Family member with no saved chart shows Generate Chart | Phase 1 |
| Generate saves full `western_horoscope_v2` report | Phase 2 |
| Generate links saved report to family member | Phase 2 |
| Family list changes to View Chart after save | Phase 1 + Phase 2 |
| View Chart loads saved DB report without re-generation | Phase 3 |
| Viewed report matches generated report | Phase 3 |
| Regenerate updates saved report and timestamps | Phase 2 |
| Existing valid legacy `natal_chart` rows remain viewable | Phase 1 (state model already handles this — `generated` if shape valid + `natal_status='generated'`) |
| Dummy/invalid `natal_chart` rows do not unlock View | Phase 1 (state model already returns "stale") |
| Monthly full report saves + views | Phase 2 + Phase 3 |
| Friendship/romantic/partnership saves + views | Phase 2 + Phase 3 |
| Same pair separate reports by type | already supported by `community_relationship_reports` unique key |
| Cross-household ids cannot fetch reports | Phase 2 endpoints enforce |
| Saved report fetch respects ownership/share rules | Phase 2 endpoints + existing RLS |

## Why Foundation-First Is The Safer Path

- The migration is additive and shippable independently. It's the
  prerequisite for everything else but can sit unused for weeks without
  affecting any existing code path.
- The state model + helpers are pure modules. Importing them anywhere
  is a no-op until a caller chooses to use them.
- Each UI phase above is a small, reviewable PR with its own QA. Bundling
  them risks breaking the toolkit (admin uses the same component) or
  the `/community/family` listing in ways that aren't caught by lint.
