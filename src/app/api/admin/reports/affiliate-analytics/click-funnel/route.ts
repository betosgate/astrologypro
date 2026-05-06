import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/affiliate-analytics/click-funnel?period=...
 * 3-step funnel: clicks → conversions → paid.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/04-funnel-cohort.md
 */
export async function GET(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const { period, cutoff } = periodCutoffIso(url.searchParams.get("period"));

  const admin = createAdminClient();

  const { count: clicks } = await admin
    .from("campaign_clicks")
    .select("id", { count: "exact", head: true })
    .eq("is_bot", false)
    .gte("clicked_at", cutoff);

  const { count: conversions } = await admin
    .from("campaign_conversions")
    .select("id", { count: "exact", head: true })
    .gte("converted_at", cutoff)
    .is("reversed_at", null);

  const { count: paid } = await admin
    .from("campaign_conversions")
    .select("id", { count: "exact", head: true })
    .eq("payout_status", "paid")
    .gte("paid_at", cutoff);

  const cl = clicks ?? 0;
  const co = conversions ?? 0;
  const pa = paid ?? 0;

  return NextResponse.json({
    period,
    cutoff,
    steps: [
      { name: "Clicks (non-bot)", count: cl },
      { name: "Conversions", count: co },
      { name: "Paid", count: pa },
    ],
    rates: {
      clickToConversion: cl > 0 ? co / cl : 0,
      conversionToPaid: co > 0 ? pa / co : 0,
    },
  });
}
