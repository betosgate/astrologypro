import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Helper: resolve diviner from auth user */
async function resolveDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, diviner: null };

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, diviner };
}

/**
 * GET /api/dashboard/services/[id]
 * Return a single service detail owned by the authenticated diviner.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { user, diviner } = await resolveDiviner();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Authentication required" },
      { status: 401 },
    );
  }
  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Diviner profile not found" },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { data: service, error } = await admin
    .from("services")
    .select(
      "id, name, slug, category, description, duration_minutes, base_price, overage_rate, is_active, is_featured, is_primary, requires_birth_data, trigger_event, sort_order, intake_template_id, created_at",
    )
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Query failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }
  if (!service) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not found", status: 404, detail: "Service not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ service });
}

/**
 * PUT /api/dashboard/services/[id]
 * Update a service owned by the authenticated diviner.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { user, diviner } = await resolveDiviner();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Authentication required" },
      { status: 401 },
    );
  }
  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Diviner profile not found" },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  // Verify ownership and fetch template_id for access check
  const { data: existing } = await admin
    .from("services")
    .select("id, template_id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not found", status: 404, detail: "Service not found" },
      { status: 404 },
    );
  }

  // Task 05: if service is template-based, require is_enabled before diviner can edit
  if (existing.template_id) {
    const { data: dsAccess } = await admin
      .from("diviner_services")
      .select("is_enabled")
      .eq("diviner_id", diviner.id)
      .eq("template_id", existing.template_id)
      .maybeSingle();
    if (!dsAccess || !dsAccess.is_enabled) {
      return NextResponse.json(
        { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "This service template is not enabled for your account" },
        { status: 403 },
      );
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Invalid JSON", status: 422, detail: "Request body must be valid JSON" },
      { status: 422 },
    );
  }

  // Build update payload from allowed fields
  const allowedFields = [
    "name", "category", "description", "duration_minutes", "base_price",
    "overage_rate", "is_active", "is_featured", "is_primary", "requires_birth_data",
    "trigger_event", "sort_order",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "No fields", status: 422, detail: "No valid fields to update" },
      { status: 422 },
    );
  }

  // Validate specific fields
  const errors: string[] = [];
  if ("name" in updates) {
    const name = typeof updates.name === "string" ? updates.name.trim() : "";
    if (!name || name.length > 100) errors.push("name is required (max 100 chars)");
    updates.name = name;
    // Regenerate slug
    updates.slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 100);
  }
  if ("category" in updates && !["astrology", "tarot", "phone", "freelance"].includes(updates.category as string)) {
    errors.push("category must be one of: astrology, tarot, phone, freelance");
  }
  if ("duration_minutes" in updates) {
    const d = updates.duration_minutes as number;
    if (typeof d !== "number" || d < 1 || d > 480) errors.push("duration_minutes must be 1–480");
  }
  if ("base_price" in updates) {
    const p = updates.base_price as number;
    if (typeof p !== "number" || p < 0) errors.push("base_price must be non-negative");
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: errors.join("; ") },
      { status: 422 },
    );
  }

  const { data: service, error } = await admin
    .from("services")
    .update(updates)
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .select(
      "id, name, slug, category, description, duration_minutes, base_price, is_active, is_featured, is_primary, requires_birth_data, sort_order, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Update failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ service });
}

/**
 * DELETE /api/dashboard/services/[id]
 * Soft-delete (deactivate) a service owned by the authenticated diviner.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { user, diviner } = await resolveDiviner();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Authentication required" },
      { status: 401 },
    );
  }
  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Diviner profile not found" },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: existing } = await admin
    .from("services")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not found", status: 404, detail: "Service not found" },
      { status: 404 },
    );
  }

  // Soft-delete: set is_active = false
  const { error } = await admin
    .from("services")
    .update({ is_active: false })
    .eq("id", id)
    .eq("diviner_id", diviner.id);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Deactivation failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, detail: "Service deactivated" });
}
