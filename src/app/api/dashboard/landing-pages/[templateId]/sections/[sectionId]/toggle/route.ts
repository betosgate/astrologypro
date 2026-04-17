/**
 * PATCH /api/dashboard/landing-pages/[templateId]/sections/[sectionId]/toggle
 * Toggle a section's is_enabled flag.
 * System sections (hero, pricing, booking_cta) cannot be disabled.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SECTION_TYPES } from "@/lib/landing-page-section-types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string; sectionId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { sectionId } = await params;

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

  let body: { is_enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 422, title: "Invalid JSON" }, { status: 422 });
  }

  if (typeof body.is_enabled !== "boolean") {
    return NextResponse.json({ status: 422, title: "is_enabled (boolean) required" }, { status: 422 });
  }

  // Fetch section
  const { data: section } = await admin
    .from("service_landing_page_sections")
    .select("id, section_type, is_system")
    .eq("id", sectionId)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!section) {
    return NextResponse.json({ status: 404, title: "Section not found" }, { status: 404 });
  }

  // Guard: non-removable system sections cannot be disabled
  const typeDef = SECTION_TYPES[section.section_type];
  if (!body.is_enabled && section.is_system && typeDef && !typeDef.is_removable) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Cannot disable system section", status: 422, detail: `The "${section.section_type}" section is required and cannot be disabled` },
      { status: 422 },
    );
  }

  const { data: updated, error } = await admin
    .from("service_landing_page_sections")
    .update({ is_enabled: body.is_enabled, is_draft: true, updated_by: user.id })
    .eq("id", sectionId)
    .eq("diviner_id", diviner.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ status: 500, title: "Update failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ section: updated });
}
