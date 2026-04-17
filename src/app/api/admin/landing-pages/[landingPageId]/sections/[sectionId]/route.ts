/**
 * GET   /api/admin/landing-pages/[landingPageId]/sections/[sectionId]
 * PATCH /api/admin/landing-pages/[landingPageId]/sections/[sectionId]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateSectionContent } from "@/lib/landing-page-section-types";
import { sanitizeSectionHtml } from "@/lib/html-sanitizer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ landingPageId: string; sectionId: string }>;
}

async function resolveAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const admin = createAdminClient();
  const { data } = await admin.from("admin_users").select("id").eq("user_id", user.id).maybeSingle();
  return { user, isAdmin: !!data };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;
  const { user, isAdmin } = await resolveAdmin();
  if (!user) return NextResponse.json({ status: 401 }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ status: 403 }, { status: 403 });

  const admin = createAdminClient();
  const { data: section, error } = await admin
    .from("service_landing_page_sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle();

  if (error || !section) return NextResponse.json({ status: 404, title: "Not found" }, { status: 404 });

  return NextResponse.json({ section });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;
  const { user, isAdmin } = await resolveAdmin();
  if (!user) return NextResponse.json({ status: 401 }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ status: 403 }, { status: 403 });

  const admin = createAdminClient();
  const { data: section } = await admin
    .from("service_landing_page_sections")
    .select("section_type")
    .eq("id", sectionId)
    .maybeSingle();

  if (!section) return NextResponse.json({ status: 404, title: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 422, title: "Invalid JSON" }, { status: 422 });
  }

  const updates: Record<string, unknown> = { updated_by: user.id };

  if ("title" in body) updates.title = body.title;
  if ("subtitle" in body) updates.subtitle = body.subtitle;
  if ("is_enabled" in body) updates.is_enabled = body.is_enabled;
  if ("moderation_status" in body) updates.moderation_status = body.moderation_status;
  if ("moderation_note" in body) updates.moderation_note = body.moderation_note;
  if ("primary_image_url" in body) updates.primary_image_url = body.primary_image_url;
  if ("images" in body) updates.images = body.images;

  if ("content_json" in body) {
    const validation = validateSectionContent(section.section_type, body.content_json);
    if (!validation.success) {
      return NextResponse.json({ status: 422, title: "Validation error", detail: validation.errors?.join("; ") }, { status: 422 });
    }
    updates.draft_content_json = body.content_json;
    updates.content_json = body.content_json;
  }

  if ("body_html" in body) {
    const html = typeof body.body_html === "string" ? body.body_html : null;
    const safe = html ? sanitizeSectionHtml(html) : null;
    updates.draft_body_html = safe;
    updates.body_html = safe;
  }

  if ("content_json" in body || "body_html" in body) {
    updates.is_draft = true;
  }

  const { data: updated, error } = await admin
    .from("service_landing_page_sections")
    .update(updates)
    .eq("id", sectionId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ status: 500, detail: error.message }, { status: 500 });

  return NextResponse.json({ section: updated });
}
