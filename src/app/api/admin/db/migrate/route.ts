import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { MIGRATIONS, listMigrations } from "@/lib/db/migrations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/admin/db/migrate
 * Body: { migration_id: string }
 *
 * Admin-only on-demand migration runner. Calls the Supabase Management API
 * (https://api.supabase.com/v1/projects/{ref}/database/query) using
 * `SUPABASE_ACCESS_TOKEN` from server env vars to execute the named migration
 * SQL against the project database. Supports DDL (CREATE TABLE, RLS, indexes)
 * and DML in a single call — unlike the PostgREST-based supabase-js client.
 *
 * Security model:
 *   1. Admin auth required (`getAdminUser`).
 *   2. Migration SQL is loaded from a hardcoded allowlist of bundled TS
 *      modules — the request body cannot supply arbitrary SQL.
 *   3. `SUPABASE_ACCESS_TOKEN` lives only in server env, never in chat
 *      transcripts or the client bundle.
 *
 * Project ref is hardcoded to `wyluvclvtvwptsvvtgkv` per CLAUDE.md.
 *
 * Response (success): { ok, migration_id, supabase_response }
 * Response (auth):    401 { error: "Unauthorized" }
 * Response (config):  500 { error: "SUPABASE_ACCESS_TOKEN not configured" }
 * Response (lookup):  404 { error: "Unknown migration_id" }
 * Response (upstream): 502 with the Supabase Management API error body
 */

const PROJECT_REF = "wyluvclvtvwptsvvtgkv";

/**
 * GET /api/admin/db/migrate
 * Returns the allowlisted migrations + their metadata. Used by the
 * admin migrations UI to render the runner page.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    project_ref: PROJECT_REF,
    has_token: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
    migrations: listMigrations(),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      {
        error: "SUPABASE_ACCESS_TOKEN not configured",
        detail:
          "Set SUPABASE_ACCESS_TOKEN in the Vercel project environment variables.",
      },
      { status: 500 },
    );
  }

  let body: { migration_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const migrationId =
    typeof body.migration_id === "string" ? body.migration_id.trim() : "";
  if (!migrationId) {
    return NextResponse.json(
      { error: "migration_id is required (string)" },
      { status: 422 },
    );
  }

  const descriptor = MIGRATIONS[migrationId];
  if (!descriptor) {
    return NextResponse.json(
      {
        error: "Unknown migration_id",
        detail: `Migration ${migrationId} is not in the allowlist.`,
        available: Object.keys(MIGRATIONS),
      },
      { status: 404 },
    );
  }
  const sql = descriptor.sql;

  // Call the Supabase Management API to execute the SQL.
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });
  } catch (err) {
    console.error("[admin/db/migrate] fetch error:", err);
    return NextResponse.json(
      {
        error: "Failed to reach Supabase Management API",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  let upstreamBody: unknown = null;
  const upstreamText = await upstream.text();
  try {
    upstreamBody = upstreamText ? JSON.parse(upstreamText) : null;
  } catch {
    upstreamBody = upstreamText;
  }

  if (!upstream.ok) {
    console.error(
      "[admin/db/migrate] supabase API error",
      upstream.status,
      upstreamBody,
    );
    return NextResponse.json(
      {
        error: "Supabase Management API returned an error",
        status: upstream.status,
        detail: upstreamBody,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    migration_id: migrationId,
    project_ref: PROJECT_REF,
    sql_length: sql.length,
    supabase_response: upstreamBody,
  });
}
