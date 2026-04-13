# 01 Thresholds and Visibility Rules

## Goal

Define when the dashboard must show a high-emphasis completion block versus a softer progress indicator.

## Current Gap

The repo already has completion logic and some progress visuals, but the product rule for emphasis is not explicit.

Without thresholds, the UI risks being:

- too passive for users who are actually blocked
- too noisy for users who are mostly complete

## Recommended Visibility States

### Critical incomplete

Show a prominent warning or action block when missing data blocks:

- natal chart creation
- monthly transit readiness
- household invite completion
- onboarding completion

### Incomplete but not blocked

Show a secondary encouragement block when:

- profile is incomplete
- but no immediate feature is blocked

### Complete

Hide the emphasis block and optionally show a success state or no block at all.

## Recommended Threshold Model

- `critical`: required gating fields missing
- `important`: completion below product target, for example below `80%`
- `complete`: required fields satisfied

The decisive rule should be based on missing required fields, not just a raw percentage.

## Deliverables

- threshold definitions
- rules for critical versus advisory prompts
- per-role visibility matrix

## Status

Done.

The community dashboard already separates hard onboarding gating from softer completion prompts. `src/app/community/layout.tsx` and `src/components/community/onboarding-guard.tsx` enforce the critical incomplete state, while `src/components/community/profile-completion-card.tsx` and `src/components/community/profile-progress-section.tsx` cover the advisory state for incomplete but active members.
