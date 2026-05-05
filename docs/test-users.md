# Test Users — AstrologyPro

All accounts are active and confirmed. Use the credentials below to log in at any environment.

**Password for all test users:** `TestUser123!`

---

## Single-Role Users (30)

### Diviners — portal: `/dashboard`

| Email | Password | Username |
|---|---|---|
| diviner1@test.astrologypro.com | TestUser123! | test-diviner-1 |
| diviner2@test.astrologypro.com | TestUser123! | test-diviner-2 |
| diviner3@test.astrologypro.com | TestUser123! | test-diviner-3 |
| diviner4@test.astrologypro.com | TestUser123! | test-diviner-4 |
| diviner5@test.astrologypro.com | TestUser123! | test-diviner-5 |

### Clients — portal: `/portal`

| Email | Password |
|---|---|
| client1@test.astrologypro.com | TestUser123! |
| client2@test.astrologypro.com | TestUser123! |
| client3@test.astrologypro.com | TestUser123! |
| client4@test.astrologypro.com | TestUser123! |
| client5@test.astrologypro.com | TestUser123! |

### Social Advocates — portal: `/advocate`

| Email | Password | Username |
|---|---|---|
| advocate1@test.astrologypro.com | TestUser123! | test-advocate-1 |
| advocate2@test.astrologypro.com | TestUser123! | test-advocate-2 |
| advocate3@test.astrologypro.com | TestUser123! | test-advocate-3 |
| advocate4@test.astrologypro.com | TestUser123! | test-advocate-4 |
| advocate5@test.astrologypro.com | TestUser123! | test-advocate-5 |

### Perennial Mandalism — portal: `/community`

| Email | Password |
|---|---|
| perennial1@test.astrologypro.com | TestUser123! |
| perennial2@test.astrologypro.com | TestUser123! |
| perennial3@test.astrologypro.com | TestUser123! |
| perennial4@test.astrologypro.com | TestUser123! |
| perennial5@test.astrologypro.com | TestUser123! |

### Mystery School — portal: `/mystery-school`

These accounts are seeded as dual-role (`mystery_school_students` + `clients`).
The login resolver routes them based on Mystery School billing state:

- **Valid Stripe subscription** → `/mystery-school`
- **Broken billing** (no `stripe_subscription_id`, or paused, or cancelled
  past `access_expires_at`) → `/join/mystery-school/resubscribe`

| Email | Password | MS Billing | Lands on |
|---|---|---|---|
| mysteryschool1@test.astrologypro.com | TestUser123! | broken (no Stripe sub) | `/join/mystery-school/resubscribe` |
| mysteryschool2@test.astrologypro.com | TestUser123! | broken (no Stripe sub) | `/join/mystery-school/resubscribe` |
| mysteryschool3@test.astrologypro.com | TestUser123! | valid | `/mystery-school` |
| mysteryschool4@test.astrologypro.com | TestUser123! | broken (no Stripe sub) | `/join/mystery-school/resubscribe` |
| mysteryschool5@test.astrologypro.com | TestUser123! | broken (no Stripe sub) | `/join/mystery-school/resubscribe` |

### Trainees — portal: `/trainee`

| Email | Password | Username |
|---|---|---|
| trainee1@test.astrologypro.com | TestUser123! | test-trainee-1 |
| trainee2@test.astrologypro.com | TestUser123! | test-trainee-2 |
| trainee3@test.astrologypro.com | TestUser123! | test-trainee-3 |
| trainee4@test.astrologypro.com | TestUser123! | test-trainee-4 |
| trainee5@test.astrologypro.com | TestUser123! | test-trainee-5 |

### Affiliates — portal: `/affiliate`

Seeded by `node scripts/seed-affiliate-accounts.mjs` (idempotent). Covers every
lifecycle state of the 2026-04-23 identity model. Password for the claimed
accounts is the same as other test users: `TestUser123!`.

| Email | Password | Partnerships | Junction status | Canonical state |
|---|---|---|---|---|
| affiliate-solo@test.astrologypro.com | TestUser123! | test-diviner-1 | active | active (claimed) |
| affiliate-multi@test.astrologypro.com | TestUser123! | test-diviner-1, 2, 3 | active (all 3) | active (claimed) |
| affiliate-pending@test.astrologypro.com | TestUser123! | test-diviner-1 | pending | unclaimed, valid invite |
| affiliate-expired@test.astrologypro.com | TestUser123! | test-diviner-2 | pending | unclaimed, expired invite |
| affiliate-unclaimed@test.astrologypro.com | *(no auth)* | test-diviner-4 | active | unclaimed (grandfathered) |
| affiliate-suspended@test.astrologypro.com | TestUser123! | test-diviner-5 | suspended | active (claimed) |
| affiliate-blocked@test.astrologypro.com | TestUser123! | test-diviner-1 | active | **blocked** platform-wide |

Notes:

