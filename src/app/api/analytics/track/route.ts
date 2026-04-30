import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildDivinerTrackingContext,
  trackDivinerActivityEvent,
} from "@/lib/diviner-analytics";
import { resolveAffiliateFromRef } from "@/lib/affiliate-attribution";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { divinerId, path, referrer, search, refCode } = body;

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

    // V2 affiliate attribution. `refCode` comes verbatim from the
    // landing-page tracker. We still persist it even when it's malformed
    // or doesn't resolve, so the raw value is available for debugging;
    // affiliate_id / affiliate_type stay NULL in those cases.
    const rawRefCode =
      typeof refCode === "string" && refCode.length > 0
        ? refCode.slice(0, 256)
        : null;
    let affiliateId: string | null = null;
    let affiliateType: "social_advocate" | "diviner_affiliate" | null = null;
    if (rawRefCode) {
      try {
        const resolved = await resolveAffiliateFromRef(admin, rawRefCode);
        if (resolved) {
          // Phase 1.5: page_views.affiliate_type CHECK only accepts
          // 'diviner_affiliate' / 'social_advocate'. General campaigns
          // would 23514 the insert; record them as untracked here. (No
          // page_views CHECK migration in this sprint — tracker degrades
          // silently for general; per-diviner attribution unchanged.)
          if (resolved.owner_affiliate_type === "general") {
            affiliateId = null;
            affiliateType = null;
          } else {
            affiliateId = resolved.owner_affiliate_id;
            affiliateType = resolved.owner_affiliate_type;
          }
        }
      } catch {
        // Never let affiliate resolution break page-view tracking.
      }
    }

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
      ref_code: rawRefCode,
      affiliate_id: affiliateId,
      affiliate_type: affiliateType,
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
