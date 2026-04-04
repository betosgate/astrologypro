# AstrologyPro

Next.js + Supabase platform for professional diviners — readings, scheduling, community, training, and mystery school.

---

## Documentation

| Doc | Description |
|---|---|
| [TASKS.md](./TASKS.md) | Sprint backlog, completed work, Beto action items |
| [CLAUDE.md](./CLAUDE.md) | AI assistant rules and project context |
| [docs/test-users.md](./docs/test-users.md) | All test user credentials (44 users, all roles) |
| [docs/scrum/README.md](./docs/scrum/README.md) | Scrum index |
| [docs/scrum/01_app_audit.md](./docs/scrum/01_app_audit.md) | App audit |
| [docs/scrum/02_role_feature_map.md](./docs/scrum/02_role_feature_map.md) | Role → feature mapping |
| [docs/scrum/03_module_inventory.md](./docs/scrum/03_module_inventory.md) | Module inventory |
| [docs/scrum/04_product_backlog.md](./docs/scrum/04_product_backlog.md) | Product backlog |
| [docs/scrum/05_sprint_plan.md](./docs/scrum/05_sprint_plan.md) | Sprint plan |
| [docs/scrum/06_api_reference.md](./docs/scrum/06_api_reference.md) | API reference |

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Payments:** Stripe Connect
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

---

## User Roles

| Role | Portal | Table |
|---|---|---|
| `diviner` | `/dashboard` | `diviners` |
| `client` | `/portal` | `clients` |
| `social_advo` | `/advocate` | `social_advocates` |
| `perennial_mandalism` | `/community` | `community_members` |
| `mystery_school` | `/community` | `community_members` |
| `trainee` | `/trainee` | `trainees` |

Multi-role users are redirected to `/switch` on login.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ADMIN_EMAILS=
```

### Database Migrations

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/run-migration.js supabase/migrations/<file>.sql
```

### Seed Test Users

```bash
node scripts/seed-test-users.js
```

Creates 44 test users (30 single-role + 14 multi-role). See [docs/test-users.md](./docs/test-users.md) for all credentials.

---

## Admin Access

Add your email to the `ADMIN_EMAILS` env var (comma-separated). Admin panel at `/admin`.
