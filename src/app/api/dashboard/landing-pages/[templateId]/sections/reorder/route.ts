/**
 * PATCH /api/dashboard/landing-pages/[templateId]/sections/reorder
 * Batch-update display_order for all custom sections.
 * System sections with is_reorderable = false keep their fixed positions.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SECTION_TYPES } from "@/lib/landing-page-section-types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: 401, title: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });

  // Verify template access
  const { data: ds } = await admin
    .from("diviner_services")
    .select("is_enabled")
    .eq("diviner_id", diviner.id)
    .eq("template_id", templateId)
    .maybeSingle();
  if (!ds?.is_enabled) {
    return NextResponse.json({ status: 403, title: "Template not enabled" }, { status: 403 });
  }

  let body: { section_order?: Array<{ id: string; display_order: number }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 422, title: "Invalid JSON" }, { status: 422 });
  }

  const sectionOrder = body.section_order;
  if (!Array.isArray(sectionOrder) || sectionOrder.length === 0) {
    return NextResponse.json({ status: 422, title: "section_order array required" }, { status: 422 });
  }

  // Fetch all sections for this diviner's landing page
  const { data: landingPage } = await admin
    .from("service_landing_pages")
    .select("id")
    .eq("diviner_id", diviner.id)
    .eq("service_template_id", templateId)
    .maybeSingle();

  if (!landingPage) {
    return NextResponse.json({ status: 404, title: "Landing page not found" }, { status: 404 });
  }

  const { data: existingSections } = await admin
    .from("service_landing_page_sections")
    .select("id, section_type, is_system")
    .eq("landing_page_id", landingPage.id)
    .eq("diviner_id", diviner.id);

  const sectionMap = new Map(existingSections?.map((s) => [s.id, s]) ?? []);

  // Validate: all IDs must belong to this landing page
  for (const item of sectionOrder) {
    if (!sectionMap.has(item.id)) {
      return NextResponse.json(
        { status: 422, title: "Invalid section ID", detail: `Section ${item.id} does not belong to this page` },
        { status: 422 },
      );
    }
  }

  // Filter: only update reorderable (non-fixed-position) sections
  const updates = sectionOrder.filter((item) => {
    const s = sectionMap.get(item.id)!;
    const typeDef = SECTION_TYPES[s.section_type];
    return typeDef?.is_reorderable !== false;
  });

  // Batch update display_order
  const errors: string[] = [];
  for (const item of updates) {
    const { error } = await admin
      .from("service_landing_page_sections")
      .update({ display_order: item.display_order, updated_by: user.id })
      .eq("id", item.id)
      .eq("diviner_id", diviner.id);
    if (error) errors.push(`${item.id}: ${error.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ status: 500, title: "Partial failure", detail: errors.join("; ") }, { status: 500 });
  }

  // Return updated sections
  const { data: updated } = await admin
    .from("service_landing_page_sections")
    .select("id, section_type, display_order, is_enabled, is_system")
    .eq("landing_page_id", landingPage.id)
    .order("display_order", { ascending: true });

  return NextResponse.json({ success: true, sections: updated ?? [] });
}
