import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["active", "archived"],
  active: ["paused", "completed"],
  paused: ["active", "completed", "archived"],
  completed: ["archived"],
  expired: ["archived"],
};

// ── GET /api/dashboard/campaigns/[id] ────────────────────────────────────────
// Campaign detail with affiliates, conversions, and destination info

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
      // Deactivate tracking link for expired campaign
      if (campaign.tracking_link_id) {
        admin
          .from("tracking_links")
          .update({ is_active: false })
          .eq("id", campaign.tracking_link_id)
          .then(() => {})
          .catch(() => {});
      }
    }
  }

  // Check if destination is still valid (for auto-paused campaigns)
  let isDestinationStillValid = true;
  if (campaign.destination_type === "SERVICE" && campaign.destination_service_template_id) {
    const { data: ds } = await admin
      .from("diviner_services")
      .select("is_enabled")
      .eq("diviner_id", diviner.id)
      .eq("template_id", campaign.destination_service_template_id)
      .maybeSingle();
    isDestinationStillValid = ds?.is_enabled === true;
  }

  // Fetch affiliates
  const { data: affiliates } = await admin
    .from("campaign_affiliates")
    .select("*")
    .eq("campaign_id", id)
    .order("joined_at", { ascending: false });

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
      auto_paused: campaign.auto_paused_at !== null,
      auto_pause_reason: campaign.auto_pause_reason ?? null,
      can_reactivate:
        campaign.auto_paused_at !== null && isDestinationStillValid,
      affiliates: enrichedAffiliates,
      conversions: conversions ?? [],
    },
  });
}

