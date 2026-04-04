# Align Package Purchase Type Branching And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: purchase-type branching, conditional validation, payload normalization
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/package-management/03-align-package-purchase-type-branching-and-submit-semantics.md`

## Goal

Ensure the Next package form preserves Angular’s purchase-type-specific behavior and payload semantics.

## Verified Current Code Truth

- Angular purchase types:
  - `single`
  - `multiple`
  - `subscription`
- Angular branching behavior:
  - `multiple` requires `sessions`
  - `subscription` requires `subscription_period`
  - `single` removes those extra branch fields
- Next form already branches UI for:
  - `sessions`
  - `subscription_period`
- Current Next schema does not strictly require those branch fields based on purchase type.
- Next submit path already conditionally includes `sessions` and `subscription_period`, but this should be tightened once webinar/image fields are added.

## User-Visible Problem

Admins in Next can reach purchase-type states that are looser than Angular’s current business rules, which risks incomplete package payloads.

## Required Behavior

1. `single` packages must not require or persist `sessions` or `subscription_period`.
2. `multiple` packages must require and persist `sessions`.
3. `subscription` packages must require and persist `subscription_period`.
4. Changing purchase type must clear invalid branch-specific values.
5. Add and edit payloads must remain backend-compatible.

## Tasks

1. Add purchase-type-aware conditional validation for `sessions` and `subscription_period`.
2. Clear or omit invalid branch values when purchase type changes.
3. Re-test submit payloads for `single`, `multiple`, and `subscription` package types.
4. Verify edit mode rehydrates branch fields correctly and clears stale values when purchase type is changed.

## Acceptance Criteria

- single packages omit sessions and subscription period
- multiple packages require sessions
- subscription packages require subscription period
- branch values clear or normalize correctly when purchase type changes
- add and edit payloads stay backend-compatible

## Verification Test Plan

1. Create a `single` package and confirm no stale branch fields are sent.
2. Create a `multiple` package and verify `sessions` is required and persists.
3. Create a `subscription` package and verify `subscription_period` is required and persists.
4. Edit a saved package, switch purchase types, and verify stale branch values are cleared or normalized correctly.
5. Reopen the edited package and confirm the saved branch state rehydrates correctly.

## Notion Summary

P1 business-rule gap: the Next Package form needs stricter purchase-type-specific validation and payload normalization so single, multiple, and subscription packages behave like Angular’s current admin flow.
