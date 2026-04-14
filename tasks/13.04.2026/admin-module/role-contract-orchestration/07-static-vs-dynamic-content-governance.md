# Task 07: Static vs Dynamic Content Governance

## Goal

Define which parts of contracts should stay static legal text and which parts should be dynamic variables, so the system remains maintainable and safe.

## Why This Is Needed

If everything becomes a variable, contracts become fragile and hard to review. If nothing becomes a variable, admin cannot manage common operational updates easily.

## Governance Rules

### 1. Static content

Keep these static by default:

- core legal obligations
- conduct rules
- dispute resolution clauses
- intellectual property clauses
- confidentiality clauses

### 2. Dynamic content

Make these dynamic where appropriate:

- signer name
- company name
- legal entity name
- effective date
- role title
- commission percentage display
- payout threshold
- support contact fields
- governing address blocks when organization-controlled

### 3. Change control

Dynamic variables should not be used to silently alter substantive legal meaning without versioning.

If a variable change materially changes obligations, require:

- new contract version
- fresh acceptance

### 4. Template hygiene

Prefer a small, controlled variable vocabulary. Do not allow arbitrary free-form placeholders to proliferate without review.

## Acceptance Criteria

- contract authors know what should be static versus dynamic
- dynamic fields remain easy to manage
- substantive legal changes still trigger proper versioning and acceptance

## Status

Done.
