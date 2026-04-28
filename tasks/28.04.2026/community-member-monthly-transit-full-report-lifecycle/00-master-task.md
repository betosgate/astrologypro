# Master Task - Member Monthly Transit Full Report Lifecycle

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Monthly Transits
- Routes: `/community/transits`, `/community/transits/detailed`
- Related Task Sets:
  - `tasks/27.04.2026/community-monthly-transit-architecture`
  - `tasks/27.04.2026/community-saved-chart-report-lifecycle`

---

## Goal

Make monthly transits work per household member, with saved full monthly reports.

The existing monthly summary business logic must remain intact:

- Current-month lightweight summaries are generated automatically for active subscribed users and eligible family members.
- The first-of-month job generates current-month summaries.
- Mid-month subscribers or newly eligible family members get current-month summaries through the existing catch-up path.
- Previous month summaries/full reports are not the active user-facing state after a new month begins.

On top of that, each member's full monthly report must be generated once, saved, and reused.

## Product Flow

1. User opens `/community/transits`.
2. Page shows current-month monthly transit summary cards for eligible members.
3. Each card has its own full-report CTA:
   - `Generate Full Report` when no valid full report exists.
   - `View Full Report` when a saved full report exists.
   - `Regenerate` as explicit secondary action.
4. User opens:

```txt
/community/transits/detailed?familyMemberId=<id>&month=YYYY-MM
```

5. The selected member's birth data is auto-populated into the toolkit.
6. Birth fields are read-only/disabled.
7. If saved full report exists, render saved data without live compute / wheel / AI calls.
8. If missing, generate once, save full payload, and link it to `monthly_transits.full_report_id`.

## Existing Foundation To Reuse

- Summary table: `monthly_transits`
- Full artifact table: `astro_ai_responses`
- Same existing save/fetch APIs used by natal saved reports:
  - `POST /api/astro-ai/save-astro-ai-response`
  - `POST /api/astro-ai/fetch-save-astro-ai-response`
  - `POST /api/astro-ai/lookup-saved`
- Existing helper module:
  - `saveAndLinkMonthlyReport(...)`
  - `loadLinkedMonthlyReport(...)`
- Existing monthly summary catch-up:
  - `ensureCurrentMonthTransitsForMember(...)`
- Existing CTA state model:
  - `deriveMonthlyReportState(...)`
- Existing full toolkit slug:
  - `tropical_transits_monthly_v3`

## Current Problem

`/community/transits` shows family/member summary cards, but the top-level `Open Full Monthly Report` CTA is global and ambiguous.

`/community/transits/detailed` currently resolves only the main/self user birth data. It does not accept a selected `familyMemberId`, so family members cannot open their own full monthly report with prefilled read-only fields.

## Required Behavior

- Remove or de-emphasize the single global `Open Full Monthly Report` CTA.
- Add member-specific full-report CTAs on each monthly transit card.
- Use `family_member_id + month` as the domain identity.
- Keep `monthly_transits.transit_data` as lightweight summary only.
- Save full `tropical_transits_monthly_v3` payload into `astro_ai_responses`.
- Link saved artifact through:

```txt
monthly_transits.full_report_id
monthly_transits.full_report_status
monthly_transits.full_report_generated_at
```

## Out Of Scope

- No changes to astrology calculations.
- No prompt/content rewrites.
- No historical report archive UI.
- No relationship report changes.
- No browser/localStorage cache.
- No dummy/project-demo transit or chart data may be treated as a valid generated full monthly report.

## Task Breakdown

1. `01-audit-current-monthly-flow.md`
   Confirm current summary generation, detailed route, saved full-report fields, and cleanup/month rollover assumptions.

2. `02-update-transits-list-member-ctas.md`
   Replace the global full-report CTA with per-member card CTAs and state.

3. `03-update-detailed-route-member-prefill.md`
   Make `/community/transits/detailed` accept `familyMemberId` and auto-populate that member's read-only birth data.

4. `04-save-and-link-full-monthly-report.md`
   Wire generation to `saveAndLinkMonthlyReport(...)`.

5. `05-saved-view-and-regenerate.md`
   Load linked saved full report before generation, render saved view, and add explicit Regenerate behavior.

6. `06-month-rollover-and-cleanup-rules.md`
   Preserve first-of-month generation, mid-month catch-up, and previous-month removal/ignore behavior.

7. `07-regression-and-qa-checklist.md`
   Verify member-specific save/view/no-live-call behavior.

## Acceptance Criteria

- [ ] `/community/transits` shows member-specific full-report actions.
- [ ] Global ambiguous `Open Full Monthly Report` CTA is removed or no longer primary.
- [ ] `/community/transits/detailed?familyMemberId=<id>&month=YYYY-MM` loads the selected member.
- [ ] Selected member birth fields are auto-populated and disabled.
- [ ] Full report saves once and links to `monthly_transits.full_report_id`.
- [ ] Saved View does not call live compute / wheel / AI APIs.
- [ ] Regenerate is explicit and updates only that member/month.
- [ ] First-of-month summary generation remains intact.
- [ ] Mid-month catch-up remains intact.
- [ ] Previous months are not shown as current active reports.
- [ ] Any active dummy/demo monthly chart/report logic is commented out or removed from the production path.
- [ ] Save/fetch behavior uses the same existing `astro_ai_responses` APIs/foundation used by natal saved reports.
