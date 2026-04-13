import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["video", "audio", "article", "link", "image"] as const;
type MediaType = (typeof VALID_TYPES)[number];

const VALID_PLATFORMS = ["youtube", "spotify", "apple_podcasts", "instagram", "tiktok", "other"] as const;
type Platform = (typeof VALID_PLATFORMS)[number];

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/unauthorized", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const divinerId = sp.get("diviner_id");
  const typeParam = sp.get("type");
  const isActiveParam = sp.get("is_active");
  const moderationParam = sp.get("moderation_status");
  const cursor = sp.get("cursor"); // created_at
  const cursorId = sp.get("cursor_id"); // id tie-breaker
  const limit = Math.min(parseInt(sp.get("limit") ?? "50", 10), 100);

  const admin = createAdminClient();

  let query = admin
    .from("media_items")
    .select(
      `id, diviner_id, type, url, title, description, thumbnail_url,
       category, platform, duration_seconds, sort_order, is_active,
       is_featured, moderation_status, submitted_for_review_at, reviewed_at, reviewed_by, admin_review_notes, blocked_at, view_count, created_at, updated_at,
       diviner:diviners(id, username, display_name, avatar_url)`
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (divinerId) {
    query = query.eq("diviner_id", divinerId);
  }
  if (typeParam && VALID_TYPES.includes(typeParam as MediaType)) {
    query = query.eq("type", typeParam);
  }
  if (isActiveParam !== null && isActiveParam !== "") {
    query = query.eq("is_active", isActiveParam === "true");
  }
  if (moderationParam) {
    query = query.eq("moderation_status", moderationParam);
  }
  if (cursor && cursorId) {
    query = query.or(
      `created_at.lt.${cursor},and(created_at.eq.${cursor},id.lt.${cursorId})`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/admin/media-items]", error);
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/internal", title: "Internal server error", status: 500 },
      { status: 500 }
    );
  }

  const items = data ?? [];
  const nextCursor =
    items.length === limit
      ? {
          cursor: items[items.length - 1].created_at,
          cursor_id: items[items.length - 1].id,
        }
      : null;

  return NextResponse.json({ items, nextCursor });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/unauthorized", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const body = await req.json();
  const {
    diviner_id,
    type,
    url,
    title,
    description,
    thumbnail_url,
    category,
    platform,
    duration_seconds,
    sort_order = 0,
    is_featured = false,
  } = body as {
    diviner_id?: string;
    type?: string;
    url?: string;
    title?: string;
    description?: string;
    thumbnail_url?: string;
    category?: string;
    platform?: string;
    duration_seconds?: number;
    sort_order?: number;
    is_featured?: boolean;
  };

  if (!diviner_id) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/validation", title: "diviner_id is required", status: 422 },
      { status: 422 }
    );
  }
  if (!type || !VALID_TYPES.includes(type as MediaType)) {
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/validation",
        title: "type is required",
        status: 422,
        detail: `type must be one of: ${VALID_TYPES.join(", ")}`,
      },
      { status: 422 }
    );
  }
  if (!url?.trim()) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/validation", title: "url is required", status: 422 },
      { status: 422 }
    );
  }
  if (!title?.trim()) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/validation", title: "title is required", status: 422 },
      { status: 422 }
    );
  }
  if (platform && !VALID_PLATFORMS.includes(platform as Platform)) {
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/validation",
        title: "Invalid platform",
        status: 422,
        detail: `platform must be one of: ${VALID_PLATFORMS.join(", ")}`,
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const { data: item, error } = await admin
    .from("media_items")
    .insert({
      diviner_id,
      type,
      url: url.trim(),
      title: title.trim(),
      description: description?.trim() || null,
      thumbnail_url: thumbnail_url?.trim() || null,
      category: category?.trim() || null,
      platform: platform || null,
      duration_seconds: duration_seconds ?? null,
      sort_order,
      is_featured,
      moderation_status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/admin/media-items]", error);
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/internal", title: "Internal server error", status: 500 },
      { status: 500 }
    );
  }

  return NextResponse.json(item, { status: 201 });
}
