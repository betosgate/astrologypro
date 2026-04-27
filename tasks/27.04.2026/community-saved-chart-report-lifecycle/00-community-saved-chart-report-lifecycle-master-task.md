# Master Task - Community Saved Chart Report Lifecycle

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Saved Chart Reports
- Page Routes: `/community/family`, `/community/family/[id]`, `/community/horoscope`, `/community/transits`, `/community/transits/detailed`, `/community/charts`, `/community/charts/detailed`
- Related Task Sets:
  - `tasks/24.04.2026/astro-toolkit`
  - `tasks/27.04.2026/community-chart-cache-and-regeneration`
  - `tasks/27.04.2026/community-monthly-transit-architecture`

---

## Goal

Implement one consistent saved chart/report lifecycle for every chart experience served to Perennial/community users.

For every supported chart/report type:

- show Generate when no valid saved report exists
- generate through the current production toolkit/API flow
- save the full generated report payload
- link the saved payload to the correct community domain record
- show View after a valid save
- View must load the saved payload from DB and render the same UI/data structure shown after generation
- Regenerate must explicitly replace or update the saved report
- old/dummy/invalid payloads must not count as complete

## Supported Community Report Types

This lifecycle applies to:

- self natal/nativity chart
- added family member natal/nativity chart
- monthly transit full report
- relationship reports:
  - friendship
  - romantic/love
  - partnership/business

## Current Gap

Today the app has separate pieces that do not form a complete lifecycle:

- `/community/family/[id]` can render the shared `HoroscopeToolkitPage`.
- The toolkit can generate a rich visible report.
- `astro_ai_responses` exists as a generic saved AI report table.
- `community_family_members.natal_chart` exists as a lightweight/domain chart field.
- `/community/family` switches Generate/View based on raw `natal_chart` truthiness.

But these pieces are not fully connected.

Example failure:

- user opens `/community/family/[id]`
- user clicks the toolkit's Generate Reading button
- rich natal report appears on screen
- `community_family_members.natal_chart` remains null
- `/community/family` still shows Generate Chart instead of View Chart

This happens because toolkit report generation and Perennial community saved-chart state are separate lifecycles.

## Required Architecture

Use two layers:

### 1. Domain lifecycle records

These records answer product/workflow questions:

- does this user/member/pair/month have a valid chart?
- what CTA should the user see?
- is it pending, generated, failed, stale, locked, or invalidated?
- what report row should View load?

Existing domain tables:

- `community_family_members`
- `monthly_transits`
- `relationship_charts`

### 2. Full report artifact records

`astro_ai_responses` stores full rich toolkit/report payloads:

- `toolname`
- `ai_response`
- `form_data`
- `astro_api_data`
- chart image/SVG fields
- source/version metadata
- generated timestamps

The domain record should link to the full artifact by id.

## Proposed Domain Links

Exact schema should be finalized in Task 02, but likely additions:

```txt
community_family_members.natal_report_id
community_family_members.natal_report_generated_at

monthly_transits.full_report_id
monthly_transits.full_report_generated_at

relationship_charts.report_id
relationship_charts.report_type
relationship_charts.report_generated_at
```

Relationship identity must include:

```txt
person_a_id
person_b_id
relationship_type: friendship | romantic | partnership
```

Monthly identity must include:

```txt
family_member_id or community member id
target_month
toolname: tropical_transits_monthly_v3
```

Natal identity must include:

```txt
family_member_id
toolname: western_horoscope_v2
birth-data/input hash or generated timestamp
```

## Task Breakdown

1. `01-audit-community-chart-entrypoints.md`
   Inventory every PM/community chart route, CTA, API call, table, and current save behavior.

2. `02-define-unified-report-identity-and-schema.md`
   Define report identity, DB links, metadata, and stale/invalid rules for natal, monthly, and relationship reports.

3. `03-add-domain-report-linkage.md`
   Add migrations and domain model updates to link community records to `astro_ai_responses`.

4. `04-implement-saved-natal-report-lifecycle.md`
   Implement self/family natal Generate/View/Regenerate using saved `western_horoscope_v2` artifacts.

5. `05-implement-saved-monthly-report-lifecycle.md`
   Implement monthly full-report Generate/View/Regenerate using saved `tropical_transits_monthly_v3` artifacts.

6. `06-implement-saved-relationship-report-lifecycle.md`
   Implement friendship, romantic/love, and partnership relationship report Generate/View/Regenerate.

7. `07-add-shared-cta-state-model.md`
   Standardize Generate/View/Regenerate/Retry/Generating/Locked states across PM/community chart UIs.

8. `08-add-toolkit-saved-report-hydration.md`
   Extend or wrap `HoroscopeToolkitPage` so saved report payloads can render without re-calling compute/AI APIs.

9. `09-legacy-dummy-data-and-migration-strategy.md`
   Define compatibility for old `natal_chart`, `monthly_transits`, and `relationship_charts` rows.

10. `10-regression-and-qa-checklist.md`
    End-to-end QA for all community chart/report flows.

## Out Of Scope

- Changing the underlying astrology meanings/calculation formulas.
- Replacing `HoroscopeToolkitPage` with a new renderer.
- Removing existing domain tables.
- Deleting old temporary UI before saved-report hydration is accepted.
- Weakening membership, ownership, RLS, or household boundaries.

## Acceptance Criteria

- [ ] All PM/community chart surfaces have a documented report identity.
- [ ] Full generated toolkit/report payloads are saved in `astro_ai_responses`.
- [ ] Domain records link to saved full report artifacts.
- [ ] Generate changes to View only after a valid save/link exists.
- [ ] View loads saved DB data and renders the same UI/data structure as the generated report.
- [ ] Regenerate explicitly refreshes saved report data and updates domain lifecycle state.
- [ ] Legacy/dummy/invalid data does not show as complete.
- [ ] Natal, monthly transit, and relationship flows all share the same CTA state model.
- [ ] Existing old valid charts remain usable during rollout.
- [ ] Existing community ownership and active-membership checks remain intact.
