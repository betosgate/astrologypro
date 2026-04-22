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
