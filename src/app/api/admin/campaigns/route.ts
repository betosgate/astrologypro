import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/campaigns
// List ALL campaigns (platform-wide + per-diviner) with filters
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const divinerId = searchParams.get("diviner_id");
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  let query = admin
    .from("affiliate_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (status) query = query.eq("status", status);
  if (divinerId) query = query.eq("diviner_id", divinerId);
  if (q) query = query.ilike("name", `%${q}%`);
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

  // Enrich with diviner names and stats
  const divinerIds = [...new Set(items.filter((c: Record<string, unknown>) => c.diviner_id).map((c: Record<string, unknown>) => c.diviner_id as string))];
  const campaignIds = items.map((c: { id: string }) => c.id);

  let divinerNames: Record<string, string> = {};
  if (divinerIds.length > 0) {
    const { data: diviners } = await admin
      .from("diviners")
      .select("id, display_name")
      .in("id", divinerIds);
    if (diviners) {
      for (const d of diviners) {
        divinerNames[d.id] = d.display_name;
      }
    }
  }

  let affiliateCounts: Record<string, number> = {};
  let conversionCounts: Record<string, number> = {};

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
      .select("campaign_id")
      .in("campaign_id", campaignIds);
    if (convRows) {
      for (const row of convRows) {
        conversionCounts[row.campaign_id] = (conversionCounts[row.campaign_id] || 0) + 1;
      }
    }
  }

  const enriched = items.map((c: Record<string, unknown>) => {
    let effectiveStatus = c.status as string;
    if (effectiveStatus === "active" && c.end_date) {
      if (new Date(c.end_date as string) < new Date()) effectiveStatus = "expired";
    }
    return {
      ...c,
      status: effectiveStatus,
      diviner_name: c.diviner_id ? (divinerNames[c.diviner_id as string] || "Unknown") : "Platform-wide",
      affiliates_count: affiliateCounts[c.id as string] || 0,
      conversions_count: conversionCounts[c.id as string] || 0,
    };
  });

  return NextResponse.json({ data: enriched, nextCursor, hasMore });
}

// POST /api/admin/campaigns
// Create platform-wide campaign (diviner_id = NULL)
export async function POST(request: Request) {
  const user = await getAdminUser();
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

  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || !(b.name as string).trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "name is required" },
      { status: 422 }
    );
  }
  if (typeof b.start_date !== "string" || !(b.start_date as string).trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "start_date is required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  const insertPayload: Record<string, unknown> = {
    diviner_id: b.diviner_id || null, // null = platform-wide
    name: (b.name as string).trim(),
    start_date: b.start_date,
    status: (typeof b.status === "string" && b.status) || "draft",
    created_by: user.id,
  };

  if (typeof b.description === "string" && b.description.trim()) insertPayload.description = b.description.trim();
  if (typeof b.end_date === "string" && b.end_date.trim()) insertPayload.end_date = b.end_date;
  if (typeof b.commission_type === "string") insertPayload.commission_type = b.commission_type;
  if (typeof b.commission_value === "number") insertPayload.commission_value = b.commission_value;
  if (typeof b.budget_cap_cents === "number") insertPayload.budget_cap_cents = b.budget_cap_cents;
  if (typeof b.target_product_type === "string" && b.target_product_type) insertPayload.target_product_type = b.target_product_type;
  if (typeof b.utm_source === "string" && b.utm_source) insertPayload.utm_source = b.utm_source;
  if (typeof b.utm_medium === "string" && b.utm_medium) insertPayload.utm_medium = b.utm_medium;
  if (typeof b.utm_campaign === "string" && b.utm_campaign) insertPayload.utm_campaign = b.utm_campaign;

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
