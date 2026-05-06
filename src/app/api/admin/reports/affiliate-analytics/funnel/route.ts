import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/affiliate-analytics/funnel?period=...
 * 5-step affiliate-onboarding funnel:
 *   Invited → Accepted → Stripe Connected → First Conversion → First Payout
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

  const { count: invited } = await admin
    .from("diviner_affiliates")
    .select("id", { count: "exact", head: true })
    .not("invited_at", "is", null)
    .gte("invited_at", cutoff);

  const { count: accepted } = await admin
    .from("diviner_affiliates")
    .select("id", { count: "exact", head: true })
    .not("accepted_at", "is", null)
    .gte("accepted_at", cutoff);

  const { count: stripeConnected } = await admin
    .from("affiliate_accounts")
    .select("id", { count: "exact", head: true })
    .eq("stripe_payouts_enabled", true);

  const { count: firstConversion } = await admin
    .from("affiliate_accounts")
    .select("id", { count: "exact", head: true })
    .not("first_conversion_at", "is", null)
    .gte("first_conversion_at", cutoff);

  const { count: firstPayout } = await admin
    .from("affiliate_accounts")
    .select("id", { count: "exact", head: true })
    .not("first_payout_at", "is", null)
    .gte("first_payout_at", cutoff);

  return NextResponse.json({
    period,
    cutoff,
    steps: [
      { name: "Invited", count: invited ?? 0 },
      { name: "Accepted", count: accepted ?? 0 },
      { name: "Stripe Connected", count: stripeConnected ?? 0 },
      { name: "First Conversion", count: firstConversion ?? 0 },
      { name: "First Payout", count: firstPayout ?? 0 },
    ],
  });
}
