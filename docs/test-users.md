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

### Mystery School — portal: `/community`

| Email | Password |
|---|---|
| mysteryschool1@test.astrologypro.com | TestUser123! |
| mysteryschool2@test.astrologypro.com | TestUser123! |
| mysteryschool3@test.astrologypro.com | TestUser123! |
| mysteryschool4@test.astrologypro.com | TestUser123! |
| mysteryschool5@test.astrologypro.com | TestUser123! |

### Trainees — portal: `/trainee`

| Email | Password | Username |
|---|---|---|
| trainee1@test.astrologypro.com | TestUser123! | test-trainee-1 |
| trainee2@test.astrologypro.com | TestUser123! | test-trainee-2 |
| trainee3@test.astrologypro.com | TestUser123! | test-trainee-3 |
| trainee4@test.astrologypro.com | TestUser123! | test-trainee-4 |
| trainee5@test.astrologypro.com | TestUser123! | test-trainee-5 |

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

## Notes

- All users are email-confirmed and can log in immediately
- Multi-role users land on `/switch` (portal switcher) after login
- `community_members` rows use `membership_status = 'active'`
- Diviners, advocates, and trainees have `onboarding_completed = true`
- To re-seed (idempotent): `node scripts/seed-test-users.js`

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
