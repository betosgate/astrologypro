import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidLivePlatformKey } from "@/lib/live-platform-governance";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("live_platform_registry")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("platform_key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ platforms: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidLivePlatformKey(body.platform_key)) {
    return NextResponse.json({ error: "Invalid platform key" }, { status: 422 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const booleanFields = [
    "is_globally_enabled",
    "is_selectable_by_diviners",
    "supports_embed",
    "supports_chat_embed",
    "supports_oauth_connection",
    "supports_event_sync",
    "supports_auto_live_detection",
  ] as const;

  for (const field of booleanFields) {
    if (typeof body[field] === "boolean") {
      updates[field] = body[field];
    }
  }

  if (
    body.integration_tier === "first_class" ||
    body.integration_tier === "managed" ||
    body.integration_tier === "link_out_only" ||
    body.integration_tier === "custom"
  ) {
    updates.integration_tier = body.integration_tier;
  }

  if (
    body.playback_mode === "embedded_player" ||
    body.playback_mode === "external_link" ||
    body.playback_mode === "manual_status"
  ) {
    updates.playback_mode = body.playback_mode;
  }

  if (typeof body.display_name === "string" && body.display_name.trim()) {
    updates.display_name = body.display_name.trim();
  }

  if (typeof body.sort_order === "number") {
    updates.sort_order = body.sort_order;
  }

  if (body.admin_notes === null || typeof body.admin_notes === "string") {
    updates.admin_notes = typeof body.admin_notes === "string" && body.admin_notes.trim()
      ? body.admin_notes.trim()
      : null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("live_platform_registry")
    .update(updates)
    .eq("platform_key", body.platform_key)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ platform: data });
}
