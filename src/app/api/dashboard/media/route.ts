import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_MEDIA_IMAGES, normalizeAlbumName } from "@/lib/media-gallery";

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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return diviner ?? null;
}

// GET /api/dashboard/media
// Returns diviner's own media items ordered by sort_order ASC, id ASC
export async function GET() {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("media_items")
    .select(
      "id, type, url, title, description, thumbnail_url, category, album_name, platform, duration_seconds, sort_order, is_active, is_featured, moderation_status, submitted_for_review_at, reviewed_at, admin_review_notes, view_count, created_at, updated_at"
    )
    .eq("diviner_id", diviner.id)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("[GET /api/dashboard/media]", error);
    return problemDetail(500, "Internal Server Error", error.message);
  }

  return NextResponse.json({ items: data ?? [] });
}

// POST /api/dashboard/media
// Body: { title, description?, media_type, url, thumbnail_url?, featured?, is_active?, sort_order? }
export async function POST(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  let body: {
    title?: unknown;
    description?: unknown;
    media_type?: unknown;
    url?: unknown;
    thumbnail_url?: unknown;
    album_name?: unknown;
    featured?: unknown;
    is_active?: unknown;
    sort_order?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return problemDetail(400, "Bad Request", "Request body must be valid JSON.");
  }

  const {
    title,
    description,
    media_type,
    url,
    thumbnail_url,
    album_name,
    featured,
    is_active,
    sort_order,
  } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return problemDetail(422, "Validation Error", "Field 'title' is required.");
  }
  if (!media_type || !VALID_TYPES.includes(media_type as MediaType)) {
    return problemDetail(
      422,
      "Validation Error",
      `Field 'media_type' must be one of: ${VALID_TYPES.join(", ")}.`
    );
  }
  if (!url || typeof url !== "string" || !url.trim()) {
    return problemDetail(422, "Validation Error", "Field 'url' is required.");
  }

  const admin = createAdminClient();

  if (media_type === "image") {
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

  const { data: item, error } = await admin
    .from("media_items")
    .insert({
      diviner_id: diviner.id,
      type: media_type as MediaType,
      url: (url as string).trim(),
      title: (title as string).trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      thumbnail_url:
        typeof thumbnail_url === "string" && thumbnail_url.trim()
          ? thumbnail_url.trim()
          : media_type === "image"
            ? (url as string).trim()
            : null,
      album_name: media_type === "image" ? normalizeAlbumName(album_name) : null,
      is_featured: featured === true,
      is_active: is_active !== false,
      moderation_status: "pending",
      submitted_for_review_at: new Date().toISOString(),
      sort_order: typeof sort_order === "number" ? sort_order : 0,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/dashboard/media]", error);
    return problemDetail(500, "Internal Server Error", error.message);
  }

  return NextResponse.json(item, { status: 201 });
}
