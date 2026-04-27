# Task 02 - Make Me Generate Chart Cache-Aware

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Chart Generation
- File: `src/app/api/community/me/generate-chart/route.ts`
- Related Routes: `/community`, `/community/horoscope`, `/community/charts`

---

## Problem

`POST /api/community/me/generate-chart` always regenerates the self natal chart before handling:

- `type: "natal"`
- `type: "monthly"`
- `type: "relationship"`

This can cause unnecessary writes to `community_family_members.natal_chart` and may trigger relationship chart invalidation even when birth data did not change.

## Required Backend Fix

Before calling `generateNatalChart`, load the self family member's existing chart fields:

- `natal_chart`
- `natal_status`
- `chart_updated_at`
- `natal_last_generated_at`

Reuse the stored natal chart when:

- `natal_status = "generated"`
- `natal_chart IS NOT NULL`
- the stored `natal_chart` matches the current production chart shape/version
- birth data was not changed in the request
- no explicit future `forceRegenerate: true` flag was supplied

Only regenerate when:

- no stored natal chart exists
- stored chart data looks like old dummy/legacy data
- status is `not_started`, `queued`, or `failed`
- caller supplied changed birth data
- caller explicitly forces regeneration

## Important Constraints

- Do not consume correction retry count for cached reads.
- Do not bypass locked-for-review behavior.
- If birth data changed, preserve the existing natal governance and audit rules.
- Keep response shape compatible with existing frontend callers.

## Acceptance Criteria

- [ ] Calling `type: "natal"` returns existing chart when already generated.
- [ ] Calling `type: "monthly"` reuses the existing natal chart.
- [ ] Calling `type: "relationship"` reuses the existing natal chart.
- [ ] `chart_updated_at` does not change on cached reads.
- [ ] Regeneration still happens when chart is missing or explicitly forced.
- [ ] Regeneration happens when stored chart JSON does not pass current production-shape validation.
- [ ] Existing retry/audit behavior remains intact.
