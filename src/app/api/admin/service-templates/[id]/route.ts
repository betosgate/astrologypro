import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/service-templates/[id]
// Returns full template detail with diviner count and diviner list.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: template, error } = await admin
    .from("service_templates")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch diviners using this template
  const { data: divinerServices } = await admin
    .from("diviner_services")
    .select(`
      is_enabled, is_published,
      diviners ( id, display_name )
    `)
    .eq("template_id", params.id);

  const diviners = (divinerServices ?? []).map((ds) => ({
    ...(ds.diviners as { id: string; display_name: string }),
    is_enabled:   ds.is_enabled,
    is_published: ds.is_published,
  }));

  return NextResponse.json({
    template: {
      ...template,
      diviner_count: diviners.filter((d) => d.is_enabled).length,
      diviners,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/service-templates/[id]
// Partial update. Validates fields that are present in the body.
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch existing record first
  const { data: existing, error: fetchErr } = await admin
    .from("service_templates")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Validation ───────────────────────────────────────────────────────────────
  const errors: Record<string, string> = {};

  if ("name" in body) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) errors.name = "Name is required";
    else if (name.length > 100) errors.name = "Name must be 100 characters or fewer";
  }

  let slugChanged = false;
  if ("slug" in body) {
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!slug) errors.slug = "Slug is required";
    else if (!SLUG_RE.test(slug)) errors.slug = "Slug must be lowercase kebab-case";
    else if (slug !== existing.slug) {
      // Check uniqueness
      const { data: slugConflict } = await admin
        .from("service_templates")
        .select("id")
        .eq("slug", slug)
        .neq("id", params.id)
        .maybeSingle();
      if (slugConflict) errors.slug = "A template with this slug already exists";
      else slugChanged = true;
    }
  }

  if ("category" in body && body.category !== "astrology" && body.category !== "tarot") {
    errors.category = "Category must be 'astrology' or 'tarot'";
  }

  if ("duration_minutes" in body) {
    const d = Number(body.duration_minutes);
    if (!Number.isInteger(d) || d <= 0) errors.duration_minutes = "Duration must be a positive integer";
  }

  if ("base_price" in body) {
    const p = Number(body.base_price);
    if (isNaN(p) || p <= 0) errors.base_price = "Base price must be a positive number";
  }

  if ("seo_title" in body && typeof body.seo_title === "string" && body.seo_title.length > 70) {
    errors.seo_title = "SEO title must be 70 characters or fewer";
  }

  if ("seo_description" in body && typeof body.seo_description === "string" && body.seo_description.length > 160) {
    errors.seo_description = "SEO description must be 160 characters or fewer";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 422 });
  }

  // ── Build update payload ─────────────────────────────────────────────────────
  const payload: Record<string, unknown> = { updated_by: user.id };

  const strField = (key: string, maxLen?: number) => {
    if (key in body && typeof body[key] === "string") {
      payload[key] = maxLen ? (body[key] as string).slice(0, maxLen) || null : (body[key] as string).trim() || null;
    }
  };

  if ("name" in body) payload.name = (body.name as string).trim();
  strField("slug");
  strField("category");
  strField("description");
  strField("long_description");
  strField("trigger_event");
  strField("icon_name");
  strField("color");
  strField("seo_title", 70);
  strField("seo_description", 160);

  if ("base_price" in body) payload.base_price = Number(body.base_price);
  if ("overage_rate" in body) payload.overage_rate = body.overage_rate != null ? Number(body.overage_rate) : null;
  if ("duration_minutes" in body) payload.duration_minutes = Number(body.duration_minutes);
  if ("is_primary" in body) payload.is_primary = body.is_primary === true;
  if ("requires_birth_data" in body) payload.requires_birth_data = body.requires_birth_data === true;
  if ("is_active" in body) payload.is_active = body.is_active === true;
  if ("display_order" in body) {
    payload.display_order = Number(body.display_order);
    payload.sort_order = Number(body.display_order);
  }
  if ("whats_included" in body && Array.isArray(body.whats_included)) payload.whats_included = body.whats_included;
  if ("who_its_for" in body && Array.isArray(body.who_its_for)) payload.who_its_for = body.who_its_for;
  if ("faq" in body && Array.isArray(body.faq)) payload.faq = body.faq;

  const { data: updated, error: updateErr } = await admin
    .from("service_templates")
    .update(payload)
    .eq("id", params.id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    template: updated,
    slug_changed: slugChanged,
    ...(slugChanged
      ? { warning: "Slug was changed. Any existing booking links using the old slug may break." }
      : {}),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/service-templates/[id]
// Soft-deletes (deactivates) the template.
// Blocks if any diviner has it enabled.
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Check for active diviner_services rows
  const { data: activeServices } = await admin
    .from("diviner_services")
    .select(`
      id,
      diviners ( id, display_name )
    `)
    .eq("template_id", params.id)
    .eq("is_enabled", true);

  if (activeServices && activeServices.length > 0) {
    const affectedDiviners = activeServices.map((s) => s.diviners);
    return NextResponse.json(
      {
        error: "Cannot deactivate template with active diviners",
        affected_diviners: affectedDiviners,
        count: activeServices.length,
      },
      { status: 409 }
    );
  }

  // Soft delete — set is_active = false
  const { error: deactivateErr } = await admin
    .from("service_templates")
    .update({ is_active: false, updated_by: user.id })
    .eq("id", params.id);

  if (deactivateErr) return NextResponse.json({ error: deactivateErr.message }, { status: 500 });

  return NextResponse.json({ success: true, deactivated: true });
}
