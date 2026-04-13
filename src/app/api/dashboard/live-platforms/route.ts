import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isPublicSectionBlocked,
  normalizePublishPolicy,
  publishBlockMessage,
} from "@/lib/diviner-publishing";

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
    .select("id, public_publish_blocked, blocked_public_sections, blocked_media_types, publish_block_reason")
    .eq("user_id", user.id)
    .single();
  return data;
}

export async function GET() {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stream_platform_configs")
    .select("*")
    .eq("diviner_id", diviner.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ platforms: data });
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

function isValidPlatform(value: unknown): value is ValidPlatform {
  return typeof value === "string" && (VALID_PLATFORMS as readonly string[]).includes(value);
}

export async function POST(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const publishPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);
  if (isPublicSectionBlocked(publishPolicy, "live")) {
    return NextResponse.json(
      {
        error: publishBlockMessage(
          publishPolicy,
          "Live stream publishing has been blocked by an administrator."
        ),
      },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { platform, stream_url, embed_url, display_name, is_enabled, sort_order } = body;

  if (!isValidPlatform(platform)) {
    return NextResponse.json(
      {
        error: "Invalid platform. Must be one of: youtube, facebook, instagram, tiktok, zoom, other",
      },
      { status: 422 }
    );
  }

  if (stream_url !== undefined && stream_url !== null && typeof stream_url !== "string") {
    return NextResponse.json({ error: "stream_url must be a string" }, { status: 422 });
  }
  if (embed_url !== undefined && embed_url !== null && typeof embed_url !== "string") {
    return NextResponse.json({ error: "embed_url must be a string" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stream_platform_configs")
    .upsert(
      {
        diviner_id: diviner.id,
        platform,
        stream_url: typeof stream_url === "string" ? stream_url || null : null,
        embed_url: typeof embed_url === "string" ? embed_url || null : null,
        display_name: typeof display_name === "string" ? display_name || null : null,
        is_enabled: typeof is_enabled === "boolean" ? is_enabled : true,
        sort_order: typeof sort_order === "number" ? sort_order : 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "diviner_id,platform" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ platform: data }, { status: 200 });
}
