# Task 04: Admin Amendment Management for One or Multiple Roles

## Goal

Give admin a backend control surface to issue amendments by role scope and manage their rollout.

## Why This Is Needed

The request explicitly says admin can do this for one or multiple roles and manage the whole process.

## Required Admin UX

### 1. Amendment creation flow

Admin should be able to choose:

- target role or roles
- contract family
- amendment title
- amendment content
- effective date
- whether it is existing-user-only
- whether a consolidated future-user agreement already exists or will be created later

### 2. Rollout preview

Before launch, admin should see:

- affected role set
- number of existing users impacted
- number of users already satisfied if any

### 3. Activation behavior

Admin should be able to:

- draft amendment
- activate amendment
- pause rollout if needed
- supersede amendment if replaced

### 4. Consolidation support

Admin should also be able to mark a newer agreement as the consolidated path for new users after the amendment rollout.

## Acceptance Criteria

- admin can target amendments by one or multiple roles
- admin can manage rollout state from backend tools
- amendment rollout and future-user agreement path are both controllable
