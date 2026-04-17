/**
 * POST /api/admin/landing-pages/[landingPageId]/publish
 * POST /api/admin/landing-pages/[landingPageId]/unpublish
 * Admin publishes/unpublishes on behalf of diviner.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishLandingPage, unpublishLandingPage } from "@/lib/landing-page-builder";

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

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { landingPageId } = await params;
  const { user, isAdmin } = await resolveAdmin();
  if (!user) return NextResponse.json({ status: 401 }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ status: 403 }, { status: 403 });

  const admin = createAdminClient();
  const { data: page } = await admin
    .from("service_landing_pages")
    .select("id, diviner_id, service_template_id")
    .eq("id", landingPageId)
    .maybeSingle();

  if (!page) return NextResponse.json({ status: 404, title: "Landing page not found" }, { status: 404 });

  // Check if this is unpublish (action param)
  const url = new URL(req.url);
  const action = url.pathname.includes("/unpublish") ? "unpublish" : "publish";

  try {
    if (action === "publish") {
      await publishLandingPage(admin, page.id, page.service_template_id, page.diviner_id, user.id);
      return NextResponse.json({ success: true, action: "published" });
    } else {
      await unpublishLandingPage(admin, page.id, page.service_template_id, page.diviner_id, user.id);
      return NextResponse.json({ success: true, action: "unpublished" });
    }
  } catch (err) {
    return NextResponse.json({ status: 500, title: "Operation failed", detail: String(err) }, { status: 500 });
  }
}
