// migrated-to-canonical-accounts: 2026-04-23
// GET /api/affiliate/dashboard — KPI summary for the authenticated affiliate.
// Aggregates across ALL their diviner partnerships (Task 05).
//
// Sprint: docs/tasks/2026-04-23/affiliate-identity-refactor/05-affiliate-portal.md

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAffiliateForCaller } from "@/lib/affiliate-accounts";
import { isAffiliateIdentityV2Enabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail?: string) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

export async function GET() {
  if (!isAffiliateIdentityV2Enabled()) return problem(503, "Feature not available");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return problem(401, "Unauthorized");

  const admin = createAdminClient();
  const ctx = await resolveAffiliateForCaller(admin, user.id);
  if (!ctx) return problem(403, "Not an active affiliate");

  const { account, junctionIds } = ctx;

  // Zero-partnership affiliate: short-circuit with empty KPIs
  if (junctionIds.length === 0) {
    return NextResponse.json({
      affiliate: {
        id: account.id,
        name: account.name,
        email: account.email,
        status: account.status,
      },
      kpis: {
        total_clicks: 0,
        total_conversions: 0,
        pending_commission_cents: 0,
        approved_commission_cents: 0,
        total_paid_cents: 0,
      },
      partnership_count: 0,
      top_links: [],
    });
  }

  // Aggregate clicks + commissions + links across all junctions
  const [{ data: linkRows }, { data: commissionRows }, { data: topLinks }] = await Promise.all([
    admin
      .from("affiliate_referral_links")
      .select("clicks")
      .in("affiliate_id", junctionIds),
    admin
      .from("affiliate_commissions")
      .select("commission_amount_cents, status")
      .in("affiliate_id", junctionIds),
    admin
      .from("affiliate_referral_links")
      .select("id, slug, clicks, conversions, is_active, affiliate_id")
      .in("affiliate_id", junctionIds)
      .order("clicks", { ascending: false })
      .limit(5),
  ]);

  const totalClicks = (linkRows ?? []).reduce(
    (sum, l) => sum + Number(l.clicks ?? 0),
    0,
  );

  let pendingCents = 0;
  let approvedCents = 0;
  let paidCents = 0;
  let totalConversions = 0;
  for (const row of commissionRows ?? []) {
    const amount = Number(row.commission_amount_cents ?? 0);
    totalConversions++;
    if (row.status === "pending" || row.status === "on_hold") pendingCents += amount;
    else if (row.status === "approved") approvedCents += amount;
    else if (row.status === "paid") paidCents += amount;
  }

  return NextResponse.json({
    affiliate: {
      id: account.id,
      name: account.name,
      email: account.email,
      status: account.status,
    },
    kpis: {
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      pending_commission_cents: pendingCents,
      approved_commission_cents: approvedCents,
      total_paid_cents: paidCents,
    },
    partnership_count: junctionIds.length,
    top_links: topLinks ?? [],
  });
}
