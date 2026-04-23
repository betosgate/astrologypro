# 04 Date Selection And Diviner Resolution

## Goal

Resolve available diviners only after the user picks a date.

## Required Behavior

After date selection:

1. compute which compatible diviners have availability on that date
2. compute which matched service row should be used per diviner
3. branch behavior:
   - zero matches: show a no-availability state and let the user choose another date
   - one match: allow direct continuation without a manual diviner-picker step
   - multiple matches: show explicit diviner choice cards/list

## Diviner Selection UI

When multiple diviners match:
- show only diviners available for the chosen date
- include enough context to choose responsibly:
  - display name
  - certification state if relevant
  - rating / sessions if already available in current data contracts
  - service price or duration if meaningful

Do not overload the screen with unrelated directory features.

## Ranking Rule

Claude should define deterministic ranking for same-date matches.

Suggested order:
1. availability quality / earliest useful slot
2. certified
3. rating
4. completed sessions
5. price

If a different ranking is used, Claude must justify it from the current flow.

## Acceptance Criteria

- selecting a date narrows the set to date-available compatible diviners
- one-match and multi-match states are both handled properly
- user only chooses a diviner when that choice is actually necessary

