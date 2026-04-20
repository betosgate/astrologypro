import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/service-audit";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/diviners/[id]/services
// Returns all active service templates with this diviner's assignment status.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { id: divinerId } = await params;

  // 1. Fetch diviner
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username, display_name, is_active")
    .eq("id", divinerId)
    .maybeSingle();

  if (!diviner) return NextResponse.json({ error: "Diviner not found" }, { status: 404 });

  // 2. Fetch all active templates
  const { data: templates, error: tmplErr } = await admin
    .from("service_templates")
    .select("id, name, slug, category, base_price, duration_minutes, is_primary, is_active")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });

  if (tmplErr) return NextResponse.json({ error: tmplErr.message }, { status: 500 });

  // 3. Fetch diviner_services for this diviner (all, not just enabled)
  const { data: divinerServices } = await admin
    .from("diviner_services")
    .select("*")
    .eq("diviner_id", divinerId);

  const dsMap = new Map<string, Record<string, unknown>>();
  for (const ds of divinerServices ?? []) {
    dsMap.set(ds.template_id, ds);
  }

  // 4. Fetch custom services rows (services table) for this diviner
  const { data: customServices } = await admin
    .from("services")
    .select("id, template_id, slug, is_active, base_price")
    .eq("diviner_id", divinerId);

  const csMap = new Map<string, Record<string, unknown>>();
  for (const cs of customServices ?? []) {
    if (cs.template_id) csMap.set(cs.template_id, cs);
  }

  // 5. Fetch performer names for enabled_by/disabled_by
  const userIds = new Set<string>();
  for (const ds of divinerServices ?? []) {
    if (ds.enabled_by) userIds.add(ds.enabled_by);
    if (ds.disabled_by) userIds.add(ds.disabled_by);
  }
  let performerNames: Record<string, string> = {};
  if (userIds.size > 0) {
    const { data: performers } = await admin.rpc("get_auth_users_by_ids", {
      user_ids: Array.from(userIds),
    });
    for (const p of performers ?? []) {
      performerNames[p.id] = p.email ?? p.id;
    }
  }

  // 6. Merge
  const services = (templates ?? []).map((t) => {
    const ds = dsMap.get(t.id);
    const cs = csMap.get(t.id);
    const username = diviner.username ?? "";

    return {
      template_id:       t.id,
      template_name:     t.name,
      template_slug:     t.slug,
      template_category: t.category,
      base_price:        t.base_price,
      duration_minutes:  t.duration_minutes,
      is_primary:        t.is_primary,
      // diviner_services data (null if not yet assigned)
      diviner_service_id: ds ? (ds.id as string) : null,
      is_enabled:         ds ? (ds.is_enabled as boolean) : false,
      is_published:       ds ? (ds.is_published as boolean) : false,
      publish_status:     ds ? (ds.publish_status as string) : "draft",
      price:              ds ? (ds.price as number) : t.base_price,
      notes:              ds ? (ds.notes as string | null) : null,
      enabled_at:         ds ? (ds.enabled_at as string | null) : null,
      disabled_at:        ds ? (ds.disabled_at as string | null) : null,
      enabled_by:         ds ? (ds.enabled_by as string | null) : null,
      disabled_by:        ds ? (ds.disabled_by as string | null) : null,
      enabled_by_name:    ds?.enabled_by ? (performerNames[ds.enabled_by as string] ?? null) : null,
      disabled_by_name:   ds?.disabled_by ? (performerNames[ds.disabled_by as string] ?? null) : null,
      // custom services row
      has_custom_service: !!cs,
      custom_service_id:  cs ? (cs.id as string) : null,
      landing_page_url:   username && cs
        ? `/${username}/services/${t.slug}`
        : null,
    };
  });

  return NextResponse.json({ diviner, services });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/diviners/[id]/services
// Assigns (enables) a service template for this diviner.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const templateId = typeof body.template_id === "string" ? body.template_id : null;
  if (!templateId) {
    return NextResponse.json({ error: "template_id is required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { id: divinerId } = await params;

  // Validate diviner
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, user_id, username")
    .eq("id", divinerId)
    .maybeSingle();
  if (!diviner) return NextResponse.json({ error: "Diviner not found" }, { status: 404 });

  // Validate template
  const { data: template } = await admin
    .from("service_templates")
    .select("id, name, slug, category, base_price, is_active")
    .eq("id", templateId)
    .maybeSingle();
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  if (!template.is_active) {
    return NextResponse.json({ error: "Cannot assign an inactive template" }, { status: 422 });
  }

  // Duplicate check
  const { data: existing } = await admin
    .from("diviner_services")
    .select("id, is_enabled")
    .eq("diviner_id", divinerId)
    .eq("template_id", templateId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Service already assigned to this diviner", diviner_service_id: existing.id },
      { status: 409 }
    );
  }

  const price = body.price != null ? Number(body.price) : (template.base_price ?? 0);
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const now = new Date().toISOString();

  // Create diviner_services row
  const { data: ds, error: dsErr } = await admin
    .from("diviner_services")
    .insert({
      diviner_id:     divinerId,
      template_id:    templateId,
      price,
      is_enabled:     true,
      is_published:   false,
      publish_status: "draft",
      enabled_at:     now,
      enabled_by:     user.id,
      notes,
    })
    .select()
    .single();

  if (dsErr) return NextResponse.json({ error: dsErr.message }, { status: 500 });

  // Create services row if not already there
  const { data: existingService } = await admin
    .from("services")
    .select("id")
    .eq("diviner_id", divinerId)
    .eq("template_id", templateId)
    .maybeSingle();

  if (!existingService) {
    await admin.from("services").insert({
      diviner_id:       divinerId,
      template_id:      templateId,
      name:             template.name,
      slug:             template.slug,
      category:         template.category,
      base_price:       price,
      duration_minutes: 0, // will be populated from template by trigger/join
      is_active:        true,
    });
  }

  // Audit log
  await writeAuditLog(admin, {
    diviner_id:          divinerId,
    service_template_id: templateId,
    diviner_service_id:  ds.id,
    action:              "service_enabled",
    performed_by:        user.id,
    performed_by_role:   "admin",
    new_value:           { is_enabled: true, is_published: false, price, notes },
    reason:              notes,
  });

  return NextResponse.json({ diviner_service: ds }, { status: 201 });
}
