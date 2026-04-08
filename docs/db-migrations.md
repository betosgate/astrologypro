# Database Migrations — Developer Guide

How to add and run a new Supabase migration in this project, end to end.

> **TL;DR** — Drop a SQL file, mirror it as a TS module, register it in one map, push, click Run in the admin UI.

---

## What this system is

A self-service migration runner you can use from a logged-in admin browser session **without** the Supabase CLI, **without** pasting tokens into chat, and **without** filesystem access on the deployed function.

| Piece | Path | Role |
|---|---|---|
| Canonical SQL | `supabase/migrations/<id>.sql` | Source of truth, version-controlled. Also used by `supabase db push` if you ever wire the CLI back in. |
| Bundled TS mirror | `src/data/migrations/<id>.ts` | Same SQL as a template literal exported as `MIGRATION_SQL`. Bundled by Next.js so the deployed function has the SQL in memory. |
| Allowlist | `src/lib/db/migrations.ts` | Maps `migration_id` → `{ title, description, sql }`. The runner endpoint refuses anything not in this map — the UI cannot supply arbitrary SQL. |
| Runner endpoint | `src/app/api/admin/db/migrate/route.ts` | `GET` lists the allowlist. `POST` runs one migration via the Supabase Management API. Admin auth required. |
| Admin UI | `src/app/admin/db/migrations/page.tsx` | Lists allowlisted migrations, one **Run migration** button per row, renders result inline. Reachable from the admin sidebar under **Config → DB Migrations**. |

## What it isn't

- **Not a replacement for `supabase db push`** when you want branching, schema diffs, or local emulation. It is a *production migration trigger*, not a local-dev workflow.
- **Not safe for arbitrary SQL.** The endpoint refuses any `migration_id` not in the allowlist on purpose.
- **Not transactional across migrations.** Each migration is one Supabase Management API call. If you have a sequence of migrations that must apply atomically, combine them into one `.sql` file.

---

## Adding a new migration — 4 steps

### 1. Write the canonical SQL

Create `supabase/migrations/<timestamp>_<short_name>.sql`. Use the same naming convention as existing migrations (look in the folder for examples — UTC date + counter + descriptor).

**Hard rules from `CLAUDE.md` engineering laws — apply to every migration:**
- Additive only on the first deploy. No `DROP COLUMN`, no `DROP TABLE`, no destructive `ALTER` until a follow-up migration after the consumers have been updated.
- Idempotent. Use `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DO $$ ... $$` blocks that check `pg_policies` / `pg_proc` before creating policies / functions.
- RLS enabled on every new table. At minimum: `ALTER TABLE x ENABLE ROW LEVEL SECURITY;` plus a service-role policy. Decide deliberately whether public read or auth-only read makes sense.
- Indexes designed for actual query patterns, not "throw indexes everywhere." Look at the routes/components that will read this table and create the multicolumn / GIN / `tsvector` indexes that match.
- Comments. `COMMENT ON TABLE <name> IS '...'` so future-you knows what it is.

**Template skeleton:**

```sql
-- <Short description, one line>
-- <Why this migration exists, two or three lines>
-- Source: <if porting data, point to it; otherwise the issue/PR number>
-- Additive only — does not touch the existing X table.

CREATE TABLE IF NOT EXISTS my_new_table (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- … columns …
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_my_new_table_lookup ON my_new_table(<col>);

ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'my_new_table' AND policyname = 'my_new_table_service_role'
  ) THEN
    CREATE POLICY my_new_table_service_role
      ON my_new_table FOR ALL
      TO service_role
      USING (TRUE) WITH CHECK (TRUE);
  END IF;
END $$;

-- Seed data, if any. Use ON CONFLICT to keep it idempotent.
INSERT INTO my_new_table (…) VALUES (…) ON CONFLICT (…) DO NOTHING;

COMMENT ON TABLE my_new_table IS '…';
```

**For data-heavy migrations** (more than ~50 INSERTs, or where source data lives in a JSON file), generate the INSERT block with a small Python script — don't hand-write hundreds of statements. The existing `20260408000106_astro_decan_new_infos.sql` was generated this way; the generator is documented inline at the top of the file.

### 2. Mirror the SQL as a TS module

Create `src/data/migrations/<id>.ts` exporting the same SQL as a template literal. The runner endpoint and the UI both import from here, not from the filesystem, so the SQL is bundled into the Next.js build.

**Template:**

```ts
// AUTO-GENERATED bundled mirror of supabase/migrations/<id>.sql
// Used by /api/admin/db/migrate so the deployed function does not need filesystem access.
// To regenerate: copy the .sql file contents into the template literal below.

export const MIGRATION_SQL = `<paste SQL here>`;
```

