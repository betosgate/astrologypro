import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServiceTemplateFormConfig } from "@/lib/service-template-form";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/service-templates
// Returns all service templates with diviner usage counts.
// Query params: ?search=&category=&is_active=&scope=&sort_by=&sort_dir=
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const isActive = searchParams.get("is_active") ?? "";
  const scope = searchParams.get("scope") ?? "";
  const sortBy = searchParams.get("sort_by") ?? "display_order";
  const sortDir = searchParams.get("sort_dir") === "desc" ? false : true;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10));

  const allowedSortCols = ["display_order", "name", "category", "base_price", "duration_minutes", "created_at"];
  const safeSort = allowedSortCols.includes(sortBy) ? sortBy : "display_order";

  const admin = createAdminClient();

  let query = admin
    .from("service_templates")
    .select(`
      id, name, slug, category, description, long_description,
      image_url,
      base_price, duration_minutes, is_primary, requires_birth_data,
      trigger_event, sort_order, display_order, is_active,
      icon_name, color, whats_included, who_its_for, faq,
      seo_title, seo_description, created_by, updated_at, updated_by
    `, { count: "exact" })
    .order(safeSort, { ascending: sortDir });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (category === "astrology" || category === "tarot") {
    query = query.eq("category", category);
  }
  if (isActive === "true") {
    query = query.eq("is_active", true);
  } else if (isActive === "false") {
    query = query.eq("is_active", false);
  }
  if (scope === "general") {
    query = query.ilike("slug", "general-%");
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: templates, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch diviner usage counts for the returned templates only
  const templateIds = (templates ?? []).map(t => t.id);
  let result = (templates ?? []).map(t => ({ ...t, diviner_count: 0 }));

  if (templateIds.length > 0) {
    const { data: usageCounts } = await admin
      .from("diviner_services")
      .select("template_id")
      .eq("is_enabled", true)
      .in("template_id", templateIds);

    const countMap = new Map<string, number>();
    for (const row of usageCounts ?? []) {
      countMap.set(row.template_id, (countMap.get(row.template_id) ?? 0) + 1);
    }

    result = (templates ?? []).map((t) => ({
      ...t,
      diviner_count: countMap.get(t.id) ?? 0,
    }));
  }

  return NextResponse.json({
    templates: result,
    total: count ?? 0,
    page,
    limit
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/service-templates
// Creates a new service template.
// ─────────────────────────────────────────────────────────────────────────────

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  const errors: Record<string, string> = {};

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) errors.name = "Name is required";
  else if (name.length > 100) errors.name = "Name must be 100 characters or fewer";

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) errors.slug = "Slug is required";
  else if (!SLUG_RE.test(slug)) errors.slug = "Slug must be lowercase kebab-case (e.g. my-service)";

  const category = body.category;
  if (category !== "astrology" && category !== "tarot") {
    errors.category = "Category must be 'astrology' or 'tarot'";
  }

  const durationMinutes = Number(body.duration_minutes);
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    errors.duration_minutes = "Duration must be a positive integer";
  }

  const basePrice = Number(body.base_price);
  if (isNaN(basePrice) || basePrice <= 0) {
    errors.base_price = "Base price must be a positive number";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 422 });
  }

  const admin = createAdminClient();
  const normalizedFormConfig = resolveServiceTemplateFormConfig({
    category: typeof category === "string" ? category : null,
    slug,
    form_config: body.form_config,
  });

  // ── Slug uniqueness check ────────────────────────────────────────────────────
  const { data: existing } = await admin
    .from("service_templates")
    .select("id, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    if (!existing.is_active) {
      // Reactivate the existing deactivated template instead of creating a duplicate
      const { data: reactivated, error: reactivateErr } = await admin
        .from("service_templates")
        .update({
          ...buildUpdatePayload(body, user.id),
          form_config: normalizedFormConfig,
          is_active: true,
          updated_by: user.id,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (reactivateErr) {
        return NextResponse.json({ error: reactivateErr.message }, { status: 500 });
      }
      return NextResponse.json({ template: reactivated, reactivated: true }, { status: 200 });
    }
    return NextResponse.json(
      { error: "Slug already exists", details: { slug: "A template with this slug already exists" } },
      { status: 409 }
    );
  }

  // ── Insert ───────────────────────────────────────────────────────────────────
  const insertPayload = {
    name,
    slug,
    category,
    description: typeof body.description === "string" ? body.description.trim() : null,
    long_description: typeof body.long_description === "string" ? body.long_description.trim() : null,
    image_url: typeof body.image_url === "string" ? body.image_url.trim() || null : null,
    base_price: basePrice,
    overage_rate: body.overage_rate != null ? Number(body.overage_rate) : null,
    duration_minutes: durationMinutes,
    is_primary: body.is_primary === true,
    requires_birth_data: body.requires_birth_data === true,
    trigger_event: typeof body.trigger_event === "string" && body.trigger_event ? body.trigger_event : null,
    display_order: body.display_order != null ? Number(body.display_order) : 0,
    sort_order: body.display_order != null ? Number(body.display_order) : 0,
    icon_name: typeof body.icon_name === "string" ? body.icon_name : null,
    color: typeof body.color === "string" ? body.color : null,
    whats_included: Array.isArray(body.whats_included) ? body.whats_included : [],
    who_its_for: Array.isArray(body.who_its_for) ? body.who_its_for : [],
    faq: Array.isArray(body.faq) ? body.faq : [],
    seo_title: typeof body.seo_title === "string" ? body.seo_title.slice(0, 70) : null,
    seo_description: typeof body.seo_description === "string" ? body.seo_description.slice(0, 160) : null,
    form_enabled: body.form_enabled !== false,
    form_config: normalizedFormConfig,
    is_active: true,
    created_by: user.id,
    updated_by: user.id,
  };

  const { data: created, error: insertErr } = await admin
    .from("service_templates")
    .insert(insertPayload)
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ template: created }, { status: 201 });
}

