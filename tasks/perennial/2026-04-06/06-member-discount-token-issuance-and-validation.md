# Add Member Discount Token Issuance And Validation - 2026-04-06

- Status: Completed (2026-04-08, upstream)
- Completion Notes: Issuance: `src/app/api/community/discount-token/route.ts`. Validation: `.../discount-token/validate/route.ts`.
- Priority: P1
- Owner: Fullstack
- Scope: token creation, validation, expiry, usage state
- Estimate: 1-2 days
- Task File: `docs/tasks/perennial/2026-04-06/06-member-discount-token-issuance-and-validation.md`

## Goal

Implement token issuance and validation for the community-member cross-sell discount flow.

## Verified Current Code Truth

- The requirement document expects:
  - token creation from the monthly transit path
  - validation in AstrologyPro booking flow
- A verified implementation for:
  - `POST /api/community/discount-token`
  - `GET /api/astro/validate-token`
  is not currently exposed.

## Required Behavior

1. Active members can create a single-use token.
2. Tokens expire according to the requirement.
3. Used tokens are rejected.
4. Validation returns enough information for checkout pricing logic.

## Tasks

1. Add token persistence model.
2. Add token issuance endpoint.
3. Add token validation endpoint.
4. Add expiry and used-state enforcement.

## Acceptance Criteria

- active members can create tokens
- invalid, expired, or used tokens are rejected
- validation response is usable by checkout

## Verification Test Plan

1. Create a token as an active member.
2. Validate it successfully.
3. Expire or consume it and verify validation fails.

## Notion Summary

P1 token gap: the cross-sell discount flow needs the underlying token issuance and validation layer before checkout can apply the discount safely.
