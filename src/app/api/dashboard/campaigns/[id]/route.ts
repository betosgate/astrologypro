import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/dashboard/campaigns/[id]
// Campaign detail with affiliates and conversions
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { data: campaign, error } = await admin
    .from("affiliate_campaigns")
    .select("*")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (error || !campaign) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  // Auto-expire status
  let effectiveStatus = campaign.status;
  if (effectiveStatus === "active" && campaign.end_date) {
    if (new Date(campaign.end_date) < new Date()) {
      effectiveStatus = "expired";
    }
  }

  // Fetch affiliates enrolled in this campaign
  const { data: affiliates } = await admin
    .from("campaign_affiliates")
    .select("*")
    .eq("campaign_id", id)
    .order("joined_at", { ascending: false });

  // Enrich affiliates with names from diviner_affiliates
  const affiliateIds = (affiliates ?? [])
    .filter((a: { affiliate_type: string }) => a.affiliate_type === "diviner_affiliate")
    .map((a: { affiliate_id: string }) => a.affiliate_id);

  let affiliateNames: Record<string, string> = {};
  if (affiliateIds.length > 0) {
    const { data: affRecords } = await admin
      .from("diviner_affiliates")
      .select("id, name, email")
      .in("id", affiliateIds);
    if (affRecords) {
      for (const rec of affRecords) {
        affiliateNames[rec.id] = rec.name || rec.email;
      }
    }
  }

  // Fetch conversions
  const { data: conversions } = await admin
    .from("campaign_conversions")
    .select("*")
    .eq("campaign_id", id)
    .order("converted_at", { ascending: false })
    .limit(100);

  // Per-affiliate conversion stats
  const affiliateStats: Record<string, { conversions: number; commission_cents: number }> = {};
  for (const conv of conversions ?? []) {
    const key = conv.affiliate_id;
    if (!affiliateStats[key]) affiliateStats[key] = { conversions: 0, commission_cents: 0 };
    affiliateStats[key].conversions += 1;
    affiliateStats[key].commission_cents += conv.commission_amount_cents || 0;
  }

  const enrichedAffiliates = (affiliates ?? []).map((a: Record<string, unknown>) => ({
    ...a,
    name: affiliateNames[a.affiliate_id as string] || (a.affiliate_id as string).slice(0, 8),
    conversions: affiliateStats[a.affiliate_id as string]?.conversions || 0,
    commission_cents: affiliateStats[a.affiliate_id as string]?.commission_cents || 0,
  }));

  return NextResponse.json({
    data: {
      ...campaign,
      status: effectiveStatus,
      affiliates: enrichedAffiliates,
      conversions: conversions ?? [],
    },
  });
}

// PATCH /api/dashboard/campaigns/[id]
// Update campaign (name, dates, status, commission, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Verify ownership
  const { data: existing } = await admin
    .from("affiliate_campaigns")
    .select("id, diviner_id, status")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const b = body as Record<string, unknown>;

  if (typeof b.name === "string" && b.name.trim()) updates.name = b.name.trim();
  if (typeof b.description === "string") updates.description = b.description.trim();
  if (typeof b.status === "string" && ["draft", "active", "paused", "completed"].includes(b.status)) {
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

// DELETE /api/dashboard/campaigns/[id]
// Delete draft campaigns only
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { data: existing } = await admin
    .from("affiliate_campaigns")
    .select("id, status")
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  if (existing.status !== "draft") {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Only draft campaigns can be deleted" },
      { status: 422 }
    );
  }

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
