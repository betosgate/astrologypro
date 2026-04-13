import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["video", "audio", "article", "link", "image"] as const;
const VALID_PLATFORMS = ["youtube", "spotify", "apple_podcasts", "instagram", "tiktok", "other"] as const;

type MediaType = (typeof VALID_TYPES)[number];
type Platform = (typeof VALID_PLATFORMS)[number];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/unauthorized", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("media_items")
    .select(
      `*, diviner:diviners(id, username, display_name, avatar_url)`
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/not-found", title: "Media item not found", status: 404 },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/unauthorized", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();

  const {
    type,
    url,
    title,
    description,
    thumbnail_url,
    category,
    platform,
    duration_seconds,
    sort_order,
    is_active,
    is_featured,
    moderation_status,
    admin_review_notes,
  } = body as {
    type?: string;
    url?: string;
    title?: string;
    description?: string;
    thumbnail_url?: string;
    category?: string;
    platform?: string;
    duration_seconds?: number | null;
    sort_order?: number;
    is_active?: boolean;
    is_featured?: boolean;
    moderation_status?: "pending" | "approved" | "rejected" | "blocked";
    admin_review_notes?: string | null;
  };

  if (type !== undefined && !VALID_TYPES.includes(type as MediaType)) {
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/validation",
        title: "Invalid type",
        status: 422,
        detail: `type must be one of: ${VALID_TYPES.join(", ")}`,
      },
      { status: 422 }
    );
  }
  if (platform !== undefined && platform !== null && !VALID_PLATFORMS.includes(platform as Platform)) {
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
  if (
    moderation_status !== undefined &&
    !["pending", "approved", "rejected", "blocked"].includes(moderation_status)
  ) {
    return NextResponse.json(
      {
        type: "https://astrologypro.com/errors/validation",
        title: "Invalid moderation status",
        status: 422,
      },
      { status: 422 }
    );
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (type !== undefined) update.type = type;
  if (url !== undefined) update.url = url.trim();
  if (title !== undefined) update.title = title.trim();
  if (description !== undefined) update.description = description?.trim() || null;
  if (thumbnail_url !== undefined) update.thumbnail_url = thumbnail_url?.trim() || null;
  if (category !== undefined) update.category = category?.trim() || null;
  if (platform !== undefined) update.platform = platform || null;
  if (duration_seconds !== undefined) update.duration_seconds = duration_seconds;
  if (sort_order !== undefined) update.sort_order = sort_order;
  if (is_active !== undefined) update.is_active = is_active;
  if (is_featured !== undefined) update.is_featured = is_featured;
  if (admin_review_notes !== undefined) update.admin_review_notes = admin_review_notes?.trim() || null;
  if (moderation_status !== undefined) {
    update.moderation_status = moderation_status;
    update.reviewed_at = new Date().toISOString();
    update.reviewed_by = user.id;
    if (moderation_status === "pending") {
      update.submitted_for_review_at = new Date().toISOString();
      update.blocked_at = null;
    }
    if (moderation_status === "approved") {
      update.is_active = true;
      update.blocked_at = null;
    }
    if (moderation_status === "rejected") {
      update.is_active = false;
      update.blocked_at = null;
    }
    if (moderation_status === "blocked") {
      update.is_active = false;
      update.is_featured = false;
      update.blocked_at = new Date().toISOString();
    }
  }

  const { data, error } = await admin
    .from("media_items")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/admin/media-items/[id]]", error);
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/internal", title: "Internal server error", status: 500 },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/unauthorized", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Soft delete — set is_active=false
  const { data, error } = await admin
    .from("media_items")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, is_active")
    .single();

  if (error) {
    console.error("[DELETE /api/admin/media-items/[id]]", error);
    return NextResponse.json(
      { type: "https://astrologypro.com/errors/internal", title: "Internal server error", status: 500 },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, ...data });
}
