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
import { Database, Loader2, CheckCircle2, AlertCircle, Play } from "lucide-react";

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
    <div className="space-y-6 max-w-4xl">
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
