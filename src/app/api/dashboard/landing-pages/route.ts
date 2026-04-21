/**
 * GET /api/dashboard/landing-pages
 * List all enabled services for this diviner with their landing page status + 30d stats.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: 401, title: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const statusFilter = sp.get("status") ?? "";
  const categoryFilter = sp.get("category") ?? "";
  const searchQuery = sp.get("search") ?? "";

  // 1. Get all enabled diviner_services with template data
  const { data: divinerServices } = await admin
    .from("diviner_services")
    .select(`
      id,
      template_id,
      is_enabled,
      is_published,
      publish_status,
      updated_at,
      service_templates (
        id, name, slug, category, description, base_price, duration_minutes, icon_name, is_active
      )
    `)
    .eq("diviner_id", diviner.id)
    .eq("is_enabled", true);

  if (!divinerServices || divinerServices.length === 0) {
    return NextResponse.json({
      landing_pages: [],
      summary: { total_enabled: 0, total_published: 0, total_draft: 0, total_views_30d: 0, total_bookings_30d: 0 },
    });
  }

  const templateIds = divinerServices
    .map((ds) => ds.template_id)
    .filter(Boolean) as string[];

  // 2. Get landing pages for all those templates
  const { data: landingPages } = await admin
    .from("service_landing_pages")
    .select("id, service_template_id, status, moderation_status, published_at, updated_at, draft_version, published_version, custom_page_title, accent_color")
    .eq("diviner_id", diviner.id)
    .in("service_template_id", templateIds);

  const lpByTemplate: Record<string, typeof landingPages extends (infer T)[] | null ? T : never> = {};
  for (const lp of landingPages ?? []) {
    lpByTemplate[lp.service_template_id] = lp;
  }

  // 3. Get section counts per landing page
  const lpIds = (landingPages ?? []).map((lp) => lp.id);
  const sectionCounts: Record<string, { total: number; custom: number }> = {};

  if (lpIds.length > 0) {
    const { data: sectionRows } = await admin
      .from("service_landing_page_sections")
      .select("landing_page_id, is_system")
      .in("landing_page_id", lpIds);

    for (const s of sectionRows ?? []) {
      if (!sectionCounts[s.landing_page_id]) {
        sectionCounts[s.landing_page_id] = { total: 0, custom: 0 };
      }
      sectionCounts[s.landing_page_id].total++;
      if (!s.is_system) sectionCounts[s.landing_page_id].custom++;
    }
  }

  // 4. Build the response list
  let results = divinerServices.map((ds) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = ds.service_templates as any;
    if (!template) return null;

    const lp = lpByTemplate[ds.template_id!] ?? null;
    const counts = lp ? (sectionCounts[lp.id] ?? { total: 0, custom: 0 }) : { total: 0, custom: 0 };

    return {
      diviner_service_id: ds.id,
      template_id: ds.template_id,
      template_name: template.name as string,
      template_slug: template.slug as string,
      template_category: template.category as string,
      template_icon: template.icon_name as string | null,

      has_landing_page: !!lp,
      landing_page_id: lp?.id ?? null,
      landing_page_status: lp?.status ?? null,
      section_count: counts.total,
      custom_section_count: counts.custom,
      published_at: lp?.published_at ?? null,
      moderation_status: lp?.moderation_status ?? null,

      is_enabled: ds.is_enabled,
      is_published: ds.is_published,
      publish_status: ds.publish_status,

      public_url: `/${diviner.username}/services/${template.slug}`,
      builder_url: `/dashboard/landing-pages/${ds.template_id}/builder`,

      price: template.base_price as number,
      duration_minutes: template.duration_minutes as number,

      // Stats will be added via a separate query if analytics table exists
      stats: {
        views: 0,
        unique_visitors: 0,
        bookings_completed: 0,
        conversion_rate: 0,
      },

      updated_at: lp?.updated_at ?? ds.updated_at,
    };
  }).filter(Boolean);

  // 5. Apply filters
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    results = results.filter((r) => r!.template_name.toLowerCase().includes(q));
  }
  if (categoryFilter) {
    results = results.filter((r) => r!.template_category === categoryFilter);
  }
  if (statusFilter === "published") {
    // Published = custom landing page row is published, OR no custom row and the
    // template-backed page is published via diviner_services.is_published.
    results = results.filter(
      (r) =>
        r!.landing_page_status === "published" ||
        (!r!.has_landing_page && r!.is_published === true)
    );
  } else if (statusFilter === "draft") {
    // Draft = everything enabled that is not currently published by either rule above.
    results = results.filter(
      (r) =>
        !(
          r!.landing_page_status === "published" ||
          (!r!.has_landing_page && r!.is_published === true)
        )
    );
  }

  // 6. Summary
  //
  // A service is "published" if EITHER:
  //   - its custom service_landing_pages row is status === 'published', OR
  //   - it has no custom landing page row but diviner_services.is_published is true
  //     (in this case the template-backed landing page is live).
  //
  // Everything else that is enabled but not published counts as a draft.
  const isServicePublished = (r: NonNullable<(typeof results)[number]>) =>
    r.landing_page_status === "published" || (!r.has_landing_page && r.is_published === true);

  const publishedCount = results.filter((r) => isServicePublished(r!)).length;

  const summary = {
    total_enabled: results.length,
    total_published: publishedCount,
    total_draft: results.length - publishedCount,
    total_views_30d: 0,
    total_bookings_30d: 0,
  };

  return NextResponse.json({ landing_pages: results, summary });
}
