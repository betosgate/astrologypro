/**
 * GET  /api/admin/landing-pages/[landingPageId]/sections
 * POST /api/admin/landing-pages/[landingPageId]/sections
 * Admin manages blocks on behalf of any diviner.
 *
 * V2: the `[landingPageId]` path param is now a `service_template_id`. The
 * container table was removed; blocks live under (diviner_id, service_template_id).
 * POST requires a `diviner_id` body field to scope the insert.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SECTION_TYPES, validateSectionContent } from "@/lib/landing-page-section-types";
import { sanitizeSectionHtml } from "@/lib/html-sanitizer";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ landingPageId: string }>;
}

async function resolveAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const admin = createAdminClient();
  const { data } = await admin.from("admin_users").select("id").eq("user_id", user.id).maybeSingle();
  return { user, isAdmin: !!data };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { landingPageId: serviceTemplateId } = await params;
  const { user, isAdmin } = await resolveAdmin();
  if (!user) return NextResponse.json({ status: 401 }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ status: 403 }, { status: 403 });

  const divinerId = req.nextUrl.searchParams.get("diviner_id");

  const admin = createAdminClient();
  let query = admin
    .from("diviner_service_blocks")
    .select("*")
    .eq("service_template_id", serviceTemplateId)
    .order("display_order", { ascending: true });

  if (divinerId) query = query.eq("diviner_id", divinerId);

  const { data: sections, error } = await query;

  if (error) return NextResponse.json({ status: 500, detail: error.message }, { status: 500 });

  return NextResponse.json({ sections: sections ?? [] });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { landingPageId: serviceTemplateId } = await params;
  const { user, isAdmin } = await resolveAdmin();
  if (!user) return NextResponse.json({ status: 401 }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ status: 403 }, { status: 403 });

  const admin = createAdminClient();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 422, title: "Invalid JSON" }, { status: 422 });
  }

  const divinerId = typeof body.diviner_id === "string" ? body.diviner_id : "";
  if (!divinerId) {
    return NextResponse.json({ status: 422, title: "diviner_id is required" }, { status: 422 });
  }

  const sectionType = typeof body.section_type === "string" ? body.section_type : "";
  const typeDef = SECTION_TYPES[sectionType];
  if (!typeDef) {
    return NextResponse.json({ status: 422, title: `Unknown section type: ${sectionType}` }, { status: 422 });
  }

  const contentJson = (body.content_json as Record<string, unknown>) ?? typeDef.default_content;
  const validation = validateSectionContent(sectionType, contentJson);
  if (!validation.success) {
    return NextResponse.json({ status: 422, title: "Validation error", detail: validation.errors?.join("; ") }, { status: 422 });
  }

  const rawHtml = typeof body.body_html === "string" ? body.body_html : null;
  const safeHtml = rawHtml ? sanitizeSectionHtml(rawHtml) : null;

  const { data: existing } = await admin
    .from("diviner_service_blocks")
    .select("display_order")
    .eq("diviner_id", divinerId)
    .eq("service_template_id", serviceTemplateId)
    .order("display_order", { ascending: false })
    .limit(1);

  const maxOrder = existing?.[0]?.display_order ?? 0;

  const { data: created, error } = await admin
    .from("diviner_service_blocks")
    .insert({
      diviner_id: divinerId,
      service_template_id: serviceTemplateId,
      section_type: sectionType,
      title: body.title ?? null,
      content_json: contentJson,
      body_html: safeHtml,
      display_order: maxOrder + 10,
      is_enabled: true,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ status: 500, detail: error.message }, { status: 500 });

  return NextResponse.json({ section: created }, { status: 201 });
}
