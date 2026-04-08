import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_STATUSES = ["active", "inactive"] as const;

/**
 * PATCH /api/admin/astro-system-settings/[id]
 * Body: any subset of { key_value, secret_value, status, notes }
 * Note: type and key_name are immutable to keep the unique constraint stable.
 *
 * DELETE /api/admin/astro-system-settings/[id]
 * Hard delete. The endpoint is admin-only.
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 422 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.key_value !== undefined) {
    const v = String(body.key_value).trim();
    if (!v) {
      return NextResponse.json(
        { error: "key_value cannot be empty" },
        { status: 422 },
      );
    }
    updates.key_value = v;
  }
  if (body.secret_value !== undefined) {
    // Allow clearing the secret by passing "" or null.
    updates.secret_value =
      body.secret_value === null
        ? null
        : String(body.secret_value).trim() || null;
  }
  if (body.status !== undefined) {
    const s = String(body.status);
    if (!(ALLOWED_STATUSES as readonly string[]).includes(s)) {
      return NextResponse.json(
        { error: "status must be 'active' or 'inactive'" },
        { status: 422 },
      );
    }
    updates.status = s;
  }
  if (body.notes !== undefined) {
    updates.notes =
      body.notes === null ? null : String(body.notes).trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("astro_system_settings")
    .update(updates)
    .eq("id", id)
    .select("id, type, key_name, key_value, secret_value, status, notes, created_at, updated_at")
    .single();

  if (error || !data) {
    if ((error as { code?: string } | null)?.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[admin/astro-system-settings PATCH]", error);
    return NextResponse.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ setting: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 422 });
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("astro_system_settings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[admin/astro-system-settings DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
