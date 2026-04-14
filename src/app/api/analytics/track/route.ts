import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildDivinerTrackingContext,
  trackDivinerActivityEvent,
} from "@/lib/diviner-analytics";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { divinerId, path, referrer, search } = body;

    if (!divinerId || !path) {
      return NextResponse.json(
        { error: "Missing divinerId or path" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const tracking = await buildDivinerTrackingContext({
      request,
      referrer: typeof referrer === "string" ? referrer : null,
      search: typeof search === "string" ? search : null,
    });

    await admin.from("page_views").insert({
      diviner_id: divinerId,
      path,
      referrer: tracking.referrer,
      user_agent: tracking.userAgent,
      ip_hash: tracking.ipHash,
      country_code: tracking.countryCode,
      country_region: tracking.countryRegion,
      city: tracking.city,
      source_host: tracking.sourceHost,
      traffic_source: tracking.trafficSource,
      utm_source: tracking.utmSource,
      utm_medium: tracking.utmMedium,
      utm_campaign: tracking.utmCampaign,
      referral_code: tracking.referralCode,
      attribution_kind: tracking.attributionKind,
      affiliate_related: tracking.affiliateRelated,
      advocate_related: tracking.advocateRelated,
    });

    await trackDivinerActivityEvent({
      divinerId,
      activityType: "page_view",
      path,
      referrer: typeof referrer === "string" ? referrer : null,
      search: typeof search === "string" ? search : null,
      request,
      metadata: { source: "page_tracker" },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
