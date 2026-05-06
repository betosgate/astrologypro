// POST /api/affiliate/assignments/[id]/campaigns
//
// Diviner-affiliate creates a new tracking campaign against one of their
// active assignments. The campaign inherits the assignment's destination
// (profile or service) and, per spec v1.2, the commission rate is resolved
// live from the assignment at booking time — NOT snapshotted on the campaign
// for payout math. The snapshot fields written below are only there to
// satisfy the existing `affiliate_campaigns_owner_consistency` CHECK; they
// will be dropped in Task 01b along with the constraint.
//
// Task: docs/tasks/2026-04-24/affiliate-commission-v2/03-affiliate-campaign-selfserve.md
// Spec: docs/specs/affiliate-commission-system.md §5 Flow C

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: assignmentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  const { account, junctionIds } = ctx;

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

  // Rate limit per affiliate account
  const rl = await rateLimit(
    `aff_campaign_create:${account.id}`,
    CAMPAIGN_CREATE_LIMIT,
    CAMPAIGN_CREATE_WINDOW_MS,
  );
  if (!rl.success) {
    return rateLimitResponse(
      rl,
      "Too many campaigns created recently. Try again later.",
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(422, "Invalid JSON body");
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const name = cleanString(b.name, 120);
  if (!name) {
    return problem(422, "Validation error", "name is required (1-120 chars)");
  }

  // Look up the assignment. Require:
  //   - belongs to the caller (affiliate_id in junctionIds)
  //   - affiliate_type = 'diviner_affiliate' (Phase 1 scope)
  //   - is_active
  const { data: assignment } = await admin
    .from("diviner_service_affiliates")
    .select(
      "id, diviner_id, destination_type, destination_id, affiliate_id, affiliate_type, commission_type, commission_value, is_active",
    )
    .eq("id", assignmentId)
    .maybeSingle();

  if (
    !assignment ||
    !junctionIds.includes(assignment.affiliate_id as string) ||
    assignment.affiliate_type !== "diviner_affiliate"
  ) {
    // Hide whether the assignment exists but belongs to someone else.
    return problem(404, "Assignment not found");
  }
  if (!assignment.is_active) {
    return problem(403, "Assignment has been revoked");
  }

  // Generate a unique campaign code (retry-safe helper)
  let campaignCode: string;
  try {
    campaignCode = await generateCampaignCode(admin);
  } catch (err) {
    console.error("[affiliate/campaigns] generateCampaignCode failed", err);
    return problem(
      500,
      "Could not allocate a campaign code, please retry",
    );
  }

  // Resolve share URL — diviner's username drives the fallback destination
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

  // Commission enum boundary: diviner_service_affiliates uses ('percent','flat');
  // affiliate_campaigns.commission_type uses ('percentage','fixed'). Map
  // across the boundary. The snapshot fields are temporary — dropped in 01b.
  const assignmentCommissionType =
    (assignment.commission_type as "percent" | "flat") ?? "percent";
  const campaignCommissionType =
    assignmentCommissionType === "flat" ? "fixed" : "percentage";

  const now = new Date().toISOString();

  const { data: inserted, error: insertErr } = await admin
    .from("affiliate_campaigns")
    .insert({
      diviner_id: assignment.diviner_id,
      name,
      description: cleanString(b.description, 1000),
      status: "active",
      // Legacy columns still NOT NULL on the table (DEFAULTs cover most,
      // but commission_type DEFAULT 'percentage' — write explicitly to be safe)
      commission_type: campaignCommissionType,
      commission_value: Number(assignment.commission_value),
      // Owner fields — affiliate-owned campaign (Phase 1: always diviner_affiliate)
      owner_type: "affiliate",
      owner_affiliate_id: assignment.affiliate_id,
      owner_affiliate_type: "diviner_affiliate",
      // Required by affiliate_campaigns_owner_consistency CHECK until 01b drops them
      commission_value_snapshot: Number(assignment.commission_value),
      commission_type_snapshot: assignmentCommissionType,
      source_assignment_id: assignment.id,
      // Destination inherited from assignment. One of
      // destination_profile_id / destination_service_template_id must be set.
      destination_type: assignment.destination_type,
      destination_profile_id:
        assignment.destination_type === "PROFILE" ? assignment.diviner_id : null,
      destination_service_template_id:
        assignment.destination_type === "SERVICE"
          ? assignment.destination_id
          : null,
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
    console.error("[affiliate/campaigns] campaign insert failed", insertErr);
    return problem(500, "Failed to create campaign", insertErr?.message);
  }

  // Tracking link so /r/[code] resolves. destination_url here is the fallback;
  // the /r/[code] handler calls resolveCampaignDestination() live on each hit
  // so stored URLs don't go stale when usernames change.
  const destinationPath = diviner?.username ? `/${diviner.username}` : "/";
  const { error: linkErr } = await admin.from("tracking_links").insert({
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

  if (linkErr) {
    console.error("[affiliate/campaigns] tracking_link insert failed", {
      campaign_id: inserted.id,
      error: linkErr.message,
    });
    // Not fatal — campaign row exists; the redirect handler can resolve
    // by campaign_code alone as a fallback. Surface via log for ops.
  }

  console.log("[affiliate/campaigns] created", {
    campaign_id: inserted.id,
    campaign_code: inserted.campaign_code,
    affiliate_account_id: account.id,
    junction_id: assignment.affiliate_id,
    assignment_id: assignment.id,
    diviner_id: assignment.diviner_id,
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
