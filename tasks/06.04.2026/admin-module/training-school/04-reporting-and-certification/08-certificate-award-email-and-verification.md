# Module 08 - Certificate Award, Email, and Verification

- Status: Completed (2026-04-08, verified)
- Completion Notes: src/lib/training/graduation.ts:108 issues random certificate_code; verification at src/app/api/certificate/verify/[code]/route.ts; email via sendProgramComplete.

## Objective
Finalize the certificate lifecycle so certificates are issued only after true final training completion and remain downloadable and verifiable.

## Current Repo State
- Trainee certificate page already exists.
- Certificate verification by code already exists.
- Current lesson-completion flow contains graduation/certificate behavior.

## Exact Gap
- Current certificate issuance may still be tied to older lesson-quiz completion behavior.
- Final graduation must be aligned with the post-trigger-quiz completion model, not the legacy path.

## Required Implementation
- Revalidate and update the final graduation trigger so it fires only when:
  - all required lessons are complete
  - all required categories are complete
  - the required program/training completion state is satisfied
- Keep using the current graduation and certificate fields where possible:
  - `training_status`
  - `graduated_at`
  - `certificate_code`
- Make certificate issuance idempotent so repeated completion route calls do not send duplicate graduation events.
- Ensure the completion email contains a stable certificate download path.
- Keep current certificate verification behavior working for newly completed users.

## Likely Affected Files
- `src/app/api/trainee/training/lessons/[id]/complete/route.ts`
- `src/app/api/trainee/training/lessons/[id]/quiz/route.ts`
- `src/app/api/trainee/check-graduation/route.ts`
- `src/app/trainee/certificate/page.tsx`
- `src/app/api/certificate/verify/[code]/route.ts`
- email helper(s) tied to graduation/certificate sending

## API and Schema Constraints
- Keep current certificate verification route.
- Keep current certificate-related columns unless a true missing field blocks the requirement.
- Do not create a second certificate system.

## Dependencies
- Execute after Modules 04 and 05.

## Acceptance Criteria
- Certificate is issued only after true final completion.
- Certificate email is delivered with a valid download path.
- Verification continues to work for issued certificates.

## Verification Test Plan
- [ ] Complete the final required training path and confirm one certificate issuance event.
- [ ] Repeat the completion-triggering request and confirm no duplicate issuance occurs.
- [ ] Verify the learner receives the expected email with a working download link.
- [ ] Verify the learner certificate page renders correctly.
- [ ] Verify public certificate code validation still works.

## Out Of Scope
- redesign of certificate visuals
- admin resend tooling unless required during implementation
