import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateCredentialsCache } from "@/lib/calendar/provider-credentials";

/**
 * Shared CRUD implementation for /api/admin/calendar-config/{google,microsoft}.
 *
 * Both providers have identical schema (id, key, value, description,
 * is_active, created_at, updated_at), so the two route files pass
 * `google_api_keys` or `microsoft_api_keys` into these helpers rather
 * than duplicating 200 lines per provider.
 */

export type ProviderTable = "google_api_keys" | "microsoft_api_keys";

interface CredentialRow {
  id: string;
  key: string;
  value: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Mask a secret-looking value for list responses. The admin UI renders
 * rows in a table and we do NOT want to dump every client_secret into
 * the browser network log unless the user explicitly clicks "Show".
 *
 * The masking rule: keep the first 4 and last 2 characters, replace the
 * middle with dots. Values shorter than 8 characters are fully masked.
 * Empty strings are returned as-is.
 */
export function maskValue(value: string): string {
  if (!value) return "";
  if (value.length < 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(
    Math.max(4, value.length - 6),
  )}${value.slice(-2)}`;
}

function serializeRow(row: CredentialRow, reveal: boolean) {
  return {
    id: row.id,
    key: row.key,
    value: reveal ? row.value : maskValue(row.value),
    value_masked: !reveal,
    description: row.description,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ── GET /list ─────────────────────────────────────────────────────────────

/**
 * List credentials. Values are masked by default. Pass `?reveal=1` to
 * return the raw values — the admin UI does this only in response to an
 * explicit "Reveal" click.
 */
export async function listHandler(req: NextRequest, table: ProviderTable) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reveal = req.nextUrl.searchParams.get("reveal") === "1";

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(table)
    .select("id, key, value, description, is_active, created_at, updated_at")
    .order("key", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    rows: (data ?? []).map((row) =>
      serializeRow(row as CredentialRow, reveal),
    ),
  });
}

// ── POST /create ──────────────────────────────────────────────────────────

interface CreateBody {
  key?: unknown;
  value?: unknown;
  description?: unknown;
  is_active?: unknown;
}

export async function createHandler(req: NextRequest, table: ProviderTable) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key.trim() : "";
  const value = typeof body.value === "string" ? body.value : "";
  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;
  const isActive = body.is_active === undefined ? true : !!body.is_active;

  if (!key) {
    return NextResponse.json(
      { error: "key is required (non-empty string)." },
      { status: 422 },
    );
  }
  if (typeof body.value !== "string") {
    return NextResponse.json(
      { error: "value is required (string)." },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(table)
    .insert({
      key,
      value,
      description,
      is_active: isActive,
    })
    .select("id, key, value, description, is_active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Drop any cached read for this key so the runtime picks it up on the
  // next credential resolve.
  invalidateCredentialsCache(table, key);

  return NextResponse.json(
    { row: serializeRow(data as CredentialRow, false) },
    { status: 201 },
  );
}

// ── PATCH /update ─────────────────────────────────────────────────────────

interface PatchBody {
  key?: unknown;
  value?: unknown;
  description?: unknown;
  is_active?: unknown;
}

export async function patchHandler(
  req: NextRequest,
  table: ProviderTable,
  id: string,
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.key !== undefined) {
    if (typeof body.key !== "string" || !body.key.trim()) {
      return NextResponse.json(
        { error: "key must be a non-empty string." },
        { status: 422 },
      );
    }
    update.key = body.key.trim();
  }
  if (body.value !== undefined) {
    if (typeof body.value !== "string") {
      return NextResponse.json(
        { error: "value must be a string." },
        { status: 422 },
      );
    }
    update.value = body.value;
  }
  if (body.description !== undefined) {
    update.description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;
  }
  if (body.is_active !== undefined) {
    update.is_active = !!body.is_active;
  }

  if (Object.keys(update).length === 1) {
    // Only updated_at was set — nothing to do.
    return NextResponse.json(
      { error: "No updatable fields supplied." },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // Object-level scope: the row must exist in the correct provider table.
  // If an admin tries to PATCH /google/<id> where <id> is a microsoft row,
  // the .eq("id", id) matches nothing and we 404.
  const { data, error } = await admin
    .from(table)
    .update(update)
    .eq("id", id)
    .select("id, key, value, description, is_active, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Row not found." }, { status: 404 });
  }

  // Invalidate the cache for BOTH the old and new keys (in case key was
  // renamed). Cheapest safe path: clear the whole provider namespace.
  invalidateCredentialsCache(table);

  return NextResponse.json({
    row: serializeRow(data as CredentialRow, false),
  });
}

// ── DELETE ────────────────────────────────────────────────────────────────

export async function deleteHandler(
  _req: NextRequest,
  table: ProviderTable,
  id: string,
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch the row first so we know which key to invalidate AND so we can
  // return 404 if the row doesn't exist in this provider's table.
  const { data: existing, error: fetchError } = await admin
    .from(table)
    .select("id, key")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Row not found." }, { status: 404 });
  }

  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  invalidateCredentialsCache(table, existing.key as string);

  return NextResponse.json({ ok: true });
}

// ── Single-row GET (for "reveal" action on an individual value) ──────────

export async function getOneHandler(
  _req: NextRequest,
  table: ProviderTable,
  id: string,
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(table)
    .select("id, key, value, description, is_active, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Row not found." }, { status: 404 });
  }

  return NextResponse.json({
    row: serializeRow(data as CredentialRow, true),
  });
}
