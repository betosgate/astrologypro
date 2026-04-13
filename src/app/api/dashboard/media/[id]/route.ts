import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_MEDIA_IMAGES, normalizeAlbumName } from "@/lib/media-gallery";
import {
  isMediaTypeBlocked,
  normalizePublishPolicy,
  publishBlockMessage,
} from "@/lib/diviner-publishing";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["video", "audio", "image", "article", "link"] as const;
type MediaType = (typeof VALID_TYPES)[number];

function problemDetail(status: number, title: string, detail: string): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title, detail, status },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, public_publish_blocked, blocked_public_sections, blocked_media_types, publish_block_reason")
    .eq("user_id", user.id)
    .maybeSingle();

  return diviner ?? null;
}

// PATCH /api/dashboard/media/[id]
// Body: { title?, description?, url?, thumbnail_url?, featured?, is_active?, sort_order?, media_type? }
// Enforces object-level auth: diviner_id must match
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  const { id } = await params;
  const admin = createAdminClient();

  const { data: item, error } = await admin
    .from("media_items")
    .select(
      "id, diviner_id, type, url, title, description, thumbnail_url, category, album_name, platform, duration_seconds, sort_order, is_active, is_featured, moderation_status, submitted_for_review_at, reviewed_at, admin_review_notes, view_count, created_at, updated_at"
    )
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (error || !item) {
    return problemDetail(404, "Not Found", "Media item not found.");
  }

  return NextResponse.json(item);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");
  const publishPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);

  const { id } = await params;

  const admin = createAdminClient();

  // Object-level authorization check
  const { data: existing, error: fetchErr } = await admin
    .from("media_items")
    .select("id, diviner_id, type, moderation_status")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (fetchErr || !existing) {
    return problemDetail(404, "Not Found", "Media item not found.");
  }
  if (existing.moderation_status === "blocked") {
    return problemDetail(
      403,
      "Blocked",
      "This media item has been permanently blocked by an administrator and cannot be edited."
    );
  }

  let body: {
    title?: unknown;
    description?: unknown;
    url?: unknown;
    thumbnail_url?: unknown;
    album_name?: unknown;
    featured?: unknown;
    is_active?: unknown;
    sort_order?: unknown;
    media_type?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return problemDetail(400, "Bad Request", "Request body must be valid JSON.");
  }

  const {
    title,
    description,
    url,
    thumbnail_url,
    album_name,
    featured,
    is_active,
    sort_order,
    media_type,
  } = body;

  if (media_type !== undefined && !VALID_TYPES.includes(media_type as MediaType)) {
    return problemDetail(
      422,
      "Validation Error",
      `media_type must be one of: ${VALID_TYPES.join(", ")}.`
    );
  }
  const requestedType = typeof media_type === "string" ? media_type : existing.type;
  if (isMediaTypeBlocked(publishPolicy, requestedType)) {
    return problemDetail(
      403,
      "Publishing blocked",
      publishBlockMessage(
        publishPolicy,
        `Publishing ${String(requestedType)} media has been blocked by an administrator.`
      )
    );
  }

  if (media_type === "image" && existing.type !== "image") {
    const { count, error: countError } = await admin
      .from("media_items")
      .select("id", { count: "exact", head: true })
      .eq("diviner_id", diviner.id)
      .eq("type", "image");

    if (countError) {
      return problemDetail(500, "Internal Server Error", countError.message);
    }
    if ((count ?? 0) >= MAX_MEDIA_IMAGES) {
      return problemDetail(
        422,
        "Image Limit Reached",
        `You can upload up to ${MAX_MEDIA_IMAGES} images across all albums.`
      );
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (title !== undefined) updates.title = typeof title === "string" ? title.trim() : title;
  if (description !== undefined) updates.description = typeof description === "string" && description.trim() ? description.trim() : null;
  if (url !== undefined) updates.url = typeof url === "string" ? url.trim() : url;
  if (thumbnail_url !== undefined) updates.thumbnail_url = typeof thumbnail_url === "string" && thumbnail_url.trim() ? thumbnail_url.trim() : null;
  if (album_name !== undefined) updates.album_name = normalizeAlbumName(album_name);
  if (featured !== undefined) updates.is_featured = featured === true;
  if (is_active !== undefined) updates.is_active = is_active === true;
  if (sort_order !== undefined) updates.sort_order = sort_order;
  if (media_type !== undefined) updates.type = media_type;
  if (media_type !== undefined && media_type !== "image") updates.album_name = null;
  if (
    media_type !== undefined &&
    media_type === "image" &&
    thumbnail_url === undefined &&
    typeof url === "string" &&
    url.trim()
  ) {
    updates.thumbnail_url = url.trim();
  }

  if (Object.keys(updates).length === 1) {
    return problemDetail(422, "Validation Error", "No updatable fields provided.");
  }

  const shouldResubmit =
    existing.moderation_status === "approved" || existing.moderation_status === "rejected";
  if (shouldResubmit) {
    updates.moderation_status = "pending";
    updates.submitted_for_review_at = new Date().toISOString();
    updates.reviewed_at = null;
    updates.reviewed_by = null;
    updates.admin_review_notes = null;
  }

  const { data: updated, error } = await admin
    .from("media_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/dashboard/media/[id]]", error);
    return problemDetail(500, "Internal Server Error", error.message);
  }

  return NextResponse.json(updated);
}

// DELETE /api/dashboard/media/[id]
// Hard delete — removes the record from the database
// Enforces object-level auth: diviner_id must match
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");
  const publishPolicy = normalizePublishPolicy(diviner as Record<string, unknown>);

  const { id } = await params;
  const admin = createAdminClient();

  // Object-level authorization check
  const { data: existing, error: fetchErr } = await admin
    .from("media_items")
    .select("id, diviner_id, type, moderation_status")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (fetchErr || !existing) {
    return problemDetail(404, "Not Found", "Media item not found.");
  }
  if (existing.moderation_status === "blocked") {
    return problemDetail(
      403,
      "Blocked",
      "This media item has been permanently blocked by an administrator and cannot be managed from the diviner dashboard."
    );
  }
  if (isMediaTypeBlocked(publishPolicy, existing.type)) {
    return problemDetail(
      403,
      "Publishing blocked",
      publishBlockMessage(
        publishPolicy,
        `Publishing ${String(existing.type)} media has been blocked by an administrator.`
      )
    );
  }

  const { error } = await admin
    .from("media_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[DELETE /api/dashboard/media/[id]]", error);
    return problemDetail(500, "Internal Server Error", error.message);
  }

  return NextResponse.json({ ok: true });
}
