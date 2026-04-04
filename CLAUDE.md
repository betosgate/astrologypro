@AGENTS.md

# AstrologyPro — Project Rules

## Migration from Angular

When porting Angular features here: **one module, one route, one block at a time.**

1. Read the Angular source first (from docs/scrum/03_module_inventory.md or the actual Angular code in divine-infinite-being-angular-ui/)
2. Read the existing AstrologyPro equivalent
3. Gap-analyse line by line
4. Build only the missing block
5. Move to next block

Never skip. Never assume. Read before writing.

## Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Database:** Supabase (PostgreSQL) — all migrations in `supabase/migrations/`
- **Auth:** Supabase Auth (server-side via `createClient()`, admin via `createAdminClient()`)
- **UI:** shadcn/ui + Tailwind CSS
- **Payments:** Stripe (server actions + webhooks in `src/app/api/stripe/`)
- **Video:** Daily.co
- **Voice:** Twilio
- **Email:** AWS SES via `src/lib/email.ts`

## Before Adding a DB Column or Table

1. Check existing migrations — never duplicate a column
2. Create a new migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
3. Add RLS policies in the same migration
4. Apply via: `npx supabase db push` (dev) or Supabase dashboard (prod)

## Admin Auth

Admin access is controlled by `ADMIN_EMAILS` env variable (comma-separated).
Admin layout is at `src/app/admin/layout.tsx` — all `/admin/*` routes require this.
