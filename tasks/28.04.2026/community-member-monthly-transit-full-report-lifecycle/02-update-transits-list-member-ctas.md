# Task 02 - Update Transits List Member CTAs

- Status: Planned
- Priority: P0
- Area: UI / Monthly Transit List
- Route: `/community/transits`

---

## Goal

Make full monthly report entry member-specific.

The global `Open Full Monthly Report` CTA should be removed or de-emphasized because the full report depends on which member is selected.

## Required Behavior

For each current-month `monthly_transits` summary card:

- Show member name and lightweight current-month summary as today.
- Add one primary full-report CTA:
  - `Generate Full Report` if no valid `full_report_id` exists.
  - `View Full Report` if a valid saved full report exists.
  - `Retry Full Report` if full report status failed.
  - `Regenerate Full Report` only as explicit secondary action.

CTA URL:

```txt
/community/transits/detailed?familyMemberId=<family_member_id>&month=YYYY-MM
```

## Data Requirements

Fetch these fields from `monthly_transits`:

```txt
id
family_member_id
month
transit_data
full_report_id
full_report_status
full_report_generated_at
community_family_members.full_name
```

Use `deriveMonthlyReportState(...)` for full-report CTA state.

## Acceptance Criteria

- [ ] Each member card has its own full-report CTA.
- [ ] Top global CTA is not the primary way to open a report.
- [ ] CTA includes `familyMemberId` and `month`.
- [ ] Full-report status comes from `full_report_id/full_report_status`, not `transit_data`.
- [ ] Lightweight summary display remains unchanged.
