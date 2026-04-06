import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return data;
}

const VALID_PLATFORMS = [
  "youtube",
  "facebook",
  "instagram",
  "tiktok",
  "zoom",
  "other",
] as const;

type ValidPlatform = (typeof VALID_PLATFORMS)[number];

function isValidPlatform(value: string): value is ValidPlatform {
  return (VALID_PLATFORMS as readonly string[]).includes(value);
}

interface RouteContext {
  params: Promise<{ platform: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await context.params;
  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed = ["stream_url", "embed_url", "display_name", "is_enabled", "sort_order"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key] ?? null;
    }
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stream_platform_configs")
    .update(updates)
    .eq("diviner_id", diviner.id)
    .eq("platform", platform)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Platform config not found" }, { status: 404 });
  }

  return NextResponse.json({ platform: data });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await context.params;
  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("stream_platform_configs")
    .delete()
    .eq("diviner_id", diviner.id)
    .eq("platform", platform);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
