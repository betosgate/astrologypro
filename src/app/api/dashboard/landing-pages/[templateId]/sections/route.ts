/**
 * GET  /api/dashboard/landing-pages/[templateId]/sections — list blocks grouped by slot.
 * POST /api/dashboard/landing-pages/[templateId]/sections — create a block in a slot.
 *
 * Rewritten in Task 03 of the 2026-04-21 landing-page-simplification:
 *
 * - Only three block types are accepted: text | image | html.
 * - Every block belongs to exactly one of two slots: about_diviner | extra.
 * - GET is READ-ONLY — never lazy-creates a service_landing_pages row.
 *   Returns `{ about_diviner: [], extra: [] }` when no blocks exist yet.
 * - POST lazy-creates the service_landing_pages container atomically so the
 *   landing_page_id FK (still present in Deploy 1) is satisfied without
 *   surfacing the container to the diviner.
 * - HTML blocks are sanitized in STRICT mode: if the sanitizer would change
 *   the input at all, the response is 422 Problem Details per RFC 9457 with
 *   a `stripped_example` breadcrumb.
 * - Errors use the RFC 9457 shape {type, title, status, detail?}.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SECTION_TYPES,
  SLOTS,
  isBlockSlot,
  isBlockType,
  validateSectionContent,
  type BlockSlot,
  type BlockType,
} from "@/lib/landing-page-section-types";
import {
  HtmlSanitizationError,
  sanitizeDivinerHtmlStrict,
} from "@/lib/html-sanitizer";
import {
  countBlocksInSlot,
  getDivinerBlocksForOwner,
  nextDisplayOrderInSlot,
} from "@/lib/diviner-service-blocks";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string }>;
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

async function resolveDiviner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, diviner: null };
  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username")
    .eq("user_id", user.id)
    .maybeSingle();
  return { user, diviner };
}

async function verifyTemplateAccess(
  admin: ReturnType<typeof createAdminClient>,
  divinerId: string,
  templateId: string,
) {
  const { data: ds } = await admin
    .from("diviner_services")
    .select("is_enabled, is_published")
    .eq("diviner_id", divinerId)
    .eq("template_id", templateId)
    .maybeSingle();
  return { ok: !!ds?.is_enabled, ds };
}

// ── GET — read-only, grouped by slot ──────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;
  const { user, diviner } = await resolveDiviner();
  if (!user) return problem(401, "Unauthorized");
  if (!diviner) return problem(403, "Diviner profile not found");

  const admin = createAdminClient();
  const { ok, ds } = await verifyTemplateAccess(admin, diviner.id, templateId);
  if (!ok) {
    return problem(403, "Forbidden", "This service template is not enabled for your account");
  }

  const { data: template } = await admin
    .from("service_templates")
    .select("slug")
    .eq("id", templateId)
    .maybeSingle();

  const blocks = await getDivinerBlocksForOwner(admin, diviner.id, templateId);

  return NextResponse.json({
    diviner: { username: diviner.username },
    service_template: { slug: template?.slug ?? null },
    is_published: ds?.is_published === true,
    slots: Object.values(SLOTS),
    block_types: Object.values(SECTION_TYPES).map((t) => ({
      type: t.type,
      label: t.label,
      description: t.description,
      icon: t.icon,
      category: t.category,
      max_per_slot: t.max_per_slot,
    })),
    limits: { max_per_slot: SLOTS.about_diviner.max_per_slot },
    about_diviner: blocks.about_diviner,
    extra: blocks.extra,
  });
}

// ── POST — create a block in a slot ───────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;
  const { user, diviner } = await resolveDiviner();
  if (!user) return problem(401, "Unauthorized");
  if (!diviner) return problem(403, "Diviner profile not found");

  const admin = createAdminClient();
  const { ok } = await verifyTemplateAccess(admin, diviner.id, templateId);
  if (!ok) {
    return problem(403, "Forbidden", "This service template is not enabled for your account");
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return problem(422, "Invalid JSON");
  }

  // ── Validate section_type + slot against the V2 enum ────────────────────────
  const sectionType = body.section_type;
  const slot = body.slot;
  if (!isBlockType(sectionType)) {
    return problem(
      422,
      "Unknown block type",
      `section_type must be one of: ${Object.keys(SECTION_TYPES).join(", ")}`,
    );
  }
  if (!isBlockSlot(slot)) {
    return problem(
      422,
      "Unknown slot",
      `slot must be one of: ${Object.keys(SLOTS).join(", ")}`,
    );
  }

  const typeDef = SECTION_TYPES[sectionType as BlockType];
  const slotDef = SLOTS[slot as BlockSlot];

  // ── Enforce max_per_slot ────────────────────────────────────────────────────
  const existing = await countBlocksInSlot(admin, diviner.id, templateId, slot);
  const cap = slotDef.max_per_slot;
  if (cap > 0 && existing >= cap) {
    return problem(
      422,
      "Slot full",
      `You can have at most ${cap} blocks in the "${slotDef.label}" slot. Remove one before adding another.`,
    );
  }

  // ── Validate content + HTML ─────────────────────────────────────────────────
  const title = typeof body.title === "string" ? body.title : null;
  if (title && title.length > 140) {
    return problem(422, "Title too long", "Titles must be 140 characters or fewer.");
  }

  const contentJson = (body.content_json as Record<string, unknown> | null | undefined) ?? null;
  if (contentJson !== null) {
    const validation = validateSectionContent(sectionType, contentJson);
    if (!validation.success) {
      return problem(422, "Validation error", validation.errors?.join("; "));
    }
  }

  let safeHtml: string | null = null;
  if (sectionType === "html") {
    const raw = typeof body.body_html === "string" ? body.body_html : "";
    if (!raw.trim()) {
      return problem(422, "Missing HTML", "HTML blocks require a non-empty body_html value.");
    }
    try {
      safeHtml = sanitizeDivinerHtmlStrict(raw);
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

  const primaryImageUrl =
    typeof body.primary_image_url === "string" ? body.primary_image_url : null;
  if (sectionType === "image" && !primaryImageUrl) {
    return problem(
      422,
      "Missing image",
      "Image blocks require a primary_image_url. Upload through /upload first.",
    );
  }

  // ── Determine display_order ────────────────────────────────────────────────
  const displayOrder =
    typeof body.display_order === "number"
      ? body.display_order
      : await nextDisplayOrderInSlot(admin, diviner.id, templateId, slot as BlockSlot);

  // ── Insert ─────────────────────────────────────────────────────────────────
  const { data: created, error } = await admin
    .from("diviner_service_blocks")
    .insert({
      diviner_id: diviner.id,
      service_template_id: templateId,
      section_type: sectionType,
      slot,
      title,
      content_json: contentJson ?? typeDef.default_content,
      body_html: safeHtml,
      primary_image_url: primaryImageUrl,
      display_order: displayOrder,
      is_enabled: true,
      created_by: user.id,
      updated_by: user.id,
    })
    .select(
      "id, diviner_id, service_template_id, section_type, slot, title, content_json, body_html, primary_image_url, display_order, is_enabled, moderation_status, moderation_note, created_at, updated_at",
    )
    .single();

  if (error || !created) {
    return problem(500, "Insert failed", error?.message ?? "unknown error");
  }

  return NextResponse.json({ block: created }, { status: 201 });
}
