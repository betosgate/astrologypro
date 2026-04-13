import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/campaigns/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: campaign, error } = await admin
    .from("affiliate_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  // Auto-expire
  let effectiveStatus = campaign.status;
  if (effectiveStatus === "active" && campaign.end_date) {
    if (new Date(campaign.end_date) < new Date()) effectiveStatus = "expired";
  }

  const { data: affiliates } = await admin
    .from("campaign_affiliates")
    .select("*")
    .eq("campaign_id", id)
    .order("joined_at", { ascending: false });

  const { data: conversions } = await admin
    .from("campaign_conversions")
    .select("*")
    .eq("campaign_id", id)
    .order("converted_at", { ascending: false })
    .limit(200);

  return NextResponse.json({
    data: {
      ...campaign,
      status: effectiveStatus,
      affiliates: affiliates ?? [],
      conversions: conversions ?? [],
    },
  });
}

// PATCH /api/admin/campaigns/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const admin = createAdminClient();
  const b = body as Record<string, unknown>;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof b.name === "string" && b.name.trim()) updates.name = b.name.trim();
  if (typeof b.description === "string") updates.description = b.description.trim();
  if (typeof b.status === "string" && ["draft", "active", "paused", "completed", "expired"].includes(b.status)) {
    updates.status = b.status;
  }
  if (typeof b.start_date === "string") updates.start_date = b.start_date;
  if (typeof b.end_date === "string") updates.end_date = b.end_date || null;
  if (typeof b.commission_type === "string") updates.commission_type = b.commission_type;
  if (typeof b.commission_value === "number") updates.commission_value = b.commission_value;
  if (b.budget_cap_cents !== undefined) updates.budget_cap_cents = typeof b.budget_cap_cents === "number" ? b.budget_cap_cents : null;
  if (typeof b.target_product_type === "string") updates.target_product_type = b.target_product_type || null;
  if (typeof b.utm_source === "string") updates.utm_source = b.utm_source || null;
  if (typeof b.utm_medium === "string") updates.utm_medium = b.utm_medium || null;
  if (typeof b.utm_campaign === "string") updates.utm_campaign = b.utm_campaign || null;
  if (b.diviner_id !== undefined) updates.diviner_id = b.diviner_id || null;

  const { data, error } = await admin
    .from("affiliate_campaigns")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

// DELETE /api/admin/campaigns/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { error } = await admin
    .from("affiliate_campaigns")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
