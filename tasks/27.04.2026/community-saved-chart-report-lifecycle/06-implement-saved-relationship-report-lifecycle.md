# Task 06 - Implement Saved Relationship Report Lifecycle

- Status: Planned
- Priority: P0
- Area: Community Relationship Reports
- Routes: `/community/charts`, `/community/charts/detailed`

---

## Goal

Implement saved full report lifecycle for relationship chart types served to PM/community users.

Supported types:

- friendship
- romantic/love
- partnership/business

## Required Behavior

For each relationship pair and relationship type:

- Generate should use the correct production toolkit/API flow.
- Full report should be saved to `astro_ai_responses`.
- Domain lifecycle should link pair + type to the saved report.
- View should load the saved report from DB.
- Regenerate should refresh only the requested pair/type.
- Natal chart changes should invalidate affected relationship reports.

## Important Design Decision

If the current `relationship_charts` table only supports one row per pair, do not overload a single `report_id` when multiple report types are required.

Prefer a child table if needed:

```txt
community_relationship_reports
```

with unique key:

```txt
member_id, person_a_id, person_b_id, report_type
```

## Acceptance Criteria

- [ ] Friendship report saves and views from DB.
- [ ] Romantic/love report saves and views from DB.
- [ ] Partnership/business report saves and views from DB.
- [ ] Pair/type identity prevents wrong report reuse.
- [ ] Regenerate refreshes only the selected pair/type.
- [ ] Natal chart updates invalidate affected relationship report artifacts.
- [ ] Old/dummy relationship summary rows do not count as full reports.
