import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/campaigns
// Returns the authenticated diviner's campaigns with summary stats
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

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
    .from("affiliate_campaigns")
    .select("*")
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (status) query = query.eq("status", status);
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

  // Enrich each campaign with summary stats
  const campaignIds = items.map((c: { id: string }) => c.id);

  let affiliateCounts: Record<string, number> = {};
  let conversionCounts: Record<string, number> = {};
  let conversionTotals: Record<string, number> = {};

  if (campaignIds.length > 0) {
    const { data: affRows } = await admin
      .from("campaign_affiliates")
      .select("campaign_id")
      .in("campaign_id", campaignIds);

    if (affRows) {
      for (const row of affRows) {
        affiliateCounts[row.campaign_id] = (affiliateCounts[row.campaign_id] || 0) + 1;
      }
    }

    const { data: convRows } = await admin
      .from("campaign_conversions")
      .select("campaign_id, commission_amount_cents")
      .in("campaign_id", campaignIds);

    if (convRows) {
      for (const row of convRows) {
        conversionCounts[row.campaign_id] = (conversionCounts[row.campaign_id] || 0) + 1;
        conversionTotals[row.campaign_id] = (conversionTotals[row.campaign_id] || 0) + (row.commission_amount_cents || 0);
      }
    }
  }

  const enriched = items.map((c: Record<string, unknown>) => {
    const id = c.id as string;
    // Auto-expire: if end_date passed and status is active, treat as expired
    let effectiveStatus = c.status as string;
    if (effectiveStatus === "active" && c.end_date) {
      const endDate = new Date(c.end_date as string);
      if (endDate < new Date()) {
        effectiveStatus = "expired";
      }
    }
    return {
      ...c,
      status: effectiveStatus,
      affiliates_count: affiliateCounts[id] || 0,
      conversions_count: conversionCounts[id] || 0,
      total_commission_cents: conversionTotals[id] || 0,
    };
  });

  return NextResponse.json({ data: enriched, nextCursor, hasMore });
}

// POST /api/dashboard/campaigns
// Create a new campaign for the authenticated diviner
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const {
    name,
    description,
    start_date,
    end_date,
    commission_type,
    commission_value,
    budget_cap_cents,
    target_product_type,
    utm_source,
    utm_medium,
    utm_campaign,
  } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim() === "") {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: "name is required." },
      { status: 422 }
    );
  }
  if (typeof start_date !== "string" || !start_date.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: "start_date is required." },
      { status: 422 }
    );
  }
  if (end_date && typeof end_date === "string" && new Date(end_date) < new Date(start_date as string)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: "end_date must be after start_date." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

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

  const insertPayload: Record<string, unknown> = {
    diviner_id: diviner.id,
    name: (name as string).trim(),
    start_date,
    status: "draft",
    created_by: user.id,
  };

  if (typeof description === "string" && description.trim()) insertPayload.description = description.trim();
  if (typeof end_date === "string" && end_date.trim()) insertPayload.end_date = end_date;
  if (typeof commission_type === "string") insertPayload.commission_type = commission_type;
  if (typeof commission_value === "number") insertPayload.commission_value = commission_value;
  if (typeof budget_cap_cents === "number") insertPayload.budget_cap_cents = budget_cap_cents;
  if (typeof target_product_type === "string" && target_product_type) insertPayload.target_product_type = target_product_type;
  if (typeof utm_source === "string" && utm_source) insertPayload.utm_source = utm_source;
  if (typeof utm_medium === "string" && utm_medium) insertPayload.utm_medium = utm_medium;
  if (typeof utm_campaign === "string" && utm_campaign) insertPayload.utm_campaign = utm_campaign;

  const { data, error } = await admin
    .from("affiliate_campaigns")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
