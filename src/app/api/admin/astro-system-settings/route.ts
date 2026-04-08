import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AstroSettingType } from "@/lib/astro/system-settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_TYPES: AstroSettingType[] = [
  "ASTROLOGY_API",
  "FREEASTROLOGY_API",
  "SYSTEM_CONFIG",
];

const ALLOWED_STATUSES = ["active", "inactive"] as const;

/**
 * GET /api/admin/astro-system-settings
 * Optional query: ?type=ASTROLOGY_API
 *
 * POST /api/admin/astro-system-settings
 * Body: { type, key_name, key_value, secret_value?, status?, notes? }
 *
 * Both endpoints require admin auth.
 */

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type");
  const admin = createAdminClient();

  let query = admin
    .from("astro_system_settings")
    .select("id, type, key_name, key_value, secret_value, status, notes, created_at, updated_at")
    .order("type", { ascending: true })
    .order("key_name", { ascending: true });

  if (type) {
    if (!ALLOWED_TYPES.includes(type as AstroSettingType)) {
      return NextResponse.json(
        { error: "Invalid type", allowed: ALLOWED_TYPES },
        { status: 422 },
      );
    }
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin/astro-system-settings GET]", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ settings: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const type = String(body.type ?? "").trim();
  const keyName = String(body.key_name ?? "").trim();
  const keyValue = String(body.key_value ?? "").trim();
  const secretValueRaw = body.secret_value;
  const statusRaw = body.status;
  const notesRaw = body.notes;

  if (!ALLOWED_TYPES.includes(type as AstroSettingType)) {
    return NextResponse.json(
      { error: "type is required and must be one of " + ALLOWED_TYPES.join(", ") },
      { status: 422 },
    );
  }
  if (!keyName) {
    return NextResponse.json(
      { error: "key_name is required" },
      { status: 422 },
    );
  }
  if (!keyValue) {
    return NextResponse.json(
      { error: "key_value is required" },
      { status: 422 },
    );
  }
  // SYSTEM_CONFIG and FREEASTROLOGY_API don't carry a secret. Reject if provided.
  if (type !== "ASTROLOGY_API" && secretValueRaw) {
    return NextResponse.json(
      {
        error:
          "secret_value is only valid for type=ASTROLOGY_API; FREEASTROLOGY_API and SYSTEM_CONFIG do not have a secret pair.",
      },
      { status: 422 },
    );
  }

  const status =
    typeof statusRaw === "string" &&
    (ALLOWED_STATUSES as readonly string[]).includes(statusRaw)
      ? statusRaw
      : "active";

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("astro_system_settings")
    .insert({
      type,
      key_name: keyName,
      key_value: keyValue,
      secret_value:
        type === "ASTROLOGY_API" && typeof secretValueRaw === "string"
          ? secretValueRaw.trim() || null
          : null,
      status,
      notes: typeof notesRaw === "string" ? notesRaw.trim() || null : null,
    })
    .select("id, type, key_name, key_value, secret_value, status, notes, created_at, updated_at")
    .single();

  if (error) {
    // 23505 = unique_violation on (type, key_name)
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "A setting with this type + key_name already exists" },
        { status: 409 },
      );
    }
    console.error("[admin/astro-system-settings POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ setting: data }, { status: 201 });
}
