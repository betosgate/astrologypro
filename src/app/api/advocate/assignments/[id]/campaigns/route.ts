/**
 * POST /api/advocate/assignments/[id]/campaigns
 *
 * Affiliate creates a new campaign scoped to one of their active
 * assignments. The campaign's destination + commission are inherited
 * from the assignment and locked at creation time (snapshot).
 *
 * Body: { name, description?, channel?, start_date?, end_date?,
 *         budget_cap_cents?, utm_source?, utm_medium?, utm_campaign? }
 *
 * Response: { campaign: { id, campaign_code, share_url } }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCampaignCode } from "@/lib/campaign-code";
import { isAffiliateAssignmentV2Enabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function resolveAffiliate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();

  const { data: advocate } = await admin
    .from("social_advocates")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (advocate)
    return {
      user,
      admin,
      affiliateId: advocate.id as string,
      affiliateType: "social_advocate" as const,
    };

  const { data: divAff } = await admin
    .from("diviner_affiliates")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (divAff)
    return {
      user,
      admin,
      affiliateId: divAff.id as string,
      affiliateType: "diviner_affiliate" as const,
    };

  return null;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  if (!isAffiliateAssignmentV2Enabled()) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 503 });
  }
  const { id: assignmentId } = await params;
  const ctx = await resolveAffiliate();
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { admin, affiliateId, affiliateType } = ctx;

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    channel?: string;
    start_date?: string;
    end_date?: string;
    budget_cap_cents?: number;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }

  // Resolve the assignment and confirm it belongs to this affiliate + is active
  const { data: assignment } = await admin
    .from("diviner_service_affiliates")
    .select(
      "id, diviner_id, destination_type, destination_id, affiliate_id, affiliate_type, commission_type, commission_value, is_active"
    )
    .eq("id", assignmentId)
    .maybeSingle();

  if (
    !assignment ||
    assignment.affiliate_id !== affiliateId ||
    assignment.affiliate_type !== affiliateType
  ) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  if (!assignment.is_active) {
    return NextResponse.json(
      { error: "Assignment has been revoked" },
      { status: 403 }
    );
  }

  // Generate unique campaign code
  let campaignCode: string;
  try {
    campaignCode = await generateCampaignCode(admin);
  } catch (err) {
    console.error("[advocate/campaigns] generateCampaignCode failed", err);
    return NextResponse.json(
      { error: "Could not allocate a campaign code, please retry" },
      { status: 500 }
    );
  }

  // Resolve share URL based on destination
  const { data: diviner } = await admin
    .from("diviners")
    .select("username")
    .eq("id", assignment.diviner_id)
    .maybeSingle();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://astrologypro.com";
  const shareUrl = `${appUrl.replace(/\/$/, "")}/r/${campaignCode}`;

  // Insert the campaign
  const now = new Date().toISOString();
  // Assignment stores ('percent','flat'); affiliate_campaigns.commission_type
  // check constraint uses the legacy ('percentage','fixed') vocabulary. Map
  // across the boundary without mutating the snapshot.
  const assignmentCommissionType =
    (assignment.commission_type as "percent" | "flat") ?? "percent";
  const campaignCommissionType =
    assignmentCommissionType === "flat" ? "fixed" : "percentage";
  const insertPayload: Record<string, unknown> = {
    diviner_id: assignment.diviner_id,
    name: body.name.trim(),
    description: body.description?.trim() || null,
    status: "active",
    commission_type: campaignCommissionType,
    commission_value: Number(assignment.commission_value),
    // Owner fields — affiliate-owned campaign
    owner_type: "affiliate",
    owner_affiliate_id: affiliateId,
    owner_affiliate_type: affiliateType,
    commission_value_snapshot: Number(assignment.commission_value),
    commission_type_snapshot: assignmentCommissionType,
    source_assignment_id: assignment.id,
    // Destination inherited. The chk_destination_profile / chk_destination_service
    // constraints require exactly one of destination_profile_id /
    // destination_service_template_id to be set, and the other NULL.
    destination_type: assignment.destination_type,
    destination_profile_id:
      assignment.destination_type === "PROFILE"
        ? assignment.diviner_id
        : null,
    destination_service_template_id:
      assignment.destination_type === "SERVICE"
        ? assignment.destination_id
        : null,
    campaign_code: campaignCode,
    share_url: shareUrl,
    channel: body.channel?.trim() || null,
    start_date: body.start_date || now,
    end_date: body.end_date || null,
    budget_cap_cents:
      body.budget_cap_cents != null && Number.isFinite(Number(body.budget_cap_cents))
        ? Number(body.budget_cap_cents)
        : null,
    utm_source: body.utm_source?.trim() || null,
    utm_medium: body.utm_medium?.trim() || null,
    utm_campaign: body.utm_campaign?.trim() || null,
  };

  const { data: inserted, error: insertErr } = await admin
    .from("affiliate_campaigns")
    .insert(insertPayload)
    .select("id, campaign_code, share_url")
    .single();

  if (insertErr || !inserted) {
    console.error("[advocate/campaigns] campaign insert failed", insertErr);
    return NextResponse.json(
      { error: insertErr?.message ?? "Failed to create campaign" },
      { status: 500 }
    );
  }

  // Create the tracking link (so /r/[code] can resolve)
  const destinationPath =
    assignment.destination_type === "SERVICE" && diviner?.username
      ? // Placeholder — resolveCampaignDestination will look up the real service slug
        `/${diviner.username}`
      : diviner?.username
      ? `/${diviner.username}`
      : "/";
  await admin.from("tracking_links").insert({
    diviner_id: assignment.diviner_id,
    code: campaignCode,
    destination_url: destinationPath,
    campaign_id: inserted.id,
    destination_type: assignment.destination_type,
    destination_entity_id:
      assignment.destination_type === "SERVICE"
        ? assignment.destination_id
        : assignment.diviner_id,
    is_active: true,
  });

  return NextResponse.json({
    campaign: {
      id: inserted.id,
      campaign_code: inserted.campaign_code,
      share_url: inserted.share_url,
    },
  }, { status: 201 });
}
