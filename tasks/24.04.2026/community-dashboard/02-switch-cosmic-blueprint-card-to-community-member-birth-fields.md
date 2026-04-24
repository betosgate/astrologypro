# Task 02 - Switch Cosmic Blueprint Card To Community Member Birth Fields

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Frontend
- Page Route: `/community`
- Primary File: `src/app/community/page.tsx`

---

## Objective

Update the logged-in PM member's cosmic blueprint card so it derives natal-readiness from the PM member record already loaded on the dashboard.

## Problem

The dashboard already derives these booleans from `community_members`:

- `hasDob`
- `hasBirthTime`
- `hasBirthCity`

But the cosmic blueprint card later ignores them and re-checks the same concept using the `clients` query:

```ts
if (!client?.birth_date) ownChartMissingFields.push("date of birth");
if (!client?.birth_time) ownChartMissingFields.push("birth time");
if (!client?.birth_city) ownChartMissingFields.push("birth city");
```

This is the bug.

## Required Change

Replace the card's own-chart readiness logic so it uses:

- `hasDob`
- `hasBirthTime`
- `hasBirthCity`

Recommended target shape:

```ts
const ownChartMissingFields: string[] = [];
if (!hasDob) ownChartMissingFields.push("date of birth");
if (!hasBirthTime) ownChartMissingFields.push("birth time");
if (!hasBirthCity) ownChartMissingFields.push("birth city");
const ownChartReady = ownChartMissingFields.length === 0;
```

## Scope

- Change only the logged-in PM member's own cosmic blueprint readiness logic
- Keep the rest of the dashboard behavior intact
- Do not rewrite family-member logic in this task

## Implementation Notes

- Prefer reusing the already-derived member booleans instead of recomputing them
- Remove any unnecessary dependency on the `clients` birth-data fields for this specific card
- Keep the ready-state route as `/community/horoscope`
- Keep the incomplete CTA route as `/community/profile`

## Acceptance Criteria

- [ ] A PM member with all three `community_members` birth fields present sees the ready state
- [ ] A PM member missing only one field sees only that field listed
- [ ] The card no longer depends on `clients.birth_date`, `clients.birth_time`, or `clients.birth_city`
- [ ] No family-member behavior changes in this task

