# AstrologyPro — Issue Tracker

**Last Updated**: 2026-04-03
**Tracked by**: Claude Code sessions

---

## 🔴 OPEN — Critical

### ISSUE-001: Signup broken — Stripe price IDs not configured
- **Page**: `https://astrologypro.com/get-started#plans`
- **Symptom**: Clicking "Sign Up & Pay" shows "Failed to create checkout session"
- **Root Cause**: The 6 Stripe price IDs are not set in Vercel environment variables. The API at `/api/stripe/checkout` throws `"Stripe price IDs not configured for plan"` which is caught and returned as a 500 error.
- **Code path**: `src/app/get-started/page.tsx` → `handleSubmit` → `POST /api/stripe/checkout` → `src/lib/stripe/billing.ts:createCheckoutSession` → reads `process.env[plan.setupEnvKey]` / `process.env[plan.monthlyEnvKey]`
- **Fix Required (config, not code)**:
  1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → Products → Create 6 prices:
     | Env Var | Amount | Type |
     |---|---|---|
     | `STRIPE_PRICE_TAROT_SETUP` | $197 | One-time |
     | `STRIPE_PRICE_TAROT_MONTHLY` | $97 | Recurring monthly |
     | `STRIPE_PRICE_ASTROLOGY_SETUP` | $197 | One-time |
     | `STRIPE_PRICE_ASTROLOGY_MONTHLY` | $97 | Recurring monthly |
     | `STRIPE_PRICE_BOTH_SETUP` | $297 | One-time |
     | `STRIPE_PRICE_BOTH_MONTHLY` | $147 | Recurring monthly |
  2. Also set: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
  3. Add all to Vercel → Settings → Environment Variables → Production
- **Status**: ⏳ Awaiting Stripe configuration
- **Note**: Env var names in `TODO.md` say `STRIPE_PRICE_ORACLE_*` but the code uses `STRIPE_PRICE_BOTH_*`. The code is correct — use `BOTH` not `ORACLE`.

---

### ISSUE-002: Orphaned Supabase users when Stripe checkout fails
- **Page**: `src/app/get-started/page.tsx`
- **Symptom**: User is created in Supabase auth BEFORE Stripe checkout is attempted. If Stripe fails, the Supabase user exists but has never paid. On retry, Supabase returns the same user (email already registered) which may confuse users.
- **Root Cause**: Sequential flow — signUp then checkout, no rollback on checkout failure.
- **Workaround**: Supabase returns the same user object if email confirmation is pending and they retry signup. So retrying after Stripe is fixed should work.
- **Proper Fix**: Move user creation to a server action triggered only after successful Stripe checkout via webhook (`checkout.session.completed`).
- **Status**: ⏳ Open — low priority until Stripe is configured

---

## 🟡 OPEN — High Priority

### ISSUE-003: Twilio 10DLC not registered
- **Symptom**: SMS messages (appointment reminders, follow-ups) will fail delivery in the US
- **Fix**: Register brand + campaign in Twilio console. Timeline: 2-4 weeks.
- **Status**: ⏳ Awaiting registration

### ISSUE-004: Google Calendar OAuth in "Testing" mode
- **Symptom**: Only users added as test users in Google Cloud Console can connect their calendar
- **Fix**: Either add diviner emails as test users OR publish the OAuth app (requires Google verification)
- **Status**: ⏳ Open

### ISSUE-005: Stripe webhook not configured
- **Symptom**: After payment, `checkout.session.completed` webhook won't fire → subscription not activated in DB
- **Fix**: In Stripe dashboard → Webhooks → Add endpoint: `https://astrologypro.com/api/stripe/webhook`
  - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`
- **Status**: ⏳ Awaiting Stripe setup

---

## 🟢 OPEN — Medium Priority

### ISSUE-006: `/discover` page may be empty without seed data
- **Symptom**: No diviners visible on the discover page — no one has signed up yet
- **Fix**: Add seed data (1+ diviner profiles with services, availability set)
- **Status**: ⏳ Post-launch

### ISSUE-007: Cron jobs need verification
- **Symptom**: 6 cron jobs configured in `vercel.json` — not verified they're running correctly
- **Fix**: Check Vercel dashboard → Cron Jobs tab after first deployment
- **Status**: ⏳ Needs verification

---

## ✅ RESOLVED

### RESOLVED-001: Site showing 404 after sync with GitHub
- **Date**: 2026-04-03
- **Root Cause**: Local `app/` subfolder (old duplicate Next.js project) was pushed to GitHub. Vercel detected two competing `package.json` files and failed the build.
- **Fix**: Added `.vercelignore` to exclude `app/`, `HomeAbove/`, `MundaneAstrology/`, `docs/`, `examples/` from Vercel builds.
- **Commit**: `99bf4c7`

---

## Session Log

| Date | Work Done |
|---|---|
| 2026-04-03 | Set up GitHub remote `betosgate/astrologypro`, fixed permissions, pushed 1187 local files, fixed 404 via `.vercelignore`, diagnosed signup failure (ISSUE-001), created this doc |
