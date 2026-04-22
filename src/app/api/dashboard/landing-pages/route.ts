/**
 * GET /api/dashboard/landing-pages
 *
 * List every service the diviner owns (regardless of is_enabled) with the
 * V2-simplified status model:
 *   - is_active   — admin owns  (services.is_active)
 *   - is_enabled  — admin owns  (diviner_services.is_enabled)
 *   - is_published — diviner owns (diviner_services.is_published)
 *
 * Rewritten in Task 05 of the 2026-04-21 landing-page-simplification.
 *
 * Response shape matches the contract in 05-dashboard-simplification.md and
 * intentionally drops: has_landing_page, landing_page_status,
 * custom_section_count, publish_status, moderation_status. Those concepts
 * no longer exist under V2.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, ...(detail ? { detail } : {}) },
    { status },
  );
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return problem(403, "Forbidden");

  const sp = req.nextUrl.searchParams;
  const statusFilter = (sp.get("status") ?? "").toLowerCase();
  const categoryFilter = sp.get("category") ?? "";
  const searchQuery = (sp.get("search") ?? "").toLowerCase();

  // 1. Every diviner_services row (enabled or not — admin-disabled services
  //    still need to appear on the dashboard with the "Deactivated by admin"
  //    copy).
  const { data: divinerServices } = await admin
    .from("diviner_services")
    .select(`
      id,
      template_id,
      is_enabled,
      is_published,
      updated_at,
      price,
      service_templates (
        id, name, slug, category, description, base_price, duration_minutes, icon_name, is_active
      )
    `)
    .eq("diviner_id", diviner.id);

  if (!divinerServices || divinerServices.length === 0) {
    return NextResponse.json({
      services: [],
      summary: { total: 0, live: 0, offline: 0, admin_disabled: 0 },
    });
  }

  const templateIds = divinerServices
    .map((ds) => ds.template_id)
    .filter(Boolean) as string[];

  // 2. Count enabled blocks per template, grouped by slot. Disabled blocks
  //    are excluded per the Task 05 contract.
  const blockCounts: Record<
    string,
    { about_diviner: number; extra: number; last_edited_at: string | null }
  > = {};

  if (templateIds.length > 0) {
    const { data: landingPages } = await admin
      .from("service_landing_pages")
      .select("id, service_template_id")
      .eq("diviner_id", diviner.id)
      .in("service_template_id", templateIds);

<<<<<<< HEAD
    const lpIdToTemplate: Record<string, string> = {};
    for (const lp of landingPages ?? []) {
      lpIdToTemplate[lp.id] = lp.service_template_id;
    }

    const lpIds = Object.keys(lpIdToTemplate);
    if (lpIds.length > 0) {
      const { data: blocks } = await admin
        .from("service_landing_page_sections")
        .select("landing_page_id, slot, is_enabled, updated_at")
        .in("landing_page_id", lpIds)
        .eq("is_enabled", true);
=======
  // 3. Get section counts per landing page — both legacy shape
  //    (total/custom) and V2 shape (block_count by slot). Single query.
  const lpIds = (landingPages ?? []).map((lp) => lp.id);
  const sectionCounts: Record<string, { total: number; custom: number }> = {};
  const slotCounts: Record<
    string,
    { about_diviner: number; extra: number }
  > = {};

  if (lpIds.length > 0) {
    const { data: sectionRows } = await admin
      .from("service_landing_page_sections")
      .select("landing_page_id, is_system, slot, is_enabled")
      .in("landing_page_id", lpIds);
>>>>>>> 3126914b0f0c2c89b3ff208536117927c230f3f0

      for (const b of blocks ?? []) {
        const templateId = lpIdToTemplate[b.landing_page_id];
        if (!templateId) continue;
        if (!blockCounts[templateId]) {
          blockCounts[templateId] = { about_diviner: 0, extra: 0, last_edited_at: null };
        }
        if (b.slot === "about_diviner") blockCounts[templateId].about_diviner++;
        else if (b.slot === "extra") blockCounts[templateId].extra++;
        if (
          b.updated_at &&
          (!blockCounts[templateId].last_edited_at ||
            b.updated_at > blockCounts[templateId].last_edited_at!)
        ) {
          blockCounts[templateId].last_edited_at = b.updated_at;
        }
      }
<<<<<<< HEAD
    }
  }

  // 3. Build V2 response rows.
  type ServiceRow = {
    template_id: string;
    template_name: string;
    template_slug: string;
    template_category: string;
    template_icon: string | null;
    price: number;
    duration_minutes: number;
    is_active: boolean;
    is_enabled: boolean;
    is_published: boolean;
    admin_disabled: boolean;
    block_count: { about_diviner: number; extra: number };
    last_edited_at: string | null;
    builder_url: string;
    public_url: string;
    analytics_url: string;
=======
      sectionCounts[s.landing_page_id].total++;
      if (!s.is_system) sectionCounts[s.landing_page_id].custom++;

      // V2 slot-based block counts (enabled only)
      if (!slotCounts[s.landing_page_id]) {
        slotCounts[s.landing_page_id] = { about_diviner: 0, extra: 0 };
      }
      if (
        s.is_enabled &&
        (s.slot === "about_diviner" || s.slot === "extra")
      ) {
        slotCounts[s.landing_page_id][s.slot as "about_diviner" | "extra"]++;
      }
    }
  }

  // 4. Build the response list
  let results = divinerServices.map((ds) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = ds.service_templates as any;
    if (!template) return null;

    const lp = lpByTemplate[ds.template_id!] ?? null;
    const counts = lp ? (sectionCounts[lp.id] ?? { total: 0, custom: 0 }) : { total: 0, custom: 0 };
    const slots = lp
      ? slotCounts[lp.id] ?? { about_diviner: 0, extra: 0 }
      : { about_diviner: 0, extra: 0 };

    // V2 admin-gate convenience flag. A service is "admin-disabled"
    // when either global service_templates.is_active is false OR the
    // diviner's is_enabled is false. Dashboard UI uses this to gray
    // out the Live/Offline toggle with a clear copy.
    const adminDisabled = !(template.is_active ?? true) || !ds.is_enabled;

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

      // ── V2 additions (2026-04-21 landing-page simplification) ───
      is_active: template.is_active ?? true,
      admin_disabled: adminDisabled,
      block_count: slots, // { about_diviner, extra }

      public_url: `/${diviner.username}/services/${template.slug}`,
      builder_url: `/dashboard/landing-pages/${ds.template_id}/builder`,
      analytics_url: `/dashboard/landing-pages/${ds.template_id}/analytics`,

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

  // V2 summary breakdown — "Live / Offline / Admin-disabled" per the
  // simplified dashboard (05-dashboard-simplification.md). Live means
  // diviner-side is_published AND admin flags are both true; Offline
  // means diviner toggle is off but admin flags are OK; Admin-disabled
  // collapses both admin flags to a single bucket regardless of the
  // diviner toggle.
  const liveCount = results.filter(
    (r) => r!.is_published === true && !r!.admin_disabled
  ).length;
  const adminDisabledCount = results.filter((r) => r!.admin_disabled).length;
  const offlineCount = results.length - liveCount - adminDisabledCount;

  const summary = {
    total_enabled: results.length,
    total_published: publishedCount,
    total_draft: results.length - publishedCount,
    total_views_30d: 0,
    total_bookings_30d: 0,
    // V2 additions
    total: results.length,
    live: liveCount,
    offline: offlineCount,
    admin_disabled: adminDisabledCount,
>>>>>>> 3126914b0f0c2c89b3ff208536117927c230f3f0
  };

  let rows: ServiceRow[] = divinerServices
    .map((ds): ServiceRow | null => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const template = ds.service_templates as any;
      if (!template || !ds.template_id) return null;

      const counts = blockCounts[ds.template_id] ?? {
        about_diviner: 0,
        extra: 0,
        last_edited_at: null,
      };

      const isActive = template.is_active === true;
      const isEnabled = ds.is_enabled === true;
      const isPublished = ds.is_published === true;
      const adminDisabled = !isActive || !isEnabled;

      return {
        template_id: ds.template_id,
        template_name: template.name as string,
        template_slug: template.slug as string,
        template_category: template.category as string,
        template_icon: (template.icon_name as string | null) ?? null,
        price: Number(ds.price ?? template.base_price ?? 0),
        duration_minutes: template.duration_minutes as number,
        is_active: isActive,
        is_enabled: isEnabled,
        is_published: isPublished,
        admin_disabled: adminDisabled,
        block_count: { about_diviner: counts.about_diviner, extra: counts.extra },
        last_edited_at: counts.last_edited_at ?? ds.updated_at ?? null,
        builder_url: `/dashboard/landing-pages/${ds.template_id}/builder`,
        public_url: `/${diviner.username}/services/${template.slug}`,
        analytics_url: `/dashboard/landing-pages/${ds.template_id}/analytics`,
      };
    })
    .filter((r): r is ServiceRow => r !== null);

  // 4. Filters — search, category, status (live | offline).
  if (searchQuery) {
    rows = rows.filter((r) => r.template_name.toLowerCase().includes(searchQuery));
  }
  if (categoryFilter) {
    rows = rows.filter((r) => r.template_category === categoryFilter);
  }
  if (statusFilter === "live") {
    rows = rows.filter((r) => r.is_published && !r.admin_disabled);
  } else if (statusFilter === "offline") {
    rows = rows.filter((r) => !r.is_published || r.admin_disabled);
  }

  // 5. Summary — live / offline / admin-disabled. Admin-disabled is counted
  //    separately and also appears inside "offline" in the contract copy, but
  //    we expose both so the UI can show the split.
  const summary = {
    total: rows.length,
    live: rows.filter((r) => r.is_published && !r.admin_disabled).length,
    offline: rows.filter((r) => !r.is_published || r.admin_disabled).length,
    admin_disabled: rows.filter((r) => r.admin_disabled).length,
  };

  return NextResponse.json({ services: rows, summary });
}
