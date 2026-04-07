import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/affiliate/dashboard
// Returns KPI stats for the authenticated affiliate user
// Looks up diviner_affiliates.user_id = auth.uid()
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  // Look up affiliate record
  const { data: affiliate, error: affError } = await admin
    .from("diviner_affiliates")
    .select("id, name, email, diviner_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (affError) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: affError.message },
      { status: 500 }
    );
  }

  if (!affiliate) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Affiliate record not found", status: 404 },
      { status: 404 }
    );
  }

  // Aggregate clicks from the denormalized counts on referral links
  const { data: linkRows } = await admin
    .from("affiliate_referral_links")
    .select("clicks")
    .eq("affiliate_id", affiliate.id);

  const totalClicks = (linkRows ?? []).reduce((sum, l) => sum + Number(l.clicks ?? 0), 0);

  // Aggregate commissions
  const { data: commissionRows } = await admin
    .from("affiliate_commissions")
    .select("commission_amount_cents, status")
    .eq("affiliate_id", affiliate.id);

  let pendingCommissionCents = 0;
  let approvedCommissionCents = 0;
  let totalPaidCents = 0;
  let totalConversions = 0;

  (commissionRows ?? []).forEach((row) => {
    const amount = Number(row.commission_amount_cents);
    totalConversions++;
    if (row.status === "pending" || row.status === "on_hold") pendingCommissionCents += amount;
    else if (row.status === "approved") approvedCommissionCents += amount;
    else if (row.status === "paid") totalPaidCents += amount;
  });

  // Top 3 performing links (by click count)
  const { data: topLinks } = await admin
    .from("affiliate_referral_links")
    .select("id, slug, clicks, conversions, is_active")
    .eq("affiliate_id", affiliate.id)
    .order("clicks_count", { ascending: false })
    .limit(3);

  return NextResponse.json({
    affiliate: {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email,
      status: affiliate.status,
    },
    kpis: {
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      pending_commission_cents: pendingCommissionCents,
      approved_commission_cents: approvedCommissionCents,
      total_paid_cents: totalPaidCents,
    },
    top_links: topLinks ?? [],
  });
}
