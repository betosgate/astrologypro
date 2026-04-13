# Unified Signup Flow — Broken & Not Implemented Tasks

- Date: 2026-04-13
- Status: Open
- Priority: P0
- Owner: Full-stack

---

## Architecture (Source of Truth)

All plan types use the single `/get-started` page with the same basic signup form:
- Fields at signup: **email, name, password, username/URL only**
- User account is created in Supabase auth + role-specific DB record is provisioned via Stripe webhook
- After Stripe payment → user logs in → role-based redirect
- Before reaching the dashboard → **dynamic post-login onboarding gate** collects role-specific required fields
- Profile page shows a **completion percentage** based on filled fields

---

## Pricing Rule (Source of Truth)

All prices and Stripe price IDs come exclusively from the `pricing_plans` DB table. No amounts or price IDs are read from environment variables.

| `pricing_plans` field | Usage |
|---|---|
| `onetime_amount` + `currency` | One-time / setup fee — charged via Stripe `price_data` (dynamic) |
| `stripe_price_id` | Recurring subscription — pre-configured Stripe price |

### Checkout mode rules

| Plan shape | Stripe mode | Line items |
|---|---|---|
| `stripe_price_id` only (e.g. PM) | `subscription` | 1 recurring price |
| `onetime_amount` only | `payment` | 1 dynamic `price_data` item |
| Both fields (e.g. diviner with setup + monthly) | `subscription` | recurring price + one-time `price_data` |

---

## Plan Types and Their Expected Role

| itemKey | auth metadata role | DB record provisioned | Post-login destination |
|---|---|---|---|
| `professional_divination_course` | `diviner` | `diviners` | `/onboarding` then `/dashboard` |
| `trainee_diviner_bundle` | `diviner` | `diviners` + `trainees` | `/onboarding` then `/dashboard` |
| `trainee_program` | `trainee` | `trainees` | `/trainee` (needs onboarding gate) |
| `perennial_mandalism_community` | `perennial_mandalism` | `community_members` | `/community` (needs onboarding gate) |

---

## Execution Order

```
06 → 01 → 02 → 03 → 04 → 05
```

- **Task 06 first** — rewrites `src/app/api/stripe/checkout/route.ts`; sets `metadata.type` tags for webhook routing; tasks 01 and 02 depend on this
- **Task 02 includes a DB migration (Step 0)** — adds `onboarding_completed` to `community_members`; this migration must be deployed before the task 02 webhook handler goes live, and before task 04 is started
- **Tasks 01 and 02 share `get-started/page.tsx` edits** — apply both role changes in one pass to avoid duplicate edits on the same lines
- **Task 04 depends on task 02's migration** — reads `community_members.onboarding_completed`; extends the existing `src/app/community/onboarding/page.tsx` (file already exists with partial structure)

---

## Sub-Tasks

| # | File | What is broken / missing | Depends on | Status |
|---|---|---|---|---|
| 06 | `06-fix-plan-pricing-db-only.md` | All pricing reads env vars / legacy PLANS map — must use `pricing_plans` DB only; retire `billing.ts` and `plans.ts`; fix settings page plan display and upgrade flow | — | Open |
| 01 | `01-fix-trainee-program-webhook-provisioning.md` | Webhook creates `diviners` record for `trainee_program` — must create `trainees`; wrong `role` set at signup | 06 | Open |
| 02 | `02-fix-perennial-community-webhook-provisioning.md` | Webhook creates `diviners` record for `perennial_mandalism_community` — must create `community_members`; wrong `role` set at signup | 06 | Open |
| 03 | `03-build-trainee-post-login-onboarding-gate.md` | No post-login onboarding gate for `trainee` role — lands directly on `/trainee` with no required data collected | 01 | Open |
| 04 | `04-build-perennial-post-login-onboarding-gate.md` | No post-login onboarding gate for `perennial_mandalism` — household members, birth data, questionnaire never collected | 02 | Open |
| 05 | `05-build-profile-completion-indicator.md` | No profile completion percentage exists in any role's profile page | 03, 04 | Open |
