import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRoleServicePackages,
  resolveRoleServicePackage,
} from "@/lib/role-service-packages";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/services
 * List the authenticated diviner's own services with pagination.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Authentication required" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, service_package_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Diviner profile not found" },
      { status: 403 },
    );
  }

  const roleServicePackages = await getRoleServicePackages();
  const resolvedPackage = resolveRoleServicePackage(
    roleServicePackages,
    diviner.service_package_code,
  );

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const category = sp.get("category") || null;
  const activeOnly = sp.get("active") === "true";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("services")
    .select(
      "id, name, slug, category, description, duration_minutes, base_price, is_active, is_featured, is_primary, requires_birth_data, sort_order, intake_template_id, created_at",
      { count: "exact" },
    )
    .eq("diviner_id", diviner.id);

  if (category) {
    if (!resolvedPackage.allowedCategories.includes(category as "astrology" | "tarot")) {
      return NextResponse.json({
        services: [],
        total: 0,
        page,
        pages: 0,
        servicePackage: resolvedPackage,
      });
    }
    query = query.eq("category", category);
  } else {
    query = query.in("category", resolvedPackage.allowedCategories);
  }
  if (activeOnly) query = query.eq("is_active", true);

  const { data, count, error } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Query failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    services: data ?? [],
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
    servicePackage: resolvedPackage,
  });
}

/**
 * POST /api/dashboard/services
 * Create a new service for the authenticated diviner.
 * Diviners may add services from the predefined template catalog.
 */
export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Authentication required" },
      { status: 401 },
    );
  }

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Diviner profile not found" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await _req.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Invalid JSON", status: 422, detail: "Request body must be valid JSON" },
      { status: 422 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const duration_minutes = typeof body.duration_minutes === "number" ? body.duration_minutes : 0;
  const base_price = typeof body.base_price === "number" ? body.base_price : 0;
  const is_active = body.is_active !== false;

  // Validate required fields
  const errors: string[] = [];
  if (!name || name.length > 100) errors.push("name is required (max 100 chars)");
  if (!["astrology", "tarot", "phone", "freelance"].includes(category)) {
    errors.push("category must be one of: astrology, tarot, phone, freelance");
  }
  if (duration_minutes < 1 || duration_minutes > 480) errors.push("duration_minutes must be 1–480");
  if (base_price < 0) errors.push("base_price must be non-negative");

  if (errors.length > 0) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: errors.join("; ") },
      { status: 422 },
    );
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);

  const { data: service, error } = await admin
    .from("services")
    .insert({
      diviner_id: diviner.id,
      name,
      slug,
      category,
      description: description || null,
      duration_minutes,
      base_price,
      is_active,
      requires_birth_data: body.requires_birth_data !== false,
    })
    .select("id, name, slug, category, description, duration_minutes, base_price, is_active, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Insert failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ service }, { status: 201 });
}
