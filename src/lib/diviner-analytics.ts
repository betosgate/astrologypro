import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type DivinerActivityType =
  | "page_view"
  | "booking_checkout_started"
  | "weekly_subscription_checkout_started"
  | "check_in_submitted"
  | "testimonial_submitted";

type AttributionKind = "organic" | "affiliate" | "advocate" | "unknown";

export interface TrackDivinerActivityParams {
  divinerId: string;
  activityType: DivinerActivityType;
  path?: string | null;
  referrer?: string | null;
  search?: string | null;
  request: NextRequest;
  metadata?: Record<string, unknown>;
}

function cleanValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 255) : null;
}

function extractHostname(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname || null;
  } catch {
    return null;
  }
}

function deriveTrafficSource(params: {
  sourceHost: string | null;
  utmMedium: string | null;
  attributionKind: AttributionKind;
}): string {
  const { sourceHost, utmMedium, attributionKind } = params;
  const medium = utmMedium?.toLowerCase() ?? null;
  const host = sourceHost?.toLowerCase() ?? null;

  if (attributionKind === "affiliate") return "affiliate";
  if (attributionKind === "advocate") return "advocate";
  if (medium === "affiliate") return "affiliate";
  if (medium === "advocate") return "advocate";
  if (medium === "email") return "email";
  if (host) {
    if (/(google|bing|yahoo|duckduckgo)\./.test(host)) return "organic_search";
    if (/(instagram|facebook|tiktok|youtube|x\.com|twitter|twitch)\./.test(host)) return "social";
    return "referral";
  }
  return "direct";
}

export async function buildDivinerTrackingContext(params: {
  request: NextRequest;
  referrer?: string | null;
  search?: string | null;
}) {
  const { request } = params;
  const referrer = cleanValue(params.referrer ?? null);
  const sourceHost = extractHostname(referrer);
  const parsedSearch = typeof params.search === "string"
    ? new URLSearchParams(params.search.startsWith("?") ? params.search.slice(1) : params.search)
    : new URLSearchParams();

  const utmSource = cleanValue(parsedSearch.get("utm_source"));
  const utmMedium = cleanValue(parsedSearch.get("utm_medium"));
  const utmCampaign = cleanValue(parsedSearch.get("utm_campaign"));
  const referralCode = cleanValue(parsedSearch.get("ref"));
  const countryCode = cleanValue(request.headers.get("x-vercel-ip-country"));
  const countryRegion = cleanValue(request.headers.get("x-vercel-ip-country-region"));
  const city = cleanValue(request.headers.get("x-vercel-ip-city"));

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const userAgent = request.headers.get("user-agent") ?? null;

  const admin = createAdminClient();

  let attributionKind: AttributionKind = "organic";
  let affiliateRelated = false;
  let advocateRelated = false;

  if (referralCode) {
    // Post-System-A: referral codes come from affiliate_campaigns.campaign_code.
    // Legacy advocate (social_advocates.referral_code) + legacy affiliates table
    // are kept for backward-compat with existing referral links.
    const [{ data: advocate }, { data: legacyAffiliate }, { data: divinerAffiliateCampaign }] =
      await Promise.all([
        admin
          .from("social_advocates")
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle(),
        admin
          .from("affiliates")
          .select("id")
          .eq("referral_code", referralCode)
          .eq("is_active", true)
          .maybeSingle(),
        admin
          .from("affiliate_campaigns")
          .select("id")
          .eq("campaign_code", referralCode)
          .eq("owner_type", "affiliate")
          .eq("status", "active")
          .maybeSingle(),
      ]);

    if (advocate) {
      attributionKind = "advocate";
      advocateRelated = true;
    } else if (legacyAffiliate || divinerAffiliateCampaign) {
      attributionKind = "affiliate";
      affiliateRelated = true;
    } else {
      attributionKind = "unknown";
    }
  } else if ((utmMedium ?? "").toLowerCase() === "advocate") {
    attributionKind = "advocate";
    advocateRelated = true;
  } else if ((utmMedium ?? "").toLowerCase() === "affiliate") {
    attributionKind = "affiliate";
    affiliateRelated = true;
  }

  const trafficSource = deriveTrafficSource({
    sourceHost,
    utmMedium,
    attributionKind,
  });

  return {
    referrer,
    sourceHost,
    utmSource,
    utmMedium,
    utmCampaign,
    referralCode,
    attributionKind,
    affiliateRelated,
    advocateRelated,
    trafficSource,
    countryCode,
    countryRegion,
    city,
    userAgent,
    ipHash,
  };
}

export async function trackDivinerActivityEvent(params: TrackDivinerActivityParams) {
  const admin = createAdminClient();
  const tracking = await buildDivinerTrackingContext({
    request: params.request,
    referrer: params.referrer,
    search: params.search,
  });

  return admin.from("diviner_activity_events").insert({
    diviner_id: params.divinerId,
    activity_type: params.activityType,
    path: params.path ?? null,
    referrer: tracking.referrer,
    user_agent: tracking.userAgent,
    ip_hash: tracking.ipHash,
    source_host: tracking.sourceHost,
    traffic_source: tracking.trafficSource,
    referral_code: tracking.referralCode,
    attribution_kind: tracking.attributionKind,
    country_code: tracking.countryCode,
    country_region: tracking.countryRegion,
    city: tracking.city,
    metadata: params.metadata ?? {},
  });
}
