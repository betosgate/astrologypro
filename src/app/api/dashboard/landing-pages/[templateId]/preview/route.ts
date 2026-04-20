/**
 * GET /api/dashboard/landing-pages/[templateId]/preview
 *
 * Returns the *draft* version of a landing page + its sections so the diviner
 * can preview unpublished edits without publishing.
 *
 * Authorization: only the owning diviner (via diviner_services) can preview.
 *
 * Response shape is intentionally close to the public composed page so the
 * builder preview pane can render the same way a public visitor would — but
 * reading from draft_* columns. The page_meta.is_preview flag lets the UI
 * show a "Draft preview" ribbon.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateLandingPage } from "@/lib/landing-page-builder";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 },
    );
  }

  const admin = createAdminClient();

  // Resolve diviner and enforce object-level authorization.
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden", status: 403 },
      { status: 403 },
    );
  }

  // Ensure the diviner actually has this template enabled — otherwise they
  // have no business previewing it.
  const { data: ds } = await admin
    .from("diviner_services")
    .select("is_enabled, is_published, publish_status, price")
    .eq("diviner_id", diviner.id)
    .eq("template_id", templateId)
    .maybeSingle();

  if (!ds || !ds.is_enabled) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/403",
        title: "Forbidden",
        status: 403,
        detail: "This service template is not enabled for your account",
      },
      { status: 403 },
    );
  }

  // Load the template so the preview can render header info even if there is
  // no custom landing page row yet.
  const { data: template } = await admin
    .from("service_templates")
    .select("id, name, slug, category, description, long_description, base_price, duration_minutes, icon_name, is_active, seo_title, seo_description, whats_included, who_its_for, faq")
    .eq("id", templateId)
    .maybeSingle();

  if (!template) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Service template not found", status: 404 },
      { status: 404 },
    );
  }

  // Lazy-init so preview always returns a usable page structure, even on the
  // very first load from the builder. This mirrors the behavior of the
  // builder sections endpoint.
  const { page, sections } = await getOrCreateLandingPage(
    admin,
    diviner.id,
    templateId,
    user.id,
  );

  // Return draft content preferentially, falling back to published content so
  // a newly-created section renders immediately.
  const previewSections = sections
    .filter((s) => s.is_enabled !== false)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((s) => ({
      id:                 s.id,
      section_type:       s.section_type,
      instance_key:       s.instance_key,
      title:              s.title,
      subtitle:           s.subtitle,
      content_json:       s.draft_content_json ?? s.content_json,
      body_html:          s.draft_body_html ?? s.body_html,
      primary_image_url:  s.primary_image_url,
      images:             s.images,
      display_order:      s.display_order,
      is_system:          s.is_system,
      is_draft:           s.is_draft,
      moderation_status:  s.moderation_status,
    }));

  return NextResponse.json({
    is_preview: true,
    diviner: {
      id:           diviner.id,
      username:     diviner.username,
      display_name: diviner.display_name,
    },
    service_template: {
      id:               template.id,
      name:             template.name,
      slug:             template.slug,
      category:         template.category,
      description:      template.description,
      long_description: template.long_description,
      base_price:       template.base_price,
      duration_minutes: template.duration_minutes,
      icon_name:        template.icon_name,
      seo_title:        template.seo_title,
      seo_description:  template.seo_description,
      whats_included:   template.whats_included,
      who_its_for:      template.who_its_for,
      faq:              template.faq,
    },
    landing_page: {
      id:                 page.id,
      status:             page.status,
      moderation_status:  page.moderation_status,
      draft_version:      page.draft_version,
      published_version:  page.published_version,
      custom_page_title:  page.custom_page_title,
      accent_color:       page.accent_color,
    },
    service_assignment: {
      is_enabled:     ds.is_enabled,
      is_published:   ds.is_published,
      publish_status: ds.publish_status,
      price:          ds.price ?? template.base_price,
    },
    sections: previewSections,
  });
}
