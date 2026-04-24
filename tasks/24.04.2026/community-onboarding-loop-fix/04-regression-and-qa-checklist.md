# Task 04 - Regression And QA Checklist

- Status: Planned
- Priority: P0
- Area: Perennial Mandalism / QA

---

## Goal

Verify the immediate loop fix without mixing in larger checkout architecture changes.

## Manual QA - Primary Flow

Use a PM user with:

- `membership_type = perennial_mandalism`
- `membership_status = active`
- `onboarding_completed = false`

Steps:

1. Log in as the PM user
2. Confirm login redirects to `/community/onboarding`
3. Complete all required onboarding fields
4. Submit onboarding
5. Confirm the browser lands on `/community`
6. Confirm the full dashboard layout appears
7. Refresh `/community`
8. Confirm the user stays on dashboard and does not return to onboarding

## Manual QA - Guard Still Works

Use or reset a PM user with:

`onboarding_completed = false`

Steps:

1. Navigate directly to `/community`
2. Confirm the user is redirected to `/community/onboarding`
3. Confirm this protection still works after the code change

## Manual QA - API Failure

Submit the onboarding form with missing required data.

Confirm:

- The API does not set `onboarding_completed = true`
- The UI shows an error
- The user is not sent to `/community`

## Manual QA - Returning Completed Member

Use a PM user with:

`onboarding_completed = true`

Confirm:

- Login goes to `/community`
- Direct navigation to `/community/onboarding` is not required for dashboard access
- Refreshing `/community` stays on dashboard

## Acceptance Criteria

- [ ] The infinite loop is fixed
- [ ] The onboarding guard still protects incomplete users
- [ ] Failed onboarding saves do not redirect
- [ ] Completed users consistently reach the dashboard
- [ ] No unrelated signup/payment behavior is changed in this hotfix

