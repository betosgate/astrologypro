# Task 06 - Month Rollover And Cleanup Rules

- Status: Planned
- Priority: P0
- Area: Data Lifecycle / Monthly Transits

---

## Goal

Preserve existing business logic for monthly report lifecycle while adding member-specific full reports.

## Business Rules

- On the 1st day of each month, current-month summaries generate automatically for active subscribed users and eligible family members.
- If a user joins after the 1st day, current-month summaries must still be created through catch-up.
- If a family member becomes eligible mid-month, current-month summary must be created through catch-up.
- User-facing monthly transits are current-month only.
- Previous month rows/reports should be removed, ignored, or marked non-current according to existing cleanup behavior.

## Implementation Requirements

- Do not break `ensureCurrentMonthTransitsForMember(...)`.
- Do not treat old month `full_report_id` as valid for current month.
- Saved full report identity must include:

```txt
family_member_id
month: YYYY-MM
toolname: tropical_transits_monthly_v3
```

- If cleanup deletes old `monthly_transits` rows, linked old `astro_ai_responses` artifacts may remain unless existing cleanup policy deletes them.

## Acceptance Criteria

- [ ] First-of-month summary generation still works.
- [ ] Mid-month catch-up still works.
- [ ] Current month page never opens previous month as current report.
- [ ] Full report View only applies to selected member/current month.
- [ ] Old month saved full report does not satisfy current month CTA.
