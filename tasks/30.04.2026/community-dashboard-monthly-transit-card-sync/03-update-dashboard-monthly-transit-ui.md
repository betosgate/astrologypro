# 03 - Update Dashboard Monthly Transit UI

- Status: Planned
- Priority: P0
- Area: UI / Community Dashboard
- File: `src/components/community/astro-charts-section.tsx`

---

## Goal

Render multiple dashboard Monthly Transit entries when multiple household members have current-month transit state.

## Required Behavior

- Store `monthlyTransits[]` in component state.
- Keep legacy `monthlyTransit` fallback during rollout.
- Show a carousel or compact list for multiple entries.
- Show member name, month, status, and CTA.
- Link CTA to:

```txt
/community/transits/detailed?familyMemberId=<family_member_id>&month=<YYYY-MM>
```

## CTA Rules

- `View Transit Report` when `full_report_id` exists.
- `Generate Transit Report` when no full report exists but summary/current member is eligible.
- `Retry Transit Report` when `full_report_status === "failed"`.
- `Generating...` disabled when summary generation is pending.

## UI Notes

- Match the existing dashboard card density.
- If multiple entries exist, mirror the Natal Charts carousel pattern where appropriate.
- Avoid a large new dashboard section.
- Keep text concise.

## Acceptance Criteria

- [ ] Two generated transit rows show as two dashboard entries or carousel positions.
- [ ] Single transit row still renders cleanly without unnecessary controls.
- [ ] Empty state still links to `/community/transits`.
- [ ] Failed state is only global when the API itself fails, not when one row is invalid.
