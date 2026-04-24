# Perennial Mandalism Community Signup Flow

This document details the end-to-end technical flow for the Perennial Mandalism (PM) Community signup process, starting from the discovery page.

## 1. Discovery & Plan Selection
- **Route**: `/get-started`
- **Source**: `src/app/get-started/page.tsx`
- **Function**: Displays available pricing plans for the community.
- **Data Source**: Fetches live pricing from `/api/pricing?keys=perennial_mandalism_community`.
- **User Action**: 
  - Selects a plan: **Individual**, **Couple**, or **Family**.
  - Enters household member details (name, email, birth data) for themselves and any additional members included in the plan.

## 2. Checkout Initiation
- **Action**: User clicks the "Join Community" button.
- **API Call**: `POST /api/perennial-signup/checkout`
- **Source**: `src/app/api/perennial-signup/checkout/route.ts`
- **Logic**:
  1. **Validation**: Rigorously validates all household member data (emails, phones, birth details).
  2. **Persistence**: Saves the entire validated payload into the `pending_perennial_signups` table. This acts as a "buffer" to ensure data is not lost if the payment session is interrupted.
  3. **Stripe Session**: Creates a Stripe Checkout session in `subscription` mode.
  4. **Base URL Resolution**: Dynamically derives return URLs based on the request origin (supports localhost, staging, and production).
  5. **Response**: Returns the Stripe `checkout_url`.

## 3. Stripe Payment Phase
- **Mechanism**: User is redirected to the Stripe hosted checkout page.
- **Success Redirect**: `${baseUrl}/perennial-signup/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel Redirect**: `${baseUrl}/perennial-signup?cancelled=1`

## 4. Webhook Fulfillment (Asynchronous)
- **Event**: `checkout.session.completed`
- **Webhook Route**: `src/app/api/stripe/webhooks/route.ts`
- **Handler**: `handlePerennialSignupCheckoutCompleted`
- **Provisioning Logic** (`src/lib/perennial/household-provisioning.ts`):
  1. **Auth Creation**: Creates a Supabase Auth user for every household member. If a user already exists with that email, the existing record is reused.
  2. **Credential Delivery**: Generates a cryptographically strong temporary password for NEW users and sends it via email.
  3. **Community Enrollment**: Upserts `community_members` records for all members, capturing the plan type and linked stripe subscription ID.
  4. **Family Linkage**: Creates links in the `community_family_members` table to establish the household relationship and facilitate "Family Management" UI.
  5. **Natal Readiness**: Calls `provisionNatalReadiness` to queue the primary member's natal chart generation immediately.
  6. **Contract Orchestration**: Triggers `ensureUserContractRequirements` for the primary user.

## 5. Post-Payment Redirection & Legal Compliance
- **Transition**: The user returns to the success page and is redirected to the `/community` portal.
- **Layout Guard**: `src/app/community/layout.tsx`
- **Legal Redirect**:
  - The layout calls `getPendingContractDestination`. 
  - If the user has unsigned contracts (triggered by the webhook), they are forced to `/community/legal/{requirement_id}`.
  - Access to the dashboard is blocked until legal requirements are fulfilled.

## 6. Onboarding Wizard
- **Final Gate**: If `community_members.onboarding_completed` is `false`, the user is caught by the `OnboardingGuard`.
- **Route**: `/community/onboarding`
- **Source**: `src/app/community/onboarding/page.tsx`
- **Logic**:
  1. **Prefill**: Calls `/api/community/onboarding/prefill` to pull data already captured during the signup/webhook steps.
  2. **Questionnaire**: User provides additional community-specific info (questionnaire, address confirmation).
  3. **Completion API**: Calls `POST /api/community/onboarding/complete`.
  4. **Final Sync**: Sets `onboarding_completed = true` and unlocks the full dashboard.

## 7. Dashboard Access & Portal Switching
- **Portal Entry**: Once both contracts and onboarding are complete, the user has full access to `/community`.
- **Portal Toggling**: Users who also hold other roles (like Trainee or Diviner) can use the **Role Switcher** in the header to jump between portals.

---

## Appendix: Database Architecture

For the Perennial Mandalism community, data is distributed across several key tables to handle identity, billing, and household relationships:

### 1. Core Membership & Profile
| Table | Description |
| :--- | :--- |
| `community_members` | Primary identity table for PM. Stores names, emails, membership status, and onboarding progress. |
| `community_family_members` | Stores household relationships (Spouse, Child, etc.) for Couple/Family plans. |
| `auth.users` | Supabase internal table managing credentials and authentication state. |

### 2. Payments & Subscriptions
| Table | Description |
| :--- | :--- |
| `community_members` | Contains the `stripe_subscription_id` and `pm_tier_id` for live billing linkage. |
| `pending_perennial_signups` | A buffer table that stores checkout data temporarily until the Stripe webhook confirms payment success. |

### 3. Legal & Compliance
| Table | Description |
| :--- | :--- |
| `user_contract_requirements` | Tracks required legal actions (e.g., signing the Community Agreement) for the PM role. |
| `legal_acceptances` | Records the raw log of a user accepting a specific legal document version. |
| `signed_agreement_artifacts` | Stores the final snapshot/record of the signed agreement with the signer's details. |

### 4. Content & Automation
| Table | Description |
| :--- | :--- |
| `community_family_members` | Tracks the `natal_status` for every household member to trigger automated chart generation. |
| `pm_plan_tiers` | Defines the specific features and entitlements associated with the community tiers. |
