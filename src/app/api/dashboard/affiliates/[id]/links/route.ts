import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function generateSlug(length = 10): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const ALLOWED_PRODUCT_TYPES = new Set([
  "package",
  "session",
  "subscription",
  "diviner_profile",
  "diviner_service",
]);

// GET /api/dashboard/affiliates/[id]/links
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Ownership check
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  const { data: affiliate } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!affiliate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  const { data, error } = await admin
    .from("affiliate_referral_links")
    .select("id, affiliate_id, diviner_id, product_id, product_type, slug, url, clicks, conversions, is_active, created_at")
    .eq("affiliate_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

// POST /api/dashboard/affiliates/[id]/links
// Body: { product_id?, product_type? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { product_id, product_type } = (body ?? {}) as Record<string, unknown>;

  const admin = createAdminClient();

  // Ownership check
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  const { data: affiliate } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!affiliate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate not found" },
      { status: 404 }
    );
  }

  const normalizedProductType =
    typeof product_type === "string" && product_type.trim()
      ? product_type.trim()
      : null;

  if (normalizedProductType && !ALLOWED_PRODUCT_TYPES.has(normalizedProductType)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: "Unsupported referral destination type.",
      },
      { status: 422 }
    );
  }

  if (normalizedProductType === "diviner_service") {
    if (typeof product_id !== "string" || !product_id.trim()) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/422",
          title: "Validation error",
          detail: "product_id is required for diviner_service links.",
        },
        { status: 422 }
      );
    }

    const { data: service } = await admin
      .from("services")
      .select("id")
      .eq("id", product_id.trim())
      .eq("diviner_id", diviner.id)
      .maybeSingle();

    if (!service) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/404",
          title: "Service not found",
          detail: "The selected service does not belong to this diviner.",
        },
        { status: 404 }
      );
    }
  }

  // Generate unique slug — retry up to 5 times on collision
  let slug = generateSlug();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await admin
      .from("affiliate_referral_links")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = generateSlug();
    attempts++;
  }

  const insertPayload: Record<string, unknown> = {
    affiliate_id: id,
    diviner_id: diviner.id,
    slug,
    is_active: true,
  };
  if (normalizedProductType === "diviner_service" && typeof product_id === "string" && product_id.trim()) {
    insertPayload.product_id = product_id.trim();
  } else if (typeof product_id === "string" && product_id.trim()) {
    insertPayload.product_id = product_id.trim();
  }
  if (normalizedProductType) insertPayload.product_type = normalizedProductType;

  const { data, error } = await admin
    .from("affiliate_referral_links")
    .insert(insertPayload)
    .select("id, affiliate_id, diviner_id, product_id, product_type, slug, url, clicks, conversions, is_active, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