- The `affiliate-unclaimed` persona has no Supabase auth user — it simulates
  a row backfilled from `diviner_affiliates` where the corresponding person
  never signed up. Log in as any diviner and you'll see it on
  `/dashboard/affiliates` with a pending/active treatment.
- `affiliate-multi` is the multi-diviner test bed — log in and
  `/affiliate/partnerships` should show 3 cards.
- `affiliate-pending` and `affiliate-expired` drive UI state for the
  row-action dropdown (Resend / Copy / Revoke).
- `affiliate-blocked` exercises the platform-wide block path — diviners
  can't invite this email, the portal shows a suspended gate.

---

## Dashboard QA Accounts — Fully Seeded (seed-dashboard-data.mjs)

These 4 accounts are seeded with complete KPI and activity data across all dashboards.
Re-seed anytime (idempotent): `node scripts/seed-dashboard-data.mjs`

| Role | Email | Password | Portal | Display Name |
|---|---|---|---|---|
| Diviner | diviner.test@astrologypro.com | DivinerTest2026! | `/dashboard` | Cosmic Aura |
| Trainee | trainee.test@astrologypro.com | TraineeTest2026! | `/trainee` | Zara Nightsky |
| Admin | admin.test@astrologypro.com | AdminTest2026! | `/admin` | — |
| Client | client.test@astrologypro.com | ClientTest2026! | `/portal` | Jordan Rivers |

**Seeded data per account:**

- **Diviner** — 6-month revenue history, 38 bookings, 7 services, 180 page views, 60 activity events, 6 testimonials (4 featured), availability Mon–Sat 9am–6pm
- **Trainee** — 65% lesson completion, 10 quiz attempts (8 passed, avg ~78%), ~5h study time, mentor = Cosmic Aura
- **Admin** — row in `admin_users` table; sees 5 diviners, 13+ clients, 3 trainees, 8 community members
- **Client** — 2 past completed sessions, 2 upcoming confirmed sessions, birth data pre-filled (1992-08-14, Chicago IL)

---

## Multi-Role Users with Perennial Mandalism (PM) — 15 accounts

All seeded by `node scripts/seed-multi-role-users.mjs`. Password: `TestUser123!`

### PM + single role

| Email | Roles | Display Name | Portal |
|---|---|---|---|
| pm.diviner@test.astrologypro.com | diviner + PM | Solaris Patel | `/dashboard` or `/community` |
| pm.trainee@test.astrologypro.com | trainee + PM | Wren Ashby | `/trainee` or `/community` |
| pm.client@test.astrologypro.com | client + PM | Indigo Marsh | `/portal` or `/community` |
| pm.advocate@test.astrologypro.com | advocate + PM | Cleo Hawthorne | `/advocate` or `/community` |
| pm.ms@test.astrologypro.com | PM + Mystery School | Dusk Mercer | `/community` |

### PM + two roles

| Email | Roles | Display Name | Portal |
|---|---|---|---|
| pm.diviner.trainee@test.astrologypro.com | diviner + trainee + PM | Lycan Voss | `/switch` |
| pm.diviner.ms@test.astrologypro.com | diviner + PM + MS | Aether Blaine | `/switch` |
| pm.trainee.ms@test.astrologypro.com | trainee + PM + MS | Cosima Reed | `/switch` |
| pm.client.advocate@test.astrologypro.com | client + advocate + PM | Onyx Fairfax | `/switch` |
| pm.diviner.client@test.astrologypro.com | diviner + client + PM | Vesper Laine | `/switch` |
| pm.trainee.advocate@test.astrologypro.com | trainee + advocate + PM | Sage Orton | `/switch` |

### PM + three roles

| Email | Roles | Display Name | Portal |
|---|---|---|---|
| pm.diviner.trainee.ms@test.astrologypro.com | diviner + trainee + PM + MS | Zephyr Crane | `/switch` |
| pm.diviner.advocate.ms@test.astrologypro.com | diviner + advocate + PM + MS | Nimbus Cross | `/switch` |
| pm.client.ms@test.astrologypro.com | client + PM + MS | Selene Park | `/switch` |

### All roles

| Email | Roles | Display Name | Portal |
|---|---|---|---|
| pm.all@test.astrologypro.com | diviner + trainee + client + advocate + PM + MS | Omni Stellaris | `/switch` |

---

## Other Multi-Role Combos (no PM) — 7 accounts

Seeded by `node scripts/seed-multi-role-users.mjs`. Password: `TestUser123!`

