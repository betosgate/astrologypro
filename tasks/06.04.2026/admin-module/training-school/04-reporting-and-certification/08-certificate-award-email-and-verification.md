# Module 08 - Certificate Award, Email, and Verification

## Objective
Ensure certificate issuance matches the true final completion rule for Training School and that the learner receives the downloadable certificate by email.

## Current State In Repo
- The app already has a trainee certificate page.
- Certificate verification already exists via certificate code.
- Lesson-completion flow currently contains auto-graduation and certificate notification behavior.
- The final graduation rule must be revalidated after the program/category/triggered-quiz completion logic is settled.

## Required Outcome
- When a learner completes all required training, the system issues the certificate and emails it to the learner.
- The certificate remains downloadable and verifiable.
- Graduation is not triggered early by the legacy quiz-complete path.

## Detailed Tasks
- [ ] Audit the current graduation trigger points and confirm whether they depend on the old lesson quiz model.
- [ ] Reconcile certificate issuance with the final definition of "training complete" after trigger-based quizzes and program/category completion rules are finalized.
- [ ] Validate whether `trainees.training_status`, `graduated_at`, and `certificate_code` already fully support the required lifecycle.
- [ ] Ensure the certificate email is sent exactly once per true completion event or is otherwise idempotent.
- [ ] Ensure the learner email contains a reliable download path.
- [ ] Validate the certificate verification route and code generation behavior for newly graduated users.
- [ ] Decide whether admin-side certificate resend tooling is needed if email delivery fails.

## Acceptance Criteria
- Completing all required training issues the certificate under the correct final rule.
- The learner receives an email with a usable certificate download path.
- Certificate verification remains functional for completed learners.

## Verification Test Plan
- [ ] Complete the final required training path for a test learner and confirm certificate issuance.
- [ ] Confirm only one graduation/certificate event is recorded for repeated completion-route calls.
- [ ] Verify the learner receives the expected email content and download link.
- [ ] Open the certificate page as the learner and confirm the certificate renders.
- [ ] Verify the public certificate verification route works with the issued code.
