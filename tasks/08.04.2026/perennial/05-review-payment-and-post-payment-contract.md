# Perennial Review, Payment, And Post-Payment Contract

- Status: Ready For Implementation
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Frontend
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/05-review-payment-and-post-payment-contract.md`

## Goal

Define the frontend review/payment stage clearly enough that the implementing AI can wire a correct UI without inventing business rules.

## Confirmed Business Rules

1. The signup is completed as a full household flow before payment.
2. Membership must become active only after successful Stripe payment.
3. No member records should be committed as active before payment succeeds.
4. The frontend should treat the signup data as pre-payment state until payment success.
5. After payment succeeds:
   - all member accounts are created
   - all member accounts are active immediately
   - generated passwords are emailed automatically

## Required Review Step

Before payment, the page must give the user a review state that clearly shows:

1. selected plan
2. household member count
3. primary billing owner
4. all member names and emails
5. monthly price
6. generated-password-by-email note

The review step should make it easy to go back and edit before paying.

## Payment UX Requirements

1. The payment stage must feel like the final conversion step of the signup.
2. The UI must communicate that account creation completes only after successful payment.
3. The page must communicate that login credentials will be emailed after payment.
4. The billing owner should be clearly identified.
5. Non-billing members should not be framed as payment managers.

## Loading And Error Handling

The implementation must define clear states for:

1. preparing payment
2. payment in progress
3. payment success
4. payment failure
5. retry after failure

## Required Success Messaging

On successful payment, the UX must communicate:

1. the household membership is now active
2. each member account has been created
3. login credentials will be sent by email
4. only the primary member manages billing

## Required Failure Behavior

If payment fails:

1. do not present the membership as active
2. do not present accounts as created
3. preserve the entered household data in frontend state if possible
4. allow retry or correction without forcing a full restart

## Integration Contract Notes

The implementing AI must assume the frontend will eventually hand off a structured payload containing:

1. selected plan
2. primary member data
3. additional member data
4. billing-owner designation
5. questionnaire data

But the frontend must not hardcode contradictory assumptions such as:

1. only one real user exists
2. users type passwords manually
3. membership activates before payment

## Acceptance Criteria

1. the page includes a clear review-before-payment stage
2. payment copy matches the confirmed business rules
3. failure states do not falsely imply active membership
4. success state clearly communicates account creation and emailed credentials
5. the frontend state model reflects post-payment provisioning rather than pre-payment activation
