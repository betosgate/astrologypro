/**
 * GET  /api/dashboard/landing-pages/[templateId]/sections  — list sections (lazy-init)
 * POST /api/dashboard/landing-pages/[templateId]/sections  — add a new custom section
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SECTION_TYPES, validateSectionContent } from "@/lib/landing-page-section-types";
import { getOrCreateLandingPage, getAvailableSectionTypes } from "@/lib/landing-page-builder";
import { sanitizeSectionHtml } from "@/lib/html-sanitizer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string }>;
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

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;
  const { user, diviner } = await resolveDiviner();

  if (!user) return NextResponse.json({ status: 401, title: "Unauthorized" }, { status: 401 });
  if (!diviner) return NextResponse.json({ status: 403, title: "Diviner profile not found" }, { status: 403 });

  const admin = createAdminClient();

  // Verify diviner_services access for this template
  const { data: ds } = await admin
    .from("diviner_services")
    .select("is_enabled")
    .eq("diviner_id", diviner.id)
    .eq("template_id", templateId)
    .maybeSingle();

  if (!ds || !ds.is_enabled) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "This service template is not enabled for your account" },
      { status: 403 },
    );
  }

  // Lazy-init: get or create landing page
  const { page, sections } = await getOrCreateLandingPage(
    admin,
    diviner.id,
    templateId,
    user.id,
  );

  // Fetch section_type_config for available slot calculation
  const { data: typeConfig } = await admin
    .from("section_type_config")
    .select("type, max_per_page, is_globally_enabled");

  const dbConfig: Record<string, { max_per_page: number; is_globally_enabled: boolean }> = {};
  for (const t of typeConfig ?? []) {
    dbConfig[t.type] = { max_per_page: t.max_per_page, is_globally_enabled: t.is_globally_enabled };
  }

  const availableSectionTypes = getAvailableSectionTypes(sections, dbConfig);

  // Fetch the template slug so the client can build preview/live URLs
  // without having to issue a second round-trip.
  const { data: template } = await admin
    .from("service_templates")
    .select("slug")
    .eq("id", templateId)
    .maybeSingle();

  return NextResponse.json({
    landing_page: {
      id: page.id,
      status: page.status,
      custom_page_title: page.custom_page_title,
      accent_color: page.accent_color,
      draft_version: page.draft_version,
      published_version: page.published_version,
      moderation_status: page.moderation_status,
    },
    diviner: {
      username: diviner.username,
    },
    service_template: {
      slug: template?.slug ?? null,
    },
    sections: sections.map((s) => ({
      id: s.id,
      section_type: s.section_type,
      instance_key: s.instance_key,
      title: s.title,
      subtitle: s.subtitle,
      content_json: s.draft_content_json ?? s.content_json,
      body_html: s.draft_body_html ?? s.body_html,
      primary_image_url: s.primary_image_url,
      images: s.images,
      display_order: s.display_order,
      is_enabled: s.is_enabled,
      is_system: s.is_system,
      is_draft: s.is_draft,
      moderation_status: s.moderation_status,
      created_at: s.created_at,
      updated_at: s.updated_at,
    })),
    available_section_types: availableSectionTypes,
  });
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;
  const { user, diviner } = await resolveDiviner();

  if (!user) return NextResponse.json({ status: 401, title: "Unauthorized" }, { status: 401 });
  if (!diviner) return NextResponse.json({ status: 403, title: "Diviner profile not found" }, { status: 403 });

  const admin = createAdminClient();

  // Verify template access
  const { data: ds } = await admin
    .from("diviner_services")
    .select("is_enabled")
    .eq("diviner_id", diviner.id)
    .eq("template_id", templateId)
    .maybeSingle();

  if (!ds || !ds.is_enabled) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "This service template is not enabled for your account" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 422, title: "Invalid JSON" }, { status: 422 });
  }

  const sectionType = typeof body.section_type === "string" ? body.section_type : "";

  // 1. Validate section type exists in TypeScript registry and is not system
  const typeDef = SECTION_TYPES[sectionType];
  if (!typeDef) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: `Unknown section type: ${sectionType}` },
      { status: 422 },
    );
  }
  if (typeDef.is_system) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: "System sections cannot be added manually" },
      { status: 422 },
    );
  }

  // 2. Check DB config (is_globally_enabled, max_per_page)
  const { data: dbType } = await admin
    .from("section_type_config")
    .select("is_globally_enabled, max_per_page")
    .eq("type", sectionType)
    .maybeSingle();

  if (!dbType?.is_globally_enabled) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: "This section type is not available" },
      { status: 422 },
    );
  }

  // Get or create landing page
  const { page, sections } = await getOrCreateLandingPage(admin, diviner.id, templateId, user.id);

  // 3. Enforce max_per_page
  const maxPerPage = dbType.max_per_page ?? typeDef.max_per_page;
  if (maxPerPage > 0) {
    const existing = sections.filter((s) => s.section_type === sectionType).length;
    if (existing >= maxPerPage) {
      return NextResponse.json(
        { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: `Maximum ${maxPerPage} section(s) of type "${sectionType}" allowed per page` },
        { status: 422 },
      );
    }
  }

  // 4. Validate content_json against Zod schema
  const contentJson = (body.content_json as Record<string, unknown>) ?? typeDef.default_content;
  const validation = validateSectionContent(sectionType, contentJson);
  if (!validation.success) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: validation.errors?.join("; ") },
      { status: 422 },
    );
  }

  // 5. Sanitize body_html
  const rawHtml = typeof body.body_html === "string" ? body.body_html : null;
  const safeHtml = rawHtml ? sanitizeSectionHtml(rawHtml) : null;

  // 6. Auto-assign display_order
  const maxOrder = sections.reduce((m, s) => Math.max(m, s.display_order), 0);
  const displayOrder = typeof body.display_order === "number" ? body.display_order : maxOrder + 10;

  // 7. Generate instance_key for multi-instance types
  const instanceCount = sections.filter((s) => s.section_type === sectionType).length;
  const instanceKey = instanceCount > 0 ? `${sectionType}_${instanceCount + 1}` : null;

  const { data: created, error } = await admin
    .from("service_landing_page_sections")
    .insert({
      landing_page_id: page.id,
      diviner_id: diviner.id,
      section_type: sectionType,
      instance_key: instanceKey,
      title: typeof body.title === "string" ? body.title : null,
      subtitle: typeof body.subtitle === "string" ? body.subtitle : null,
      content_json: contentJson,
      body_html: safeHtml,
      primary_image_url: typeof body.primary_image_url === "string" ? body.primary_image_url : null,
      images: Array.isArray(body.images) ? body.images : [],
      display_order: displayOrder,
      is_enabled: true,
      is_system: false,
      is_draft: true,
      draft_content_json: contentJson,
      draft_body_html: safeHtml,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Insert failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ section: created }, { status: 201 });
}
