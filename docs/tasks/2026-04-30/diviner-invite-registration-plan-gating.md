# Diviner Invite, Registration, Plan Selection, and Access Gating

## Purpose

Build a complete invited-diviner onboarding flow that starts from `/admin/invitations`, sends a branded diviner invitation email, routes the invited user into `/join/diviner`, requires plan selection and payment before dashboard access, and keeps admin invitation status in sync with real onboarding progress.

This task should produce one coherent journey, not separate partial screens.

## Desired Outcome

An admin invites a diviner from `/admin/invitations`.

The invited person receives the project-branded invitation email and clicks `Accept Invitation`.

They land on `/join/diviner` with their email prefilled.

They register their diviner account successfully.

Immediately after registration, they are sent to a dedicated plan-selection page built from the same content and pricing structure currently shown in the trainee dashboard "Become a Diviner" modal.

They cannot enter the diviner dashboard until they choose a plan and successfully complete payment.

Admin can see the invitation status change from:

- `Pending` -> invitation sent but account not registered
- `Active` -> diviner account registered but plan/payment not completed
- `Completed` -> plan selected and payment completed

If a diviner has already registered but has not completed payment, any future login attempt must send them back to the plan page until payment is successful.

## Scope

This task covers:

- Admin invitation flow for role `diviner`
- Invitation email destination for diviners
- Diviner registration page completion
- New diviner plan-selection page
- Payment handoff from plan page
- Access gating before diviner dashboard entry
- Invitation status updates in admin
- Login redirect behavior for unpaid diviners

This task does not require redesigning non-diviner invite flows unless necessary for shared infrastructure.

## User Flow

### 1. Admin invites a diviner

Route:

- `/admin/invitations`

Behavior:

- Admin opens `Invite User`
- Chooses role `Diviner`
- Sends invitation
- Invitation row appears with status `Pending`

### 2. Invited diviner opens invitation

Behavior:

- Email uses the project-branded template
- `Accept Invitation` sends diviner invites to `/join/diviner`
- Query string includes at least:
  - `email`
  - `inviteToken`

Example:

`/join/diviner?email=user@example.com&inviteToken=...`

### 3. Diviner registers account

Route:

- `/join/diviner`

Behavior:

- Email field is prefilled from query param
- Registration completes the invited account creation flow
- Invitation status changes from `Pending` to `Active`
- User is not sent to dashboard yet
- User is redirected to the new plan page

### 4. Diviner chooses a plan

New route to create:

- `/join/diviner/plan`

Behavior:

- Page content should be based on the trainee dashboard "Become a Diviner" modal
- Convert modal content into a full page experience
- Preserve project theme, plan names, pricing, and value messaging
- User must choose one plan before continuing

### 5. Diviner pays for selected plan

Behavior:

- Payment flow should start from the plan page
- After successful payment:
  - mark invitation as `Completed`
  - mark diviner as paid/unlocked
  - allow entry to the diviner dashboard
- Redirect to diviner dashboard after success

### 6. Diviner logs in later without payment

Behavior:

- If registration exists but payment is incomplete:
  - login succeeds
  - redirect goes to `/join/diviner/plan`
  - dashboard remains blocked

### 7. Diviner logs in after payment

Behavior:

- If payment is complete:
  - login redirects to the normal diviner dashboard

## Required Product Rules

### Invitation statuses

Use these meanings:

- `Pending`: invited, not registered
- `Active`: registered, no paid plan yet
- `Completed`: registered and paid

If the current `invitations.status` column does not support these values cleanly, extend the model in a backward-compatible way.

### Access gate

The diviner dashboard must remain locked until successful plan payment is confirmed.

This gate must work for:

- first-time redirect after registration
- normal login on later days
- direct URL access attempts to dashboard routes

### Plan source of truth

The new plan page must use the same offer structure as the trainee dashboard "Become a Diviner" modal, not a separate manually duplicated pricing definition if avoidable.

Prefer one shared configuration source for:

- plan name
- subtitle
- price
- setup fee
- recurring fee
- badges
- plan descriptions
- unlocked benefits

## Implementation Requirements

### A. Finish invited diviner registration

Current state:

- `/join/diviner` exists as a styled page
- invitation email already routes diviner invites there with `email`

Needed:

- consume `inviteToken`
- create/authenticate the invited user correctly
- create the diviner record
- associate the invitation with the created user
- move admin invitation state to `Active`

### B. Create a full plan page from the trainee modal

Source behavior to reuse:

- trainee dashboard `Become a Diviner` modal

Needed:

- convert modal content into page layout
- support selected plan state
- support payment CTA
- support post-payment success handling