| Email | Roles | Display Name | Portal |
|---|---|---|---|
| diviner.trainee@test.astrologypro.com | diviner + trainee | Sirius Kane | `/switch` |
| diviner.advocate@test.astrologypro.com | diviner + advocate | Celeste Draven | `/switch` |
| diviner.ms@test.astrologypro.com | diviner + Mystery School | Nox Whitmore | `/switch` |
| trainee.ms@test.astrologypro.com | trainee + Mystery School | Aquila Frost | `/switch` |
| trainee.advocate@test.astrologypro.com | trainee + advocate | Lyra Sutton | `/switch` |
| client.ms@test.astrologypro.com | client + Mystery School | Vesper Nolan | `/switch` |
| diviner.trainee.ms@test.astrologypro.com | diviner + trainee + MS | Soleil Kwan | `/switch` |

---

## Multi-Role Users (14)

Users with multiple roles are redirected to `/switch` on login to select their portal.

| Email | Password | Roles | Portal |
|---|---|---|---|
| multi-client-advo@test.astrologypro.com | TestUser123! | client + social_advo | `/portal` or `/advocate` |
| multi-diviner-pm@test.astrologypro.com | TestUser123! | diviner + perennial_mandalism | `/switch` |
| multi-diviner-ms@test.astrologypro.com | TestUser123! | diviner + mystery_school | `/switch` |
| multi-advo-pm@test.astrologypro.com | TestUser123! | social_advo + perennial_mandalism | `/switch` |
| multi-advo-ms@test.astrologypro.com | TestUser123! | social_advo + mystery_school | `/switch` |
| multi-client-pm@test.astrologypro.com | TestUser123! | client + perennial_mandalism | `/switch` |
| multi-client-ms@test.astrologypro.com | TestUser123! | client + mystery_school | `/switch` |
| multi-trainee-pm@test.astrologypro.com | TestUser123! | trainee + perennial_mandalism | `/switch` |
| multi-trainee-ms@test.astrologypro.com | TestUser123! | trainee + mystery_school | `/switch` |
| multi-diviner-pm-ms@test.astrologypro.com | TestUser123! | diviner + PM + mystery_school | `/switch` |
| multi-client-advo-pm@test.astrologypro.com | TestUser123! | client + advocate + PM | `/switch` |
| multi-diviner-trainee-ms@test.astrologypro.com | TestUser123! | diviner + trainee + mystery_school | `/switch` |
| multi-advo-pm-ms@test.astrologypro.com | TestUser123! | advocate + PM + mystery_school | `/switch` |
| multi-all@test.astrologypro.com | TestUser123! | all 6 roles | `/switch` |

---

## Admin Users — AstrologyPro (Supabase)

| Email | Password | Portal | Notes |
|---|---|---|---|
| admin@astrologypro.com | Admin@AstroPro2026! | `/admin` | Primary admin; seeded in `admin_users` table; DB-based auth |

---

## Notes

- All users are email-confirmed and can log in immediately
- Multi-role users land on `/switch` (portal switcher) after login
- `community_members` rows use `membership_status = 'active'`
- Diviners, advocates, and trainees have `onboarding_completed = true`
- To re-seed single-role users: `node scripts/seed-test-users.js`
- To populate KPI/activity data for all roles: `node scripts/seed-role-data.mjs`
- To populate a single role: `node scripts/seed-role-data.mjs diviner|trainee|client|advocate`

---

## Legacy System — Old Angular App (divine-infinite-being-angular-ui)

These accounts exist in **MongoDB `divine_infinity`** + **AWS Cognito dev pool** (`us-east-1_E7eKADUs4`).
Use them to log into the old Angular backoffice at `http://localhost:4200`.

**Username field = email address. Password for all: `TestAccess123!`**

| Role | Email (username) | Password |
|---|---|---|
| Admin | `admindivine@yopmail.com` | `TestAccess123!` |
| Diviner (Astrologer) | `arnab.atrotest@yopmail.com` | `TestAccess123!` |
| Diviner (Tarot) | `ctestamelia@yopmail.com` | `TestAccess123!` |
| Client (Customer) | `beto@betoparedes.com` | `TestAccess123!` |
| Client + Social Advocate | `sankettest2@yopmail.com` | `TestAccess123!` |
| Social Advocate | `socialadvo@yopmail.com` | `TestAccess123!` |
| Perennial Mandalism | `test.data@yopmail.com` | `TestAccess123!` |

**To reset passwords back to `TestAccess123!` at any time:**
```bash
export LEGACY_AWS_ACCESS_KEY=<key from KEYS.md>
export LEGACY_AWS_SECRET_KEY=<secret from KEYS.md>
node scripts/provision-legacy-test-users.js
```

**To review all legacy users (MongoDB read-only):**
```bash
export LEGACY_MONGO_URI=<uri from KEYS.md>
node scripts/review-legacy-users.js           # summary + sample
node scripts/review-legacy-users.js --csv > legacy-users.csv  # full export
```

**Infrastructure:**
- MongoDB: `divine_infinity` (dev) / `divine_infinity_prod` (prod)
- Cognito dev pool: `us-east-1_E7eKADUs4` · Client ID: `6r66m8j7pog0d14nd4m84adbhu`
- NestJS API local: `http://localhost:3522`
