import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// PATCH /api/dashboard/media/[id]
// Body: { title?, description?, url?, thumbnail_url?, featured?, is_active?, sort_order?, media_type? }
// Enforces object-level auth: diviner_id must match
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  const { id } = await params;

  const admin = createAdminClient();

  // Object-level authorization check
  const { data: existing, error: fetchErr } = await admin
    .from("media_items")
    .select("id, diviner_id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (fetchErr || !existing) {
    return problemDetail(404, "Not Found", "Media item not found.");
  }

  let body: {
    title?: unknown;
    description?: unknown;
    url?: unknown;
    thumbnail_url?: unknown;
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

  const { title, description, url, thumbnail_url, featured, is_active, sort_order, media_type } = body;

  if (media_type !== undefined && !VALID_TYPES.includes(media_type as MediaType)) {
    return problemDetail(
      422,
      "Validation Error",
      `media_type must be one of: ${VALID_TYPES.join(", ")}.`
    );
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (title !== undefined) updates.title = typeof title === "string" ? title.trim() : title;
  if (description !== undefined) updates.description = typeof description === "string" && description.trim() ? description.trim() : null;
  if (url !== undefined) updates.url = typeof url === "string" ? url.trim() : url;
  if (thumbnail_url !== undefined) updates.thumbnail_url = typeof thumbnail_url === "string" && thumbnail_url.trim() ? thumbnail_url.trim() : null;
  if (featured !== undefined) updates.is_featured = featured === true;
  if (is_active !== undefined) updates.is_active = is_active === true;
  if (sort_order !== undefined) updates.sort_order = sort_order;
  if (media_type !== undefined) updates.type = media_type;

  if (Object.keys(updates).length === 1) {
    return problemDetail(422, "Validation Error", "No updatable fields provided.");
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

  const { id } = await params;
  const admin = createAdminClient();

  // Object-level authorization check
  const { data: existing, error: fetchErr } = await admin
    .from("media_items")
    .select("id, diviner_id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (fetchErr || !existing) {
    return problemDetail(404, "Not Found", "Media item not found.");
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
