/**
 * GET    /api/dashboard/landing-pages/[templateId]/sections/[sectionId]
 * PATCH  /api/dashboard/landing-pages/[templateId]/sections/[sectionId]
 * DELETE /api/dashboard/landing-pages/[templateId]/sections/[sectionId]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SECTION_TYPES, validateSectionContent } from "@/lib/landing-page-section-types";
import { sanitizeSectionHtml } from "@/lib/html-sanitizer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string; sectionId: string }>;
}

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

async function resolveSection(admin: ReturnType<typeof createAdminClient>, sectionId: string, divinerId: string) {
  const { data } = await admin
    .from("service_landing_page_sections")
    .select("*")
    .eq("id", sectionId)
    .eq("diviner_id", divinerId)
    .maybeSingle();
  return data;
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;
  const { user, diviner } = await resolveDiviner();

  if (!user) return NextResponse.json({ status: 401, title: "Unauthorized" }, { status: 401 });
  if (!diviner) return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const section = await resolveSection(admin, sectionId, diviner.id);
  if (!section) {
    return NextResponse.json({ status: 404, title: "Section not found" }, { status: 404 });
  }

  return NextResponse.json({ section });
}

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;
  const { user, diviner } = await resolveDiviner();

  if (!user) return NextResponse.json({ status: 401, title: "Unauthorized" }, { status: 401 });
  if (!diviner) return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const section = await resolveSection(admin, sectionId, diviner.id);
  if (!section) {
    return NextResponse.json({ status: 404, title: "Section not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 422, title: "Invalid JSON" }, { status: 422 });
  }

  const updates: Record<string, unknown> = { updated_by: user.id };

  // Allowed editable fields
  if ("title" in body) updates.title = body.title;
  if ("subtitle" in body) updates.subtitle = body.subtitle;
  if ("primary_image_url" in body) updates.primary_image_url = body.primary_image_url;
  if ("images" in body) updates.images = body.images;

  // content_json: validate against type schema
  if ("content_json" in body) {
    const typeDef = SECTION_TYPES[section.section_type];
    if (typeDef) {
      const validation = validateSectionContent(section.section_type, body.content_json);
      if (!validation.success) {
        return NextResponse.json(
          { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: validation.errors?.join("; ") },
          { status: 422 },
        );
      }
    }
    updates.draft_content_json = body.content_json;
    updates.content_json = body.content_json;
  }

  // body_html: sanitize before saving
  if ("body_html" in body) {
    const html = typeof body.body_html === "string" ? body.body_html : null;
    const safe = html ? sanitizeSectionHtml(html) : null;
    updates.draft_body_html = safe;
    updates.body_html = safe;
  }

  // Mark as draft (needs re-publish to go live)
  updates.is_draft = true;

  // If section was flagged, editing resets to pending_review
  if (section.moderation_status === "flagged" || section.moderation_status === "rejected") {
    updates.moderation_status = "pending_review";
  }

  const { data: updated, error } = await admin
    .from("service_landing_page_sections")
    .update(updates)
    .eq("id", sectionId)
    .eq("diviner_id", diviner.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Update failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ section: updated });
}

// ── DELETE ─────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;
  const { user, diviner } = await resolveDiviner();

  if (!user) return NextResponse.json({ status: 401, title: "Unauthorized" }, { status: 401 });
  if (!diviner) return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const section = await resolveSection(admin, sectionId, diviner.id);
  if (!section) {
    return NextResponse.json({ status: 404, title: "Section not found" }, { status: 404 });
  }

  if (section.is_system) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Cannot delete system section", status: 422, detail: "System sections (hero, pricing, booking CTA) cannot be deleted" },
      { status: 422 },
    );
  }

  const { error } = await admin
    .from("service_landing_page_sections")
    .delete()
    .eq("id", sectionId)
    .eq("diviner_id", diviner.id);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Delete failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
