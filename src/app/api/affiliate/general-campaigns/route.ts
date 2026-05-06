// POST /api/affiliate/general-campaigns
//
// Phase 1.5: an active affiliate creates a campaign anchored on a general
// service_templates row (no per-diviner assignment). Parallel to
// POST /api/affiliate/assignments/[id]/campaigns for the per-diviner path.
//
// Spec: docs/specs/affiliate-commission-system.md §10 Phase 1.5
// Task:  docs/tasks/2026-04-28/affiliate-phase-1-5-general-products/04-general-campaigns-endpoint.md

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import { generateCampaignCode } from "@/lib/campaign-code";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { checkAffiliatePayoutReadiness } from "@/lib/affiliate-payout-readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CAMPAIGN_CREATE_LIMIT = 20;
const CAMPAIGN_CREATE_WINDOW_MS = 60 * 60 * 1000; // 1h per affiliate

function problem(
  status: number,
  title: string,
  detail?: string,
  extras?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
      ...(extras ?? {}),
    },
    { status },
  );
}

function cleanString(input: unknown, maxLen: number): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLen) return trimmed.slice(0, maxLen);
  return trimmed;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  const { account } = ctx;

  // Phase 2 Task 03 gate: block new-campaign creation when the affiliate
  // hasn't onboarded with Stripe Connect (or onboarding is incomplete).
  // Existing campaigns and their share links are grandfathered.
  const readiness = await checkAffiliatePayoutReadiness({
    admin,
    userId: user.id,
  });
  if (readiness.ready !== true) {
    const failure = readiness;
    return problem(403, failure.message, undefined, {
      code: "affiliate_payout_not_ready",
      reason: failure.reason,
      cta: failure.cta,
    });
  }

  const rl = await rateLimit(
    `aff_general_campaign_create:${account.id}`,
    CAMPAIGN_CREATE_LIMIT,
    CAMPAIGN_CREATE_WINDOW_MS,
  );
  if (!rl.success) {
    return rateLimitResponse(
      rl,
      "Too many campaigns created recently. Try again later.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(422, "Invalid JSON body");
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const serviceTemplateId =
    typeof b.service_template_id === "string"
      ? b.service_template_id.trim()
      : null;
  if (!serviceTemplateId) {
    return problem(
      422,
      "Validation error",
      "service_template_id is required",
      { code: "validation_error" },
    );
  }

  const name = cleanString(b.name, 120);
  if (!name) {
    return problem(
      422,
      "Validation error",
      "name is required (1-120 chars)",
      { code: "validation_error" },
    );
  }

  // Template must exist, be flagged general, and have the affiliate
  // program enabled. Spec §10 decision #3: an admin who hasn't set a
  // commission_value but has program_enabled=true is the default-rate
  // case (10% applied at stamp time) — that still counts as eligible.
  const { data: template } = await admin
    .from("service_templates")
    .select("id, is_general, affiliate_program_enabled")
    .eq("id", serviceTemplateId)
    .maybeSingle();

  if (
    !template ||
    template.is_general !== true ||
    template.affiliate_program_enabled !== true
  ) {
    return problem(
      422,
      "Template not eligible",
      "This service template is not enabled for affiliate referrals.",
      { code: "template_not_eligible" },
    );
  }

  let campaignCode: string;
  try {
    campaignCode = await generateCampaignCode(admin);
  } catch (err) {
    console.error("[affiliate/general-campaigns] generateCampaignCode failed", err);
    return problem(
      500,
      "Could not allocate a campaign code, please retry",
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://astrologypro.com";
  const shareUrl = `${appUrl.replace(/\/$/, "")}/r/${campaignCode}`;

  const now = new Date().toISOString();

  // Insert campaign with general semantics. The owner_consistency CHECK
  // (Task 01) requires:
  //   owner_type='affiliate' + owner_affiliate_type='general'
  //   + owner_affiliate_id IS NULL + owner_affiliate_account_id IS NOT NULL
  //   + source_assignment_id IS NULL + destination_service_template_id IS NOT NULL.
  // Legacy commission_type / commission_value columns are NULLable with
  // defaults; write 'percentage' / 0 (legacy enum) explicitly to mirror
  // the per-diviner endpoint's pattern. Snapshot fields intentionally
  // unset — spec §3.8: rate lives on the booking stamp, not the campaign.
  const { data: inserted, error: insertErr } = await admin
    .from("affiliate_campaigns")
    .insert({
      diviner_id: null,
      name,
      description: cleanString(b.description, 1000),
      status: "active",
      commission_type: "percentage",
      commission_value: 0,
      owner_type: "affiliate",
      owner_affiliate_id: null,
      owner_affiliate_type: "general",
      owner_affiliate_account_id: account.id,
      source_assignment_id: null,
      destination_type: "SERVICE",
      destination_profile_id: null,
      destination_service_template_id: template.id,
      campaign_code: campaignCode,
      share_url: shareUrl,
      channel: cleanString(b.channel, 50),
      start_date: now,
      end_date: null,
      utm_source: cleanString(b.utm_source, 100),
      utm_medium: cleanString(b.utm_medium, 100),
      utm_campaign: cleanString(b.utm_campaign, 100),
    })
    .select("id, campaign_code, share_url, created_at")
    .single();

  if (insertErr || !inserted) {
    console.error("[affiliate/general-campaigns] insert failed", insertErr);
    return problem(500, "Failed to create campaign", insertErr?.message);
  }

  // Tracking link so /r/[code] resolves. diviner_id is NULL on general
  // campaigns (Task 01 dropped the NOT NULL); destination_url is a
  // best-effort fallback — /r/[code] always re-resolves the URL via
  // resolveCampaignDestination on hit so it doesn't go stale.
  const fallbackUrl = `${appUrl.replace(/\/$/, "")}/`;
  const { error: linkErr } = await admin.from("tracking_links").insert({
    diviner_id: null,
    code: campaignCode,
    destination_url: fallbackUrl,
    campaign_id: inserted.id,
    destination_type: "SERVICE",
    destination_entity_id: template.id,
    is_active: true,
  });
  if (linkErr) {
    console.error("[affiliate/general-campaigns] tracking_link insert failed", {
      campaign_id: inserted.id,
      error: linkErr.message,
    });
    // Non-fatal — campaign exists; /r/[code] can still match by code via
    // affiliate_campaigns directly (legacy non-tracking-link path doesn't
    // fire for campaign-driven flows but the redirect handler is robust).
  }

  console.log("[affiliate/general-campaigns] created", {
    campaign_id: inserted.id,
    campaign_code: inserted.campaign_code,
    affiliate_account_id: account.id,
    service_template_id: template.id,
  });

  return NextResponse.json(
    {
      data: {
        campaign_id: inserted.id,
        campaign_code: inserted.campaign_code,
        share_url: inserted.share_url,
        created_at: inserted.created_at,
      },
    },
    { status: 201 },
  );
}
