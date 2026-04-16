import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const secretValue = String(body.secret_value ?? "").trim();
  if (!secretValue) {
    return NextResponse.json({ error: "secret_value is required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("astro_system_settings")
    .select("id, type, key_name, key_value, secret_value, status, notes, created_at, updated_at")
    .eq("type", "ASTROLOGY_API")
    .eq("secret_value", secretValue)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  const nextStatus = data.status === "active" ? "inactive" : "active";
  const { data: updated, error: updateError } = await admin
    .from("astro_system_settings")
    .update({ status: nextStatus })
    .eq("id", data.id)
    .select("id, type, key_name, key_value, secret_value, status, notes, created_at, updated_at")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message ?? "Toggle failed" }, { status: 500 });
  }

  return NextResponse.json({ setting: updated });
}
