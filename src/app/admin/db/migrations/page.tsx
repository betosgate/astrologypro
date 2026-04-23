"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface MigrationMeta {
  id: string;
  title: string;
  description: string;
  sortKey: string;
  sql_length: number;
}

interface ListResponse {
  project_ref: string;
  has_token: boolean;
  migrations: MigrationMeta[];
}

interface RunResult {
  ok?: boolean;
  migration_id?: string;
  project_ref?: string;
  sql_length?: number;
  supabase_response?: unknown;
  error?: string;
  detail?: unknown;
  status?: number;
  available?: string[];
}

export default function DbMigrationsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RunResult>>({});
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetch("/api/admin/db/migrate")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
        return body as ListResponse;
      })
      .then(setData)
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : String(err)),
      );
  }, []);

  async function runMigration(id: string) {
    setRunningId(id);
    setResults((prev) => ({ ...prev, [id]: {} }));
    try {
      const res = await fetch("/api/admin/db/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ migration_id: id }),
      });
      const body = (await res.json()) as RunResult;
      setResults((prev) => ({
        ...prev,
        [id]: { ...body, status: res.status },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [id]: {
          error: "Network error",
          detail: err instanceof Error ? err.message : String(err),
        },
      }));
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="space-y-6 ">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Database className="size-7 text-primary mt-1" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Database Migrations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              On-demand runner for allowlisted SQL migrations. Each migration is
              bundled into the build, executed against Supabase via the
              Management API, and is idempotent — re-running is safe.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHelp((v) => !v)}
        >
          <HelpCircle className="mr-2 size-4" />
          How to add a new migration
          {showHelp ? (
            <ChevronUp className="ml-2 size-4" />
          ) : (
            <ChevronDown className="ml-2 size-4" />
          )}
        </Button>
      </div>

      {/* Walkthrough */}
      {showHelp && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" />
              Walkthrough — adding the next migration
            </CardTitle>
            <CardDescription className="text-xs">
              The full developer guide lives at{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                docs/db-migrations.md
              </code>
              . This is the abridged checklist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-1">1. Write the canonical SQL</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Create{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  supabase/migrations/&lt;timestamp&gt;_&lt;short_name&gt;.sql
                </code>
                . Match the YYYYMMDDHHMMSS prefix used by existing files. Hard
                rules: idempotent (<code>IF NOT EXISTS</code>,{" "}
                <code>ON CONFLICT DO NOTHING</code>), additive only on first
                deploy (no <code>DROP</code> until a follow-up migration after
                consumers are updated), RLS enabled on every new table, indexes
                designed for actual query patterns, comments via{" "}
                <code>COMMENT ON TABLE</code>.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">
                2. Mirror the SQL as a TS module
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed mb-2">
                Create{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  src/data/migrations/&lt;id&gt;.ts
                </code>{" "}
                exporting the same SQL as a template literal. Bundled into the
                Next.js build so the deployed function has the SQL in memory.
                Use this Python helper from the repo root to generate it
                safely (escapes <code>\</code>, <code>`</code>, and{" "}
                <code>${"${...}"}</code>):
              </p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-[11px] font-mono leading-snug">
{`python3 - <<'PY'
sql = open('supabase/migrations/<id>.sql').read()
escaped = sql.replace('\\\\', '\\\\\\\\').replace('\`', '\\\\\`').replace('\${', '\\\\\${')
header = (
  '// AUTO-GENERATED bundled mirror of supabase/migrations/<id>.sql\\n'
  '// Used by /api/admin/db/migrate so the deployed function does not need fs.\\n'
  '\\n'
  'export const MIGRATION_SQL = \`'
)
open('src/data/migrations/<id>.ts','w').write(header + escaped + '\`;\\n')
PY`}
              </pre>
              <p className="text-muted-foreground text-xs mt-2">
                Verify with{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  grep -c &quot;CREATE TABLE&quot;
                </code>{" "}
                — counts should match the .sql file.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">3. Register in the allowlist</p>
              <p className="text-muted-foreground text-xs leading-relaxed mb-2">
                Open{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  src/lib/db/migrations.ts
                </code>{" "}
                and add an entry. The id must match the .sql filename
                (without the extension) and the .ts filename. The runner uses
                this string as the request body key.
              </p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-[11px] font-mono leading-snug">
{`import { MIGRATION_SQL as MIG_<id> } from "@/data/migrations/<id>";

const MIGRATIONS: Record<string, MigrationDescriptor> = {
  // … existing entries …
  "<id>": {
    id: "<id>",
    title: "<Human-readable title>",
    description: "<What it creates / seeds / changes>",
    sortKey: "<numeric prefix>",
    sql: MIG_<id>,
  },
};`}
              </pre>
            </div>

            <div>
              <p className="font-semibold mb-1">4. Push and run</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Commit the three files and push. Wait ~2 min for Vercel to
                deploy. Refresh this page — the new migration appears in the
                list. Click <strong>Run migration</strong>. The result card
                renders inline with the Supabase Management API response on
                success or the status code + error body on failure.
              </p>
            </div>

            <div className="border-t pt-3">
              <p className="font-semibold mb-2">Idempotency rules</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b text-muted-foreground">
                    <th className="py-1 pr-2">Operation</th>
                    <th className="py-1">Idempotent form</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px]">
                  <tr className="border-b">
                    <td className="py-1 pr-2">Create table</td>
                    <td className="py-1">CREATE TABLE IF NOT EXISTS …</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-2">Add column</td>
                    <td className="py-1">ADD COLUMN IF NOT EXISTS …</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-2">Create index</td>
                    <td className="py-1">CREATE INDEX IF NOT EXISTS …</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-2">Insert seed</td>
                    <td className="py-1">INSERT … ON CONFLICT … DO NOTHING</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-2">Upsert seed</td>
                    <td className="py-1">INSERT … ON CONFLICT … DO UPDATE</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-2">Create RLS policy</td>
                    <td className="py-1">
                      DO $$ IF NOT EXISTS (SELECT 1 FROM pg_policies …) …
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-2">Create function</td>
                    <td className="py-1">CREATE OR REPLACE FUNCTION …</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-t pt-3">
              <p className="font-semibold mb-1">When to NOT use this runner</p>
              <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside leading-relaxed">
                <li>
                  Long-running data backfills (60s timeout — use a background
                  cron route instead)
                </li>
                <li>
                  Destructive migrations (drop column / drop table) without an
                  additive-first staging plan and backup
                </li>
                <li>Local development — use <code>supabase db reset</code> instead</li>
                <li>
                  Anything needing immediate rollback — write a follow-up
                  migration that undoes it instead
                </li>
              </ul>
            </div>

            <div className="border-t pt-3">
              <p className="font-semibold mb-1">Common failures</p>
              <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside leading-relaxed">
                <li>
                  <strong>Red &quot;Access token: missing&quot; badge</strong> →
                  set <code>SUPABASE_ACCESS_TOKEN</code> in Vercel env vars +
                  redeploy
                </li>
                <li>
                  <strong>404 Unknown migration_id</strong> → the id in
                  MIGRATIONS doesn&apos;t match the .ts filename or the body key
                </li>
                <li>
                  <strong>502 Supabase API error</strong> → read the{" "}
                  <code>detail</code> field for the upstream Postgres error
                  (most common: missing extension, type mismatch in INSERT)
                </li>
                <li>
                  <strong>Build fails after adding the .ts mirror</strong> →
                  template literal escaping is broken, re-run the Python helper
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {loadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                Failed to load migrations
              </p>
              <p className="text-xs text-muted-foreground">{loadError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <Card>
          <CardContent className="py-4 flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Project ref:</span>{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {data.project_ref}
              </code>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Access token:</span>
              {data.has_token ? (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                  configured
                </Badge>
              ) : (
                <Badge variant="outline" className="border-destructive/40 text-destructive">
                  missing — set SUPABASE_ACCESS_TOKEN in Vercel env vars
                </Badge>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Allowlist size:</span>{" "}
              <span className="font-semibold">{data.migrations.length}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {data?.migrations.map((m) => {
        const result = results[m.id];
        const isRunning = runningId === m.id;
        const isSuccess = result?.ok === true;
        const isError = result && result.ok !== true && result.status !== undefined;

        return (
          <Card key={m.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {m.title}
                  </CardTitle>
                  <CardDescription className="mt-1 font-mono text-xs">
                    {m.id}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => runMigration(m.id)}
                  disabled={isRunning || !data?.has_token}
                >
                  {isRunning ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 size-4" />
                  )}
                  {isRunning ? "Running…" : "Run migration"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{m.description}</p>
              <p className="text-xs text-muted-foreground">
                SQL size: {m.sql_length.toLocaleString()} chars
              </p>
              {result && (
                <div
                  className={`rounded-md border p-3 text-xs ${
                    isSuccess
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : isError
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-muted bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-semibold">
                    {isSuccess && (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span className="text-emerald-700">Success</span>
                      </>
                    )}
                    {isError && (
                      <>
                        <AlertCircle className="size-4 text-destructive" />
                        <span className="text-destructive">
                          Failed (HTTP {result.status})
                        </span>
                      </>
                    )}
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] text-muted-foreground">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {data && data.migrations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No migrations in the allowlist. Add one in
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
              src/lib/db/migrations.ts
            </code>
            to make it runnable here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
