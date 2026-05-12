import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a unique cmp_ campaign code with retry logic. */
async function generateCampaignCode(
  admin: SupabaseClient,
  maxRetries = 3
): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let code = "cmp_";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const { data } = await admin
      .from("affiliate_campaigns")
      .select("id")
      .eq("campaign_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Failed to generate unique campaign code after retries");
}

/** Resolve the human-readable destination URL for a campaign. */
function resolveDestinationUrl(
  username: string,
  destinationType: "PROFILE" | "SERVICE",
  serviceSlug?: string
): string {
  if (destinationType === "PROFILE") return `/${username}`;
  return `/${username}/services/${serviceSlug}`;
}

// ── GET /api/dashboard/campaigns ─────────────────────────────────────────────
// Returns the authenticated diviner's campaigns with summary stats

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 100);
  const offset = (page - 1) * limit;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

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
    .select("*", { count: "exact" })
    .eq("diviner_id", diviner.id)
    .eq("owner_type", "diviner")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("name", `%${q}%`);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to + "T23:59:59Z");

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  const items = data ?? [];

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
        conversionTotals[row.campaign_id] =
          (conversionTotals[row.campaign_id] || 0) + (row.commission_amount_cents || 0);
      }
    }
  }

  const enriched = items.map((c: Record<string, unknown>) => {
    const id = c.id as string;
    let effectiveStatus = c.status as string;
    if (effectiveStatus === "active" && c.end_date) {
      if (new Date(c.end_date as string) < new Date()) {
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

  // Deactivate tracking links for expired campaigns (async, non-blocking)
  const expiredIds = (enriched as Array<Record<string, unknown>>)
    .filter((c) => c.status === "expired")
    .map((c) => c.id as string);
  if (expiredIds.length > 0) {
    void admin
      .from("tracking_links")
      .update({ is_active: false })
      .in("campaign_id", expiredIds)
      .then(() => { }, () => { });
  }

  return NextResponse.json({ data: enriched, total: count ?? 0 });
}

// ── POST /api/dashboard/campaigns ────────────────────────────────────────────
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

  const b = body as Record<string, unknown>;

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
    // Destination fields
    destination_type,
    destination_service_template_id,
    channel,
    content_variant,
  } = b;

  // ── Basic field validation ──
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
  if (end_date && typeof end_date === "string" && new Date(end_date) < new Date(start_date)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: "end_date must be after start_date." },
      { status: 422 }
    );
  }

  // ── Destination type validation ──
  if (destination_type !== undefined && !["PROFILE", "SERVICE"].includes(destination_type as string)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: "destination_type must be PROFILE or SERVICE." },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // ── Resolve diviner ──
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, username")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  // ── Destination-specific validation ──
  let resolvedDestinationProfileId: string | null = null;
  let resolvedDestinationServiceTemplateId: string | null = null;
  let resolvedDestinationDivinerServiceId: string | null = null;
  let resolvedServiceSlug: string | undefined;

  if (destination_type === "PROFILE") {
    resolvedDestinationProfileId = diviner.id;
    resolvedDestinationServiceTemplateId = null;
  } else if (destination_type === "SERVICE") {
    if (!destination_service_template_id || typeof destination_service_template_id !== "string") {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/422",
          title: "Validation error",
          detail: "destination_service_template_id is required when destination_type is SERVICE.",
        },
        { status: 422 }
      );
    }

    // Validate service template exists and is active
    const { data: template } = await admin
      .from("service_templates")
      .select("id, slug, is_active")
      .eq("id", destination_service_template_id)
      .maybeSingle();

    if (!template || !template.is_active) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/422",
          title: "Validation error",
          detail: "Service template not found or inactive.",
        },
        { status: 422 }
      );
    }

    // Validate diviner has this service enabled
    const { data: divinerService } = await admin
      .from("diviner_services")
      .select("id, is_enabled")
      .eq("diviner_id", diviner.id)
      .eq("template_id", destination_service_template_id)
      .maybeSingle();

    if (!divinerService || !divinerService.is_enabled) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/403",
          title: "Forbidden",
          detail: "This service is not enabled for your account.",
        },
        { status: 403 }
      );
    }

    resolvedDestinationServiceTemplateId = destination_service_template_id;
    resolvedDestinationDivinerServiceId = divinerService.id;
    resolvedDestinationProfileId = null;
    resolvedServiceSlug = template.slug;
  }

  // ── Channel validation ──
  const validChannels = [
    "facebook", "instagram", "whatsapp", "youtube", "email",
    "twitter", "tiktok", "linkedin", "direct", "other",
  ];
  if (channel !== undefined && !validChannels.includes(channel as string)) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Validation error", detail: "Invalid channel value." },
      { status: 422 }
    );
  }

  // ── Generate campaign code (if destination is set) ──
  let campaignCode: string | null = null;
  let shareUrl: string | null = null;
  if (destination_type) {
    campaignCode = await generateCampaignCode(admin);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
    shareUrl = `${appUrl}/r/${campaignCode}`;
  }

  // ── Build insert payload ──
  const insertPayload: Record<string, unknown> = {
    diviner_id: diviner.id,
    owner_type: "diviner",
    name: (name as string).trim(),
    start_date,
    status: "active",
    created_by: user.id,
    updated_by: user.id,
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

  // Destination fields
  if (destination_type) insertPayload.destination_type = destination_type;
  if (resolvedDestinationProfileId) insertPayload.destination_profile_id = resolvedDestinationProfileId;
  if (resolvedDestinationServiceTemplateId) insertPayload.destination_service_template_id = resolvedDestinationServiceTemplateId;
  if (resolvedDestinationDivinerServiceId) insertPayload.destination_diviner_service_id = resolvedDestinationDivinerServiceId;
  if (campaignCode) insertPayload.campaign_code = campaignCode;
  if (shareUrl) insertPayload.share_url = shareUrl;
  if (typeof channel === "string" && channel) insertPayload.channel = channel;
  if (typeof content_variant === "string" && content_variant) insertPayload.content_variant = content_variant;

  const { data: campaign, error } = await admin
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

  // ── Create tracking link ──
  if (destination_type && campaignCode) {
    const destinationUrl = resolveDestinationUrl(
      diviner.username,
      destination_type as "PROFILE" | "SERVICE",
      resolvedServiceSlug
    );

    const { data: trackingLink } = await admin
      .from("tracking_links")
      .insert({
        diviner_id: diviner.id,
        code: campaignCode,
        destination_url: destinationUrl,
        campaign_id: campaign.id,
        destination_type: destination_type,
        destination_entity_id:
          destination_type === "PROFILE" ? diviner.id : resolvedDestinationServiceTemplateId,
        source: typeof utm_source === "string" ? utm_source : (typeof channel === "string" ? channel : null),
        campaign: (name as string).trim(),
        is_active: true,
      })
      .select("id")
      .single();

    if (trackingLink) {
      await admin
        .from("affiliate_campaigns")
        .update({ tracking_link_id: trackingLink.id })
        .eq("id", campaign.id);
    }
  }

  return NextResponse.json({ data: campaign }, { status: 201 });
}
