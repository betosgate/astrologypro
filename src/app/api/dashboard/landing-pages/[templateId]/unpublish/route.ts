/**
 * POST /api/dashboard/landing-pages/[templateId]/unpublish
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unpublishLandingPage } from "@/lib/landing-page-builder";

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

  const { data: page } = await admin
    .from("service_landing_pages")
    .select("id")
    .eq("diviner_id", diviner.id)
    .eq("service_template_id", templateId)
    .maybeSingle();

  if (!page) {
    return NextResponse.json({ status: 404, title: "Landing page not found" }, { status: 404 });
  }

  await unpublishLandingPage(admin, page.id, templateId, diviner.id, user.id);

  return NextResponse.json({ success: true });
}