// ── PATCH /api/dashboard/campaigns/[id] ──────────────────────────────────────
// Update campaign (name, dates, status, commission, destination, etc.)

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
    .select("id, username")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Not a diviner" },
      { status: 403 }
    );
  }

  // Verify ownership + load current campaign
  const { data: existing } = await admin
    .from("affiliate_campaigns")
    .select(
      "id, diviner_id, status, destination_type, destination_service_template_id, auto_paused_at, tracking_link_id"
    )
    .eq("id", id)
    .eq("diviner_id", diviner.id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Campaign not found" },
      { status: 404 }
    );
  }

  const b = body as Record<string, unknown>;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  // ── Status transition validation ──
  if (typeof b.status === "string") {
    const newStatus = b.status;
    const currentStatus = existing.status;

    if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/422",
          title: "Invalid status transition",
          detail: `Cannot change from '${currentStatus}' to '${newStatus}'.`,
        },
        { status: 422 }
      );
    }

    // Cannot activate without a destination
    if (newStatus === "active" && !existing.destination_type && !b.destination_type) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.io/422",
          title: "Validation error",
          detail: "Cannot activate: no destination set. Edit the campaign to add a destination.",
        },
        { status: 422 }
      );
    }

    // Cannot activate if linked service is disabled
    const destType = (b.destination_type ?? existing.destination_type) as string | null;
    const destTemplateId = (b.destination_service_template_id ?? existing.destination_service_template_id) as string | null;
    if (newStatus === "active" && destType === "SERVICE" && destTemplateId) {
      const { data: ds } = await admin
        .from("diviner_services")
        .select("is_enabled")
        .eq("diviner_id", diviner.id)
        .eq("template_id", destTemplateId)
        .maybeSingle();
      if (!ds?.is_enabled) {
        return NextResponse.json(
          {
            type: "https://httpstatuses.io/422",
            title: "Validation error",
            detail: "Cannot activate: linked service is currently disabled.",
          },
          { status: 422 }
        );
      }
    }

    // Activating from auto-paused state: clear auto-pause fields
    if (newStatus === "active" && existing.auto_paused_at) {
      updates.auto_paused_at = null;
      updates.auto_pause_reason = null;
    }

    updates.status = newStatus;
  }

  // ── Basic field updates ──
  if (typeof b.name === "string" && b.name.trim()) updates.name = b.name.trim();
  if (typeof b.description === "string") updates.description = b.description.trim();
  if (typeof b.start_date === "string") updates.start_date = b.start_date;
  if (typeof b.end_date === "string") updates.end_date = b.end_date || null;
  if (typeof b.commission_type === "string") updates.commission_type = b.commission_type;
  if (typeof b.commission_value === "number") updates.commission_value = b.commission_value;
  if (b.budget_cap_cents !== undefined) updates.budget_cap_cents = typeof b.budget_cap_cents === "number" ? b.budget_cap_cents : null;
  if (typeof b.target_product_type === "string") updates.target_product_type = b.target_product_type || null;
  if (typeof b.utm_source === "string") updates.utm_source = b.utm_source || null;
  if (typeof b.utm_medium === "string") updates.utm_medium = b.utm_medium || null;
  if (typeof b.utm_campaign === "string") updates.utm_campaign = b.utm_campaign || null;
  if (typeof b.channel === "string") updates.channel = b.channel || null;
  if (typeof b.content_variant === "string") updates.content_variant = b.content_variant || null;

  // ── Destination change ──
  const changingDestination =
    b.destination_type !== undefined || b.destination_service_template_id !== undefined;

  if (changingDestination) {
    const newDestType = (b.destination_type ?? existing.destination_type) as string | null;

    if (newDestType && !["PROFILE", "SERVICE"].includes(newDestType)) {
      return NextResponse.json(
        { type: "https://httpstatuses.io/422", title: "Validation error", detail: "destination_type must be PROFILE or SERVICE." },
        { status: 422 }
      );
    }

    if (newDestType === "PROFILE") {
      updates.destination_type = "PROFILE";
      updates.destination_profile_id = diviner.id;
      updates.destination_service_template_id = null;
      updates.destination_diviner_service_id = null;

      // Update tracking link destination if it exists
      if (existing.tracking_link_id) {
        admin
          .from("tracking_links")
          .update({
            destination_type: "PROFILE",
            destination_entity_id: diviner.id,
            destination_url: `/${diviner.username}`,
          })
          .eq("id", existing.tracking_link_id)
          .then(() => {})
          .catch(() => {});
      }
    } else if (newDestType === "SERVICE") {
      const newTemplateId = (b.destination_service_template_id ?? existing.destination_service_template_id) as string | null;
      if (!newTemplateId) {
        return NextResponse.json(
          { type: "https://httpstatuses.io/422", title: "Validation error", detail: "destination_service_template_id is required." },
          { status: 422 }
        );
      }

      const { data: template } = await admin
        .from("service_templates")
        .select("id, slug, is_active")
        .eq("id", newTemplateId)
        .maybeSingle();

      if (!template || !template.is_active) {
        return NextResponse.json(
          { type: "https://httpstatuses.io/422", title: "Validation error", detail: "Service template not found or inactive." },
          { status: 422 }
        );
      }

      const { data: ds } = await admin
        .from("diviner_services")
        .select("id, is_enabled")
        .eq("diviner_id", diviner.id)
        .eq("template_id", newTemplateId)
        .maybeSingle();

      if (!ds || !ds.is_enabled) {
        return NextResponse.json(
          { type: "https://httpstatuses.io/403", title: "Forbidden", detail: "This service is not enabled for your account." },
          { status: 403 }
        );
      }

      updates.destination_type = "SERVICE";
      updates.destination_service_template_id = newTemplateId;
      updates.destination_diviner_service_id = ds.id;
      updates.destination_profile_id = null;

      // If previously auto-paused and changing destination, clear auto-pause fields
      // (diviner must manually activate — status stays paused)
      if (existing.auto_paused_at) {
        updates.auto_paused_at = null;
        updates.auto_pause_reason = null;
      }

      // Update tracking link destination if it exists
      if (existing.tracking_link_id) {
        admin
          .from("tracking_links")
          .update({
            destination_type: "SERVICE",
            destination_entity_id: newTemplateId,
            destination_url: `/${diviner.username}/services/${template.slug}`,
          })
          .eq("id", existing.tracking_link_id)
          .then(() => {})
          .catch(() => {});
      }
    }
  }

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

// ── DELETE /api/dashboard/campaigns/[id] ─────────────────────────────────────
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
