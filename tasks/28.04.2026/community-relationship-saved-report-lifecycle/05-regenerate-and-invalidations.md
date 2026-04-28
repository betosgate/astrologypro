# Task 05 - Regenerate And Invalidations

- Status: Planned
- Priority: P0
- Area: Data Integrity / Relationship Reports

---

## Goal

Ensure relationship saved reports stay correct when users explicitly regenerate or when underlying natal charts change.

## Regenerate Rules

- Regenerate is explicit; saved View must not regenerate automatically.
- Regenerate only affects the selected pair/type.
- On successful regeneration:
  - insert a new `astro_ai_responses` artifact
  - update the matching `community_relationship_reports` row
  - clear failure/invalidation fields
- If regeneration fails:
  - keep previous valid report linked
  - record failure only if the schema supports it

## Natal Chart Invalidation Rules

When a family member's natal chart changes or natal saved report is regenerated:

- Mark affected relationship saved reports stale/invalidated for any row where:
  - `person_a_id = family_member_id`, or
  - `person_b_id = family_member_id`
- Do not delete saved artifacts.
- Do not invalidate unrelated pair/types.

## Acceptance Criteria

- [ ] Regenerate romantic does not overwrite friendship/partnership.
- [ ] Regenerate one pair does not overwrite another pair.
- [ ] Natal chart regeneration invalidates affected relationship reports.
- [ ] Existing saved report remains available if regeneration fails before save/link completes.