### C. Payment and entitlement persistence

Needed:

- durable record of selected plan
- durable record of whether payment succeeded
- durable record of whether dashboard access is unlocked

Recommended implementation:

- introduce a dedicated onboarding/payment state for diviners rather than inferring everything from UI only

### D. Login and route protection

Needed:

- post-login redirect logic must detect unpaid invited diviners
- protected diviner routes must redirect unpaid diviners to `/join/diviner/plan`
- paid diviners continue to dashboard normally

### E. Admin invitations list behavior

Route:

- `/admin/invitations`

Needed:

- status labels reflect real onboarding progress
- list filters and badges continue working with new status values
- resend/cancel behavior remains safe

## Suggested Technical Design

### 1. Introduce an onboarding/payment state model

Recommended fields, either on `invitations`, `diviners`, or a dedicated onboarding table:

- `invite_role`
- `registration_completed_at`
- `selected_plan_key`
- `payment_status`
- `payment_completed_at`
- `dashboard_unlocked_at`

Suggested normalized state machine:

- `pending_invite`
- `registered_unpaid`
- `paid_active`

Admin UI can map these internal states to:

- `Pending`
- `Active`
- `Completed`

### 2. Reuse pricing configuration

Extract the trainee modal plan data into a shared module that can be used by:

- trainee dashboard modal
- `/join/diviner/plan`
- payment initiation logic

This avoids pricing drift.

### 3. Keep invitation token useful through registration

The registration page should preserve the invitation token until the account is successfully created and linked.

Avoid losing the token during redirects.

### 4. Gate dashboard on server side

Do not rely on client-only checks.

Enforce the gate in:

- post-login redirect resolver
- diviner dashboard layout or server route guard

## Acceptance Criteria

1. Admin invites a diviner from `/admin/invitations`.
2. Invitation email is project-branded and polished.
3. Clicking `Accept Invitation` opens `/join/diviner` with email prefilled.
4. Registering as a diviner changes admin invitation status to `Active`.
5. Registration redirects to a full plan page, not the dashboard.
6. Plan page content matches the current trainee "Become a Diviner" modal content and pricing.
7. After payment success, admin invitation status changes to `Completed`.
8. After payment success, the user may enter the diviner dashboard.
9. If the user registers but does not pay, login always redirects to the plan page.
10. If the user tries to open diviner dashboard routes directly before payment, access is blocked and redirected to the plan page.
11. Existing non-diviner invitation flows continue to work.

## Files Likely Involved

- `src/app/admin/invitations/page.tsx`
- `src/components/admin/invitations-client.tsx`
- `src/app/api/admin/invitations/route.ts`
- `src/app/api/admin/invitations/[id]/resend/route.ts`
- `src/app/join/diviner/page.tsx`
- new `src/app/join/diviner/plan/page.tsx`
- current trainee dashboard modal source for "Become a Diviner"
- login redirect resolver
- diviner dashboard route/layout protection
- payment/checkout integration files

## Risks to Watch

- Pricing duplicated in multiple places and drifting later
- Invitation status logic overloaded onto an existing column without clear migration rules
- Client-only gating that can be bypassed by direct URL access
- Registration success happening before invitation/user linkage is stored
- Payment success not updating the invitation/admin state

## Recommended Delivery Order

1. Extract shared plan configuration from trainee modal.
2. Add persistent invited-diviner onboarding state model.
3. Finish `/join/diviner` registration using `inviteToken`.
4. Add `/join/diviner/plan` page using shared plan configuration.
5. Wire payment success -> unlock diviner dashboard.
6. Add login redirect and protected-route gating for unpaid diviners.
7. Update admin invitation statuses and filters.
8. Run end-to-end QA for invite -> register -> choose plan -> pay -> dashboard.

## QA Scenarios

### Happy path

- Invite diviner
- Open email
- Register account
- See admin status become `Active`
- Choose plan
- Pay successfully
- See admin status become `Completed`
- Enter diviner dashboard

### Unpaid login gate

- Invite diviner
- Register account
- Close browser before payment
- Log in again
- Confirm redirect to `/join/diviner/plan`
- Confirm dashboard remains blocked

### Direct dashboard access before payment

- Register but do not pay
- Open a diviner dashboard URL directly
- Confirm redirect to plan page

### Admin visibility

- Confirm invitation row status text is correct in all three stages
- Confirm resend still sends the correct branded email

## Definition of Done

This task is complete only when the invited diviner flow is fully enforceable from admin invite through paid dashboard access, with no path that allows an unpaid invited diviner to reach the diviner dashboard.
