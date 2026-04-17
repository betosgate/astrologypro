/**
 * POST /api/dashboard/landing-pages/[templateId]/publish
 * Publish the landing page: copies draft content to published, sets status = 'published'.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishLandingPage } from "@/lib/landing-page-builder";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
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
    return NextResponse.json({ status: 403, title: "Service not enabled" }, { status: 403 });
  }

  // Fetch landing page
  const { data: page } = await admin
    .from("service_landing_pages")
    .select("id, moderation_status, status")
    .eq("diviner_id", diviner.id)
    .eq("service_template_id", templateId)
    .maybeSingle();

  if (!page) {
    return NextResponse.json({ status: 404, title: "Landing page not found — open the builder first to initialize it" }, { status: 404 });
  }

  // Guard: cannot publish if moderation blocked
  if (page.moderation_status === "flagged" || page.moderation_status === "rejected") {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Publish blocked", status: 422, detail: "This page has been flagged by moderation. Resolve the issue before publishing." },
      { status: 422 },
    );
  }

  // Guard: no flagged sections
  const { data: flaggedSections } = await admin
    .from("service_landing_page_sections")
    .select("id")
    .eq("landing_page_id", page.id)
    .in("moderation_status", ["flagged", "rejected"])
    .eq("is_enabled", true);

  if (flaggedSections && flaggedSections.length > 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Publish blocked", status: 422, detail: `${flaggedSections.length} section(s) flagged by moderation. Resolve before publishing.` },
      { status: 422 },
    );
  }

  try {
    await publishLandingPage(admin, page.id, templateId, diviner.id, user.id);
  } catch (err) {
    return NextResponse.json(
      { status: 500, title: "Publish failed", detail: String(err) },
      { status: 500 },
    );
  }

  // Fetch updated page
  const { data: updated } = await admin
    .from("service_landing_pages")
    .select("published_version, published_at, status")
    .eq("id", page.id)
    .single();

  return NextResponse.json({
    success: true,
    published_version: updated?.published_version,
    published_at: updated?.published_at,
    status: updated?.status,
  });
}
