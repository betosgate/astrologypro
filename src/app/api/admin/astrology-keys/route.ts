import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/astrology-keys
 * List all API keys. Secret keys are masked to show only the last 8 chars.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("astrology_api_keys")
    .select("*")
    .order("created_at", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Mask secret_key — show only last 8 chars
  const masked = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    secret_key_masked:
      typeof row.secret_key === "string" && row.secret_key.length > 8
        ? "****" + row.secret_key.slice(-8)
        : row.secret_key,
    secret_key: undefined, // strip full secret from response
  }));

  return NextResponse.json(masked);
}

/**
 * POST /api/admin/astrology-keys
 * Create a new API key.
 */
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { label, access_key, secret_key } = body;

  if (!access_key || !secret_key) {
    return NextResponse.json(
      { error: "access_key and secret_key are required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("astrology_api_keys")
    .insert({
      label: label || "Default",
      access_key,
      secret_key,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
