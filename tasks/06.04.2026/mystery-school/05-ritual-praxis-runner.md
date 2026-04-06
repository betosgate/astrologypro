# Module 05 - Ritual Praxis Runner

## Objective
Turn the current ritual display into a proper guided ritual runner with stronger step enforcement and admin publishing controls.

## Current State In Repo
- Ritual steps are stored in `decan_rituals`.
- Admins can add ritual steps.
- Students can read steps and manually click “Mark Ritual Complete”.

## Required Outcome
- Rituals are pre-authored and locked.
- Students move through them in order.
- Students cannot skip the process and simply self-certify completion.
- Admins can manage ritual publication/version state.

## Detailed Tasks
- [ ] Audit whether `decan_rituals` can be extended to support:
  - publish/unpublish
  - versioning
  - preview state
  - authored/updated metadata
- [ ] Define and enforce the intended ritual step sequence.
- [ ] Update admin ritual authoring flow so the required step structure is obvious and validated.
- [ ] Build student-facing ritual runner behavior:
  - Begin Ritual
  - step-by-step progression
  - one current step at a time
  - Complete Ritual
- [ ] Add full-screen or distraction-reduced mode if feasible within the current UI system.
- [ ] Prevent ritual completion unless the student has progressed through the entire sequence.
- [ ] Record enough execution state to avoid treating a single click as a valid ritual run.
- [ ] Decide whether repeat ritual runs need logging; if yes, extend schema minimally.
- [ ] Ensure students always see the current published ritual version.
- [ ] Add admin preview mode.

## Acceptance Criteria
- Ritual completion is tied to actual guided progression, not a single unchecked action.
- Admins can safely edit/publish rituals without breaking student experience.
- The ritual flow feels intentional and constrained.
