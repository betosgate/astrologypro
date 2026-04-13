# 03 Stepper and Post Signup Service Selection Flow

## Goal

Make the post-signup stepper show services based on the assigned package capability.

## Required Behavior

If package is:

- `both` → show astrology and tarot setup paths
- `astrology_only` → show astrology only
- `tarot_only` → show tarot only

## Current Gap

The stepper is not yet formally tied to package capability.

That creates drift between:

- what a user bought or was assigned
- what setup options they see

## Deliverables

- stepper branching rules
- service-selection step requirements
- copy rules by package type
