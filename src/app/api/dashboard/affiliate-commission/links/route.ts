import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_PRODUCT_TYPES = new Set([
  "package",
  "session",
  "subscription",
  "diviner_profile",
  "diviner_service",
]);

// GET /api/dashboard/affiliate-commission/links
// Returns all referral links across all affiliates belonging to the authenticated diviner.
// Query params: affiliate_id?, is_active?, limit?, cursor?
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const affiliateId = searchParams.get("affiliate_id");
  const isActiveParam = searchParams.get("is_active");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  // Resolve diviner record
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

  let query = admin
    .from("affiliate_referral_links")
    .select(
      "id, affiliate_id, diviner_id, product_id, product_type, slug, url, clicks, conversions, is_active, created_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (affiliateId) query = query.eq("affiliate_id", affiliateId);
  if (isActiveParam !== null) query = query.eq("is_active", isActiveParam === "true");
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  const hasMore = (data ?? []).length > limit;
  const items = hasMore ? (data ?? []).slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}

// POST /api/dashboard/affiliate-commission/links
// Generate a new referral link for one of the diviner's affiliates.
// Body: { affiliate_id, product_id?, product_type?, campaign? }
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body", status: 422 },
      { status: 422 }
    );
  }

  const { affiliate_id, product_id, product_type } = body as Record<string, unknown>;

  if (typeof affiliate_id !== "string" || affiliate_id.trim() === "") {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        status: 422,
        detail: "affiliate_id is required.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Resolve the diviner and verify the affiliate belongs to them
  const { data: diviner, error: divinerError } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (divinerError || !diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner", status: 403 },
      { status: 403 }
    );
  }

  const { data: affiliate, error: affError } = await admin
    .from("diviner_affiliates")
    .select("id, diviner_id")
    .eq("id", affiliate_id.trim())
    .eq("diviner_id", diviner.id)
    .single();

  if (affError || !affiliate) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/404",
        title: "Affiliate not found",
        status: 404,
        detail: "The affiliate does not exist or does not belong to this diviner.",
      },
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
        status: 422,
        detail: "Unsupported referral destination type.",
      },
      { status: 422 }
    );
  }

  if (normalizedProductType === "diviner_service") {
    if (typeof product_id !== "string" || product_id.trim() === "") {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/422",
          title: "Validation error",
          status: 422,
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
          status: 404,
          detail: "The selected service does not belong to this diviner.",
        },
        { status: 404 }
      );
    }
  }

  // Generate a unique slug: {affiliateId prefix}-{timestamp}-{random}
  const slug = `${affiliate_id.slice(0, 8)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const insertPayload: Record<string, unknown> = {
    affiliate_id: affiliate.id,
    diviner_id: diviner.id,
    slug,
    is_active: true,
  };
  if (typeof product_id === "string" && product_id.trim()) insertPayload.product_id = product_id.trim();
  if (normalizedProductType) insertPayload.product_type = normalizedProductType;

  const { data, error } = await admin
    .from("affiliate_referral_links")
    .insert(insertPayload)
    .select(
      "id, affiliate_id, diviner_id, product_id, product_type, slug, url, clicks, conversions, is_active, created_at"
    )
    .single();

  if (error) {
    const statusCode = error.code === "23505" ? 409 : 500;
    return NextResponse.json(
      {
        type: `https://httpstatuses.io/${statusCode}`,
        title: statusCode === 409 ? "Slug collision — try again" : "Database error",
        status: statusCode,
        detail: error.message,
      },
      { status: statusCode }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
