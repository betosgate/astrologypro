# 03 Stepper Prefill and Invited User Context

## Goal

Define how the frontend stepper should behave when the user arrived through an admin invite.

## Recommended Rule

The stepper should be the same flow, but it may be prefilled with known invite context such as:

- role
- invited email
- display name if known
- assigned plan or package if already chosen

The user experience should feel native, not like a separate admin shortcut flow.

## Deliverables

- prefill rules
- invited-user context flags
- frontend copy rules for invited users