// ── Helper ────────────────────────────────────────────────────────────────────

function buildUpdatePayload(body: Record<string, unknown>, userId: string) {
  const payload: Record<string, unknown> = { updated_by: userId };

  if (typeof body.name === "string") payload.name = body.name.trim();
  if (typeof body.description === "string") payload.description = body.description.trim();
  if (typeof body.long_description === "string") payload.long_description = body.long_description.trim();
  if (typeof body.image_url === "string") payload.image_url = body.image_url.trim() || null;
  if (body.base_price != null) payload.base_price = Number(body.base_price);
  if (body.overage_rate != null) payload.overage_rate = Number(body.overage_rate);
  if (body.duration_minutes != null) payload.duration_minutes = Number(body.duration_minutes);
  if (body.is_primary != null) payload.is_primary = body.is_primary === true;
  if (body.requires_birth_data != null) payload.requires_birth_data = body.requires_birth_data === true;
  if (body.trigger_event != null) payload.trigger_event = body.trigger_event || null;
  if (body.display_order != null) { payload.display_order = Number(body.display_order); payload.sort_order = Number(body.display_order); }
  if (typeof body.icon_name === "string") payload.icon_name = body.icon_name || null;
  if (typeof body.color === "string") payload.color = body.color || null;
  if (Array.isArray(body.whats_included)) payload.whats_included = body.whats_included;
  if (Array.isArray(body.who_its_for)) payload.who_its_for = body.who_its_for;
  if (Array.isArray(body.faq)) payload.faq = body.faq;
  if (typeof body.seo_title === "string") payload.seo_title = body.seo_title.slice(0, 70) || null;
  if (typeof body.seo_description === "string") payload.seo_description = body.seo_description.slice(0, 160) || null;
  if (body.form_enabled != null) payload.form_enabled = body.form_enabled === true;
  if (body.is_active != null) payload.is_active = body.is_active === true;

  return payload;
}
