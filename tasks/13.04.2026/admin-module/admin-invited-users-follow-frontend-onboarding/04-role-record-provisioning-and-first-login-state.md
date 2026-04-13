# 04 Role Record Provisioning and First Login State

## Goal

Define what must exist before an invited user first logs in and how first-login state is resolved.

## Product Rule

Admin invitation may provision the minimum required role record, but it must still leave the user in an incomplete state until frontend onboarding is finished.

Examples:

- `onboarding_completed = false`
- pending membership or role metadata present
- no direct dashboard access until completion

## Deliverables

- minimal provisioning rules by role
- first-login state requirements
- onboarding-completed lifecycle expectations
