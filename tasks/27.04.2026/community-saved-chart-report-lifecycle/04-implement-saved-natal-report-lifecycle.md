# Task 04 - Implement Saved Natal Report Lifecycle

- Status: Planned
- Priority: P0
- Area: Community Natal / Family Charts
- Routes: `/community/horoscope`, `/community/family`, `/community/family/[id]`

---

## Goal

Make self and family natal chart flow behave as:

```txt
Generate Chart -> save full report -> View Chart -> load saved report -> Regenerate when requested
```

## Current Problem

`/community/family/[id]` can render a live `western_horoscope_v2` toolkit report, but that does not automatically save or link the report to the family member.

So a user can see a generated report while `/community/family` still shows Generate Chart.

## Required Behavior

When a user generates a natal report:

- generate through the production `western_horoscope_v2` toolkit flow
- save full report to `astro_ai_responses`
- link saved report to `community_family_members`
- update domain lifecycle state
- make `/community/family` show View Chart

When a user views a saved natal report:

- fetch the saved report by linked id
- hydrate the same UI/data structure shown after generation
- do not re-call external compute/AI APIs just to view

When a user regenerates:

- explicitly rerun generation
- save/update the full report artifact
- update family member linkage and timestamps
- preserve retry/locked-for-review rules where applicable

## Acceptance Criteria

- [ ] Self natal supports saved full report lifecycle.
- [ ] Added family member natal supports saved full report lifecycle.
- [ ] Vinnie-style case is fixed: after generation, list shows View Chart.
- [ ] View Chart reads saved DB report, not live regeneration.
- [ ] Generated and viewed UI are identical.
- [ ] Regenerate refreshes the saved artifact and domain linkage.
- [ ] Old valid `natal_chart` rows remain usable during rollout.
- [ ] Old/dummy/invalid natal rows do not count as complete.
