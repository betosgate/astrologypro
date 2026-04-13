# Task 03: Post-Signup Contract Sequencing and Role Activation Gates

## Goal

Make signup and onboarding flows contract-aware so users cannot fully activate role capabilities until required contracts are signed.

## Why This Is Needed

Right now signup routes create the account and role profile directly. There is no centralized checkpoint that says:

- user has signed all required contracts for the selected roles
- role is pending until contract acceptance completes

## Required Flow

### 1. Signup result state

After signup, do not assume the role is fully ready.

Recommended state model:

- account created
- role requested or provisioned
- required contracts outstanding
- role pending activation
- role activated after acceptance completion

### 2. Multi-role contract queue

If a user signs up with multiple roles, build a contract queue after signup:

- contract 1
- contract 2
- contract 3

The user should complete all required contracts before being allowed into role-specific protected flows.

### 3. Feature gates

Examples:

- diviner cannot activate payouts or publish services until diviner agreement is signed
- affiliate cannot get referral links until affiliate agreement is signed
- telephony-specific role path cannot activate until telephony consent is signed

### 4. Resume behavior

If the user leaves midway, the system should resume at the next unsigned contract on next login.

## Files Likely In Scope

- signup endpoints
- onboarding completion routes
- post-login redirect logic
- role-activation logic

## Acceptance Criteria

- contract signing becomes a first-class post-signup flow
- missing contracts can block role activation cleanly
- multi-role users can be guided through multiple agreements in sequence
