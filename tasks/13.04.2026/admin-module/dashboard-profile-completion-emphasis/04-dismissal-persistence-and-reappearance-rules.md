# 04 Dismissal Persistence and Reappearance Rules

## Goal

Define whether users can dismiss the dashboard block and when it should return.

## Recommended Product Rule

If the block is tied to a critical missing requirement, it should not be permanently dismissible.

Recommended behavior:

- users may collapse it for the session
- it reappears on next visit until the blocking fields are resolved

## Why

If profile incompleteness blocks:

- chart generation
- personalized content
- onboarding completion

then allowing permanent dismissal would hide a real product problem instead of solving it.

## Non-Critical Case

For softer encouragement prompts:

- allow temporary dismissal
- re-show after a time window or when completion drops again

## Deliverables

- dismissal rules by severity
- session versus persistent behavior
- reappearance triggers

## Status

Done.

Critical onboarding prompts are intentionally non-dismissible because `src/app/community/layout.tsx` keeps incomplete members inside the onboarding guard until completion. Advisory completion prompts are not permanently dismissible either; they are derived from live completion state and automatically step down only when the underlying missing data is resolved.
