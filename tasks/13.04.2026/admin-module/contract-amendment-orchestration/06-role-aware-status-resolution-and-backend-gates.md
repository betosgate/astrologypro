# Task 06: Role-Aware Status Resolution and Backend Gates

## Goal

Update legal-status resolution so backend systems can distinguish:

- current users pending amendment
- future users already on consolidated terms

## Why This Is Needed

Without that distinction, the platform will either:

- force new users through old amendment flows unnecessarily
- or fail to enforce amendments for existing users

## Required Logic

### 1. Contract-state resolver

Create a resolver that answers:

- what is this user’s current contract state for each role
- are there blocking amendments pending
- which agreement should a new signup see for that role

### 2. Backend gates

Use that resolver in:

- login redirect logic
- onboarding completion
- role activation
- protected role-specific APIs where appropriate

### 3. User messaging

If blocked, the user should see a clear message that they must accept an updated amendment to continue using that role.

## Acceptance Criteria

- existing-user and future-user paths are handled differently but consistently
- backend enforcement is centralized and not ad hoc

## Status

Done.
