# Task 03: New-User Consolidated Agreement Path

## Goal

Ensure new signups do not sign historical amendments separately and instead sign the current consolidated agreement path.

## Why This Is Needed

The requested rule is clear:

- existing users must accept the amendment
- new users should not sign that amendment separately
- new users should see the new agreement path another way

## Required Behavior

### 1. Current signup agreement resolution

At signup or onboarding time, the backend should resolve the agreement required for that role as:

- the latest consolidated applicable agreement

not:

- the old base agreement plus every historical amendment

### 2. Lineage closure

When admin creates an amendment and later rolls it into a new base or consolidated agreement, new users should be pointed only to that new consolidated artifact.

### 3. Multi-role signup behavior

If a new user signs up with multiple roles:

- resolve the latest consolidated agreement path per role
- collect the required current contracts only

Do not replay the old amendment chain to a new user.

## Acceptance Criteria

- future signups are not burdened with historical amendment steps
- new users sign the current agreement state for each role instead
