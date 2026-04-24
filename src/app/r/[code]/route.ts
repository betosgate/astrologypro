import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse, getIpIdentifier } from "@/lib/rate-limit";
import {
  parseClickData,
  isUniqueClick,
  logCampaignClick,
} from "@/lib/campaign-click-logger";
import { resolveCampaignDestination } from "@/lib/campaign-destination-resolver";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // ── 1. Rate limit (100/min per IP) ─────────────────────────────────────────
  const identifier = `tracking:${getIpIdentifier(request)}`;
  const rlResult = await rateLimit(identifier, 100, 60_000);
  if (!rlResult.success) return rateLimitResponse(rlResult);

  const admin = createAdminClient();

  // ── 2. Look up tracking link ───────────────────────────────────────────────
  const { data: link } = await admin
    .from("tracking_links")
    .select(
      "id, diviner_id, destination_url, campaign_id, destination_type, destination_entity_id, unique_clicks, is_active, clicks"
    )
    .eq("code", code)
    .maybeSingle();

  if (!link) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── 3. Inactive link check ─────────────────────────────────────────────────
  // tracking_links.is_active=false → route the visitor to the branded
  // "link no longer active" page instead of the diviner profile, so
  // they understand why the link didn't work. No click is logged.
  if (link.is_active === false) {
    return NextResponse.redirect(
      new URL("/link-not-active", request.url),
      307,
    );
  }

  // Pre-validate the campaign + its source assignment BEFORE logging the
  // click. Spec §5 Flow D step 3: a dead campaign or revoked assignment
  // MUST render the "link no longer active" page — and clicks on dead
  // links should not pollute campaign_clicks analytics.
  if (link.campaign_id) {
    const { data: gatingCampaign } = await admin
      .from("affiliate_campaigns")
      .select("status, source_assignment_id")
      .eq("id", link.campaign_id)
      .maybeSingle();

    if (!gatingCampaign || gatingCampaign.status !== "active") {
      return NextResponse.redirect(
        new URL("/link-not-active", request.url),
        307,
      );
    }

    if (gatingCampaign.source_assignment_id) {
      const { data: gatingAssignment } = await admin
        .from("diviner_service_affiliates")
        .select("is_active")
        .eq("id", gatingCampaign.source_assignment_id as string)
        .maybeSingle();
      if (!gatingAssignment || gatingAssignment.is_active === false) {
        return NextResponse.redirect(
          new URL("/link-not-active", request.url),
          307,
        );
      }
    }
  }

  // ── 4. Parse click data ────────────────────────────────────────────────────
  const clickData = parseClickData(request);

  // ── 5. Determine destination URL ───────────────────────────────────────────
  let destinationUrl: string;
  let destinationType: "PROFILE" | "SERVICE" = "PROFILE";
  let destinationId: string = link.diviner_id;
  let isCampaignLink = false;

  // Affiliate attribution context — populated only when the campaign
  // is owned by an affiliate (owner_type='affiliate'). Set to null
  // on diviner-owned campaigns so diviner-owned clicks don't carry
  // stale affiliate attribution.
  let affiliateId: string | null = null;
  let affiliateType: "diviner_affiliate" | "social_advocate" | null = null;
  let commissionValueSnapshot: number | null = null;
  let commissionTypeSnapshot: "percent" | "flat" | null = null;

  if (link.campaign_id && link.destination_type && link.destination_entity_id) {
    isCampaignLink = true;

    // Load campaign for date/status validation + affiliate owner context.
    // Snapshot columns are no longer read here (spec v1.2 — rate lives
    // on the booking stamp, not the campaign). Dropped in 01b.
    const { data: campaign } = await admin
      .from("affiliate_campaigns")
      .select(
        "id, status, destination_type, destination_profile_id, destination_service_template_id, diviner_id, start_date, end_date, owner_type, owner_affiliate_id, owner_affiliate_type"
      )
      .eq("id", link.campaign_id)
      .maybeSingle();

    if (campaign && campaign.owner_type === "affiliate") {
      affiliateId = (campaign.owner_affiliate_id as string | null) ?? null;
      affiliateType =
        (campaign.owner_affiliate_type as "diviner_affiliate" | "social_advocate" | null) ?? null;
      // Click-level snapshot carried on campaign_clicks is legacy audit
      // only — the authoritative rate for payout is on the booking row.
      commissionValueSnapshot = null;
      commissionTypeSnapshot = null;
    }

    if (campaign && campaign.status === "active") {
      // Validate date window
      const now = new Date();
      const startOk = !campaign.start_date || new Date(campaign.start_date) <= now;
      const endOk = !campaign.end_date || new Date(campaign.end_date) >= now;

      if (startOk && endOk) {
        // Entity-based resolution — never trusts stored URL
        const resolved = await resolveCampaignDestination(admin, campaign);
        destinationUrl = resolved.url;
        destinationType = (campaign.destination_type ?? "PROFILE") as "PROFILE" | "SERVICE";
        destinationId =
          campaign.destination_type === "SERVICE"
            ? (campaign.destination_service_template_id ?? campaign.diviner_id)
            : (campaign.destination_profile_id ?? campaign.diviner_id);
      } else {
        // Outside date window — fall back to diviner profile
        const { data: diviner } = await admin
          .from("diviners")
          .select("username")
          .eq("id", link.diviner_id)
          .maybeSingle();
        destinationUrl = diviner ? `/${diviner.username}` : "/";
      }
    } else {
      // Campaign not active — fall back to diviner profile
      const { data: diviner } = await admin
        .from("diviners")
        .select("username")
        .eq("id", link.diviner_id)
        .maybeSingle();
      destinationUrl = diviner ? `/${diviner.username}` : "/";
    }
  } else {
    // Legacy non-campaign tracking link — use stored destination_url
    destinationUrl = link.destination_url;
  }

  // ── 6. Bot fast exit — just increment counter and redirect ─────────────────
  if (clickData.is_bot) {
    // Fire-and-forget counter increment
    void admin
      .rpc("increment_tracking_link_clicks", { link_id: link.id })
      .then(() => {}, () => {});
    return NextResponse.redirect(new URL(destinationUrl, request.url), 307);
  }

  // ── 7. Increment atomic click counter (fire-and-forget) ────────────────────
  void admin
    .rpc("increment_tracking_link_clicks", { link_id: link.id })
    .then(() => {}, () => {});

  // ── 8. Rich click logging for campaign links ───────────────────────────────
  if (isCampaignLink && link.campaign_id) {
    const unique = await isUniqueClick(
      admin,
      link.campaign_id,
      clickData.anonymous_visitor_id
    );

    // Update unique_clicks counter on tracking_links (fire-and-forget)
    if (unique) {
      void admin
        .from("tracking_links")
        .update({ unique_clicks: (link.unique_clicks ?? 0) + 1 })
        .eq("id", link.id)
        .then(() => {}, () => {});
    }

    // Log full click record (fire-and-forget)
    logCampaignClick(
      admin,
      {
        campaignId: link.campaign_id,
        trackingLinkId: link.id,
        campaignCode: code,
        divinerId: link.diviner_id,
        destinationType,
        destinationId,
        resolvedUrl: destinationUrl,
        request,
        affiliateId,
        affiliateType,
        commissionValueSnapshot,
        commissionTypeSnapshot,
        refCode: code,
      },
      clickData,
      unique
    );
  }

  // ── 9. Build redirect URL ──────────────────────────────────────────────────
  const redirectUrl = new URL(destinationUrl, request.url);

  if (isCampaignLink) {
    // Attribution continuity
    redirectUrl.searchParams.set("ref", code);

    // Carry through UTM params from the click URL
    if (clickData.utm_source) redirectUrl.searchParams.set("utm_source", clickData.utm_source);
    if (clickData.utm_medium) redirectUrl.searchParams.set("utm_medium", clickData.utm_medium);
    if (clickData.utm_campaign) redirectUrl.searchParams.set("utm_campaign", clickData.utm_campaign);
  }

  return NextResponse.redirect(redirectUrl, 307);
}