**Escaping caveat for the template literal:** the SQL must escape three things — backslashes, backticks, and `${`. For anything beyond a trivial migration, use this Python helper instead of editing by hand:

```bash
python3 - <<'PY'
sql = open('supabase/migrations/<id>.sql').read()
escaped = sql.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
header = (
    '// AUTO-GENERATED bundled mirror of supabase/migrations/<id>.sql\n'
    '// Used by /api/admin/db/migrate so the deployed function does not need filesystem access.\n'
    '\n'
    'export const MIGRATION_SQL = `'
)
out = header + escaped + '`;\n'
open('src/data/migrations/<id>.ts', 'w').write(out)
print('wrote', len(out), 'chars')
PY
```

After you write the file, **verify the SQL survived the escaping** before pushing — count INSERTs, CREATE statements, or whatever the migration's main shape is:

```bash
grep -c "INSERT INTO" src/data/migrations/<id>.ts   # should match the .sql file
grep -c "CREATE "   src/data/migrations/<id>.ts
```

### 3. Register it in the allowlist

Open `src/lib/db/migrations.ts` and add an entry:

```ts
import { MIGRATION_SQL as MIG_<id> } from "@/data/migrations/<id>";

export const MIGRATIONS: Record<string, MigrationDescriptor> = {
  // … existing entries …
  "<id>": {
    id: "<id>",
    title: "<Human-readable title>",
    description:
      "<One paragraph: what it creates, what data it seeds, idempotency guarantee>",
    sortKey: "<numeric prefix from the id, used to order the UI>",
    sql: MIG_<id>,
  },
};
```

The `id` value here **must** match both the .sql filename (without the `.sql`) and the .ts filename. The runner uses this string as the request body key (`{ migration_id: "<id>" }`).

### 4. Push and run

```bash
git add supabase/migrations/<id>.sql src/data/migrations/<id>.ts src/lib/db/migrations.ts
git commit -m "feat(db): <short description>"
git push origin master
```

Wait for Vercel to deploy (~2 minutes), then:

1. Open https://astrologypro.com/admin/db/migrations as a logged-in admin.
2. The new migration appears in the list.
3. Click **Run migration** on its row.
4. Inline result card shows green on success with the Supabase Management API response, red on failure with the status code and error body.

That's it. No CLI, no token paste, no SQL editor.

---

## Idempotency — required, not optional

The runner does not track which migrations have been applied. There is no `schema_migrations` table. **Every migration in this system must be safe to re-run any number of times.** If you click Run twice, it must be a no-op the second time.

Patterns to use:

| Operation | Idempotent form |
|---|---|
| Create table | `CREATE TABLE IF NOT EXISTS …` |
| Create index | `CREATE INDEX IF NOT EXISTS …` |
| Add column | `ALTER TABLE … ADD COLUMN IF NOT EXISTS …` |
| Insert seed data | `INSERT … ON CONFLICT (<unique_col>) DO NOTHING` |
| Upsert seed data | `INSERT … ON CONFLICT (<unique_col>) DO UPDATE SET …` |
| Create RLS policy | `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies …) THEN CREATE POLICY … END IF; END $$;` |
| Create function | `CREATE OR REPLACE FUNCTION …` |
| Backfill data | `UPDATE … WHERE <condition_that_only_matches_unbackfilled_rows>` |

**Never use** `DROP TABLE`, `DROP COLUMN`, or `TRUNCATE` in this system. If you need a destructive change, do it via the Supabase dashboard SQL editor with a one-shot script that you do not commit to the allowlist — the runner is for forward-only schema and seed work.

---

## Security model — read this before adding anything sensitive

1. **The migration runner is admin-only.** `getAdminUser()` is called on every `GET` and `POST` to `/api/admin/db/migrate`. A non-admin cannot list or run migrations.
2. **Allowlist over arbitrary SQL.** The request body sends a `migration_id` *string*, never SQL. The endpoint looks up the SQL from a TypeScript map that only changes via PR. There is no `query` field, no template substitution, no user input ever reaches the database as code.
3. **`SUPABASE_ACCESS_TOKEN` is server-only.** It is read from `process.env` inside the route handler. It is never serialized into a response, never exposed to client components, and never logged to chat or browser console.
4. **The token has full project scope.** A leak of `SUPABASE_ACCESS_TOKEN` is equivalent to handing someone owner access to your Supabase project. Rotate it after every incident, after every team member departure, and on a regular schedule.

If you find yourself wanting to add an "arbitrary SQL" field to this endpoint, **stop**. The whole reason it is safe to expose at all is that the surface area is bounded by the allowlist. Building a generic SQL runner here puts a backdoor into your production database that survives the next intern.

---

## Failure modes and how to debug

| Symptom | Likely cause | Fix |
|---|---|---|
| Page shows red **"Access token: missing"** badge | `SUPABASE_ACCESS_TOKEN` not set in Vercel env vars | Vercel dashboard → Project → Settings → Environment Variables → add it → redeploy |
| Run button returns `401 Unauthorized` | Your admin session expired | Re-log into `/admin` |
| Run button returns `404 Unknown migration_id` | The id in `MIGRATIONS` does not match what the UI is sending | Check `src/lib/db/migrations.ts` — the map key, the `.id` field, and the .ts filename must all match |
| Run button returns `502` with `Supabase Management API returned an error` | The SQL itself failed in Postgres | Read the `detail` field in the response — it has the upstream error message and SQL state code. Most common: a column type mismatch in an INSERT, or a missing extension (e.g. `gen_random_uuid()` requires `pgcrypto`) |
| Run button returns `200 ok: true` but the table is still missing | The SQL ran against the wrong project | Verify `PROJECT_REF` in `src/app/api/admin/db/migrate/route.ts` matches your Supabase project's reference. CLAUDE.md has the canonical value. |
| Table created but seed rows missing | The INSERTs use `ON CONFLICT DO NOTHING` against a column that already had matching rows from a previous attempt | Either change to `ON CONFLICT DO UPDATE`, or query the table directly to confirm whether the rows actually exist |
| Build fails after adding the .ts mirror | Template literal escaping is broken — usually an unescaped backtick or `${` in the SQL | Re-run the Python escape helper. Verify with `node -e "require('./src/data/migrations/<id>.ts')"` (it'll throw on syntax errors but not ESM/export errors — ignore the latter) |

For deeper debugging, the runner logs the upstream Supabase API response to the Vercel function logs whenever it's not 2xx. Check there before assuming your SQL is wrong.

---

## When to **not** use this system

1. **Schema changes that need a long-running data backfill.** Do those in batches via a cron route or a background job, not via a single migration call. The runner has a 60-second timeout (`maxDuration = 60`) and the Supabase Management API times out around the same place.
2. **Migrations that need to run in order across multiple files.** Combine them into one `.sql` file. The runner does not execute migrations in any order — each click runs one migration, and the operator decides which.
3. **Local development.** Use `supabase start` + `supabase db reset` for local schema work. The runner is for production-style environments where you don't want to ship a CLI to every operator.
4. **Anything that needs to be reversible immediately.** This system has no rollback. If you need to ship a forward-only migration that you might need to roll back, write a follow-up migration that undoes it (additive style — if migration N adds a column, migration N+1 stops using it, migration N+2 drops it after N+1 has been deployed for a release cycle).

---

## Quick reference — file locations

```
supabase/migrations/<id>.sql              ← canonical SQL, source of truth
src/data/migrations/<id>.ts                ← bundled TS mirror (template literal)
src/lib/db/migrations.ts                   ← allowlist map
src/app/api/admin/db/migrate/route.ts      ← runner endpoint (GET list, POST run)
src/app/admin/db/migrations/page.tsx       ← UI at /admin/db/migrations
src/components/admin/admin-sidebar.tsx     ← Config → DB Migrations entry
docs/db-migrations.md                      ← this file
```

## Worked example — `20260408000106_astro_decan_new_infos`

Use this migration as the reference implementation when adding a new one:

- **Canonical SQL:** `supabase/migrations/20260408000106_astro_decan_new_infos.sql` — creates a table, indexes, RLS policies, and 36 `INSERT … ON CONFLICT (mongo_id) DO NOTHING` rows.
- **Bundled mirror:** `src/data/migrations/20260408000106_astro_decan_new_infos.ts` — the same SQL inside a TS template literal export.
- **Allowlist entry:** the `MIGRATIONS["20260408000106_astro_decan_new_infos"]` block in `src/lib/db/migrations.ts`.
- **Source data:** `src/data/astro_decan_new_infos.seed.json` (also kept in `tasks/08.04.2026/astro-toolkit/` for reference).
- **History:** the migration was applied to production by clicking **Run migration** in `/admin/db/migrations` on 2026-04-08; the runner returned `{ ok: true, supabase_response: [] }` and `GET /api/astro-decan/fetch-planet-signs` immediately started returning the 36 records. No CLI, no SQL editor, no token in chat.
