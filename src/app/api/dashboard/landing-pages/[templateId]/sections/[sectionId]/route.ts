/**
 * GET    /api/dashboard/landing-pages/[templateId]/sections/[sectionId]
 * PATCH  /api/dashboard/landing-pages/[templateId]/sections/[sectionId]
 * DELETE /api/dashboard/landing-pages/[templateId]/sections/[sectionId]
 *
 * Rewritten in Task 03 of the 2026-04-21 landing-page-simplification. PATCH
 * is strictly allowlisted: only title, content_json, body_html,
 * primary_image_url, and is_enabled may be changed. Any other field
 * (is_draft, is_system, moderation_*, draft_*, published_*, display_order,
 * section_type, slot, diviner_id, landing_page_id) is rejected with 422 per
 * RFC 9457. Display order and slot are changed via the reorder endpoint.
 * HTML is sanitized in strict mode.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SECTION_TYPES, validateSectionContent } from "@/lib/landing-page-section-types";
import { HtmlSanitizationError, sanitizeDivinerHtmlStrict } from "@/lib/html-sanitizer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string; sectionId: string }>;
}

function problem(
  status: number,
  title: string,
  detail?: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    { type: "about:blank", title, status, ...(detail ? { detail } : {}), ...(extra ?? {}) },
    { status },
  );
}

const ALLOWED_PATCH_FIELDS = new Set([
  "title",
  "content_json",
  "body_html",
  "primary_image_url",
  "is_enabled",
]);

async function resolveDiviner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, diviner: null };
  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return { user, diviner };
}

async function resolveBlock(
  admin: ReturnType<typeof createAdminClient>,
  sectionId: string,
  divinerId: string,
) {
  const { data } = await admin
    .from("diviner_service_blocks")
    .select(
      "id, diviner_id, section_type, slot, title, content_json, body_html, primary_image_url, display_order, is_enabled, moderation_status, moderation_note, created_at, updated_at",
    )
    .eq("id", sectionId)
    .eq("diviner_id", divinerId)
    .maybeSingle();
  return data;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;
  const { user, diviner } = await resolveDiviner();
  if (!user) return problem(401, "Unauthorized");
  if (!diviner) return problem(403, "Forbidden");

  const admin = createAdminClient();
  const block = await resolveBlock(admin, sectionId, diviner.id);
  if (!block) return problem(404, "Block not found");

  return NextResponse.json({ block });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;
  const { user, diviner } = await resolveDiviner();
  if (!user) return problem(401, "Unauthorized");
  if (!diviner) return problem(403, "Forbidden");

  const admin = createAdminClient();
  const block = await resolveBlock(admin, sectionId, diviner.id);
  if (!block) return problem(404, "Block not found");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return problem(422, "Invalid JSON");
  }

  // ── Reject any disallowed field ────────────────────────────────────────────
  const invalidKeys = Object.keys(body).filter((k) => !ALLOWED_PATCH_FIELDS.has(k));
  if (invalidKeys.length > 0) {
    return problem(
      422,
      "Disallowed fields",
      `These fields cannot be changed here: ${invalidKeys.join(", ")}. Allowed: ${[...ALLOWED_PATCH_FIELDS].join(", ")}.`,
    );
  }

  const updates: Record<string, unknown> = { updated_by: user.id };

  // title
  if ("title" in body) {
    const title = body.title;
    if (title !== null && (typeof title !== "string" || title.length > 140)) {
      return problem(422, "Invalid title", "Title must be a string ≤ 140 characters, or null.");
    }
    updates.title = title;
  }

  // content_json
  if ("content_json" in body) {
    const contentJson = body.content_json;
    if (contentJson !== null) {
      const validation = validateSectionContent(block.section_type, contentJson);
      if (!validation.success) {
        return problem(422, "Validation error", validation.errors?.join("; "));
      }
    }
    updates.content_json = contentJson;
  }

  // body_html — strict sanitize
  if ("body_html" in body) {
    const raw = body.body_html;
    if (raw === null || raw === "") {
      updates.body_html = null;
    } else if (typeof raw !== "string") {
      return problem(422, "Invalid body_html", "body_html must be a string or null.");
    } else if (block.section_type !== "html") {
      return problem(
        422,
        "body_html not allowed",
        "Only `html` blocks accept body_html. Use content_json or primary_image_url for this block type.",
      );
    } else {
      try {
        const safe = sanitizeDivinerHtmlStrict(raw);
        updates.body_html = safe;
      } catch (err) {
        if (err instanceof HtmlSanitizationError) {
          return problem(
            422,
            "Invalid HTML",
            "Your HTML contains tags or attributes we don't allow. Remove them and resubmit.",
            { stripped_example: err.strippedExample },
          );
        }
        throw err;
      }
    }
  }

  // primary_image_url
  if ("primary_image_url" in body) {
    const url = body.primary_image_url;
    if (url !== null && typeof url !== "string") {
      return problem(422, "Invalid primary_image_url", "Must be a string URL or null.");
    }
    if (block.section_type === "image" && (url === null || url === "")) {
      return problem(
        422,
        "Image URL required",
        "Image blocks cannot have an empty primary_image_url.",
      );
    }
    updates.primary_image_url = url;
  }

  // is_enabled
  if ("is_enabled" in body) {
    if (typeof body.is_enabled !== "boolean") {
      return problem(422, "Invalid is_enabled", "Must be boolean.");
    }
    updates.is_enabled = body.is_enabled;
  }

  // If the block was previously flagged/rejected, an edit drops it back to
  // pending_review — the admin moderation queue will pick it up again.
  if (block.moderation_status === "flagged" || block.moderation_status === "rejected") {
    updates.moderation_status = "pending_review";
  }

  const { data: updated, error } = await admin
    .from("diviner_service_blocks")
    .update(updates)
    .eq("id", sectionId)
    .eq("diviner_id", diviner.id)
    .select(
      "id, diviner_id, section_type, slot, title, content_json, body_html, primary_image_url, display_order, is_enabled, moderation_status, moderation_note, created_at, updated_at",
    )
    .single();

  if (error || !updated) {
    return problem(500, "Update failed", error?.message ?? "unknown error");
  }

  return NextResponse.json({ block: updated });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;
  const { user, diviner } = await resolveDiviner();
  if (!user) return problem(401, "Unauthorized");
  if (!diviner) return problem(403, "Forbidden");

  const admin = createAdminClient();
  const block = await resolveBlock(admin, sectionId, diviner.id);
  if (!block) return problem(404, "Block not found");

  const { error } = await admin
    .from("diviner_service_blocks")
    .delete()
    .eq("id", sectionId)
    .eq("diviner_id", diviner.id);

  if (error) {
    return problem(500, "Delete failed", error.message);
  }

  return new NextResponse(null, { status: 204 });
}

// Reference so the static analyzer doesn't flag SECTION_TYPES as unused when
// future handlers want to gate by type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keepTypeRegistry = SECTION_TYPES;
