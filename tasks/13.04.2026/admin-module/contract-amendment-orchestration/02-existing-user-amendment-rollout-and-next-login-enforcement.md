# Task 02: Existing-User Amendment Rollout and Next-Login Enforcement

## Goal

Force targeted existing users to accept amendments the next time they log in.

## Why This Is Needed

This is the core requested behavior:

- admin adds an amendment
- existing users in one or more roles must accept it on next login

## Required Flow

### 1. Target set resolution

For each amendment rollout, resolve affected users from:

- one role
- multiple roles
- current active holders of those roles

### 2. Pending amendment queue

Create a user-facing pending requirement record such as:

- `user_contract_requirements`

with state like:

- pending
- accepted
- waived
- superseded

### 3. Login interception

On next login, if the user has any blocking pending amendment:

- redirect them to the amendment acceptance flow
- block entry into role-protected application areas until completed

### 4. Existing-user only behavior

The rollout should snapshot the intended existing-user audience at issuance time or follow a documented rule for ongoing membership.

The platform must choose one of these explicitly:

- snapshot current users only
- or continuously target all users created before a cutoff date

## Acceptance Criteria

- existing targeted users are forced into amendment acceptance on next login
- enforcement is role-aware and deterministic
- the amendment queue is explicit and auditable
