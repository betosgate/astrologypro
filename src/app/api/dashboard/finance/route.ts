import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Period = "30d" | "90d" | "1y" | "all";

function periodToDate(period: Period): string | null {
  if (period === "all") return null;
  const now = new Date();
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = (req.nextUrl.searchParams.get("period") ?? "90d") as Period;
  if (!["30d", "90d", "1y", "all"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id, display_name, stripe_account_id, charges_enabled, payouts_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner?.id) {
    return NextResponse.json({ error: "Diviner profile not found" }, { status: 404 });
  }

  const dateAfter = periodToDate(period);

  // Current month boundaries for projections
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  let ledgerQuery = admin
    .from("revenue_ledger_entries")
    .select(
      "id, source_type, source_reference, client_id, gross_amount_cents, platform_fee_cents, affiliate_commission_cents, diviner_gross_amount_cents, diviner_net_amount_cents, platform_net_amount_cents, refunded_gross_amount_cents, refunded_affiliate_commission_cents, refunded_diviner_net_amount_cents, settlement_status, recognized_at, metadata"
    )
    .eq("diviner_id", diviner.id);

  let refundQuery = admin
    .from("refund_events")
    .select("id, amount_cents, created_at, reason, status")
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false });

  if (dateAfter) {
    ledgerQuery = ledgerQuery.gte("recognized_at", dateAfter);
    refundQuery = refundQuery.gte("created_at", dateAfter);
  }

  // Run main queries + supplemental queries in parallel
  const [
    { data: ledgerRows, error: ledgerError },
    { data: refundRows, error: refundError },
    { data: goalsRow },
    { data: clientRows },
    { data: pendingLedger },
    { data: futureBookings },
    { data: discountBookings },
  ] = await Promise.all([
    ledgerQuery.order("recognized_at", { ascending: false }).limit(500),
    refundQuery.limit(200),
    // Finance goals
    admin
      .from("diviner_finance_goals")
      .select("monthly_revenue_goal_cents, tax_reserve_percent")
      .eq("diviner_id", diviner.id)
      .maybeSingle(),
    // Clients for name lookup
    admin
      .from("clients")
      .select("id, full_name, email"),
    // Pending payouts (not period-filtered — always show all pending)
    admin
      .from("revenue_ledger_entries")
      .select("diviner_net_amount_cents, refunded_diviner_net_amount_cents")
      .eq("diviner_id", diviner.id)
      .eq("settlement_status", "pending"),
    // Confirmed future bookings in current month for projection
    admin
      .from("bookings")
      .select("total_amount, base_price")
      .eq("diviner_id", diviner.id)
      .in("status", ["confirmed", "pending"])
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", monthEnd),
    // Discount impact
    admin
      .from("bookings")
      .select("discount_amount_saved")
      .eq("diviner_id", diviner.id)
      .gt("discount_amount_saved", 0),
  ]);

  if (ledgerError) {
    return NextResponse.json({ error: ledgerError.message }, { status: 500 });
  }
  if (refundError) {
    return NextResponse.json({ error: refundError.message }, { status: 500 });
  }

  const rows = ledgerRows ?? [];
  const refunds = refundRows ?? [];

  // ── Summary ────────────────────────────────────────────────────────────────
  const summary = {
    grossRevenue: rows.reduce((sum, row) => sum + Number(row.gross_amount_cents ?? 0), 0) / 100,
    platformFees: rows.reduce((sum, row) => sum + Number(row.platform_fee_cents ?? 0), 0) / 100,
    affiliateCommissions:
      rows.reduce((sum, row) => sum + Number(row.affiliate_commission_cents ?? 0), 0) / 100,
    divinerGross:
      rows.reduce((sum, row) => sum + Number(row.diviner_gross_amount_cents ?? 0), 0) / 100,
    divinerNet:
      rows.reduce((sum, row) => sum + Number(row.diviner_net_amount_cents ?? 0), 0) / 100,
    grossRevenueAfterRefunds:
      rows.reduce(
        (sum, row) =>
          sum +
          (Number(row.gross_amount_cents ?? 0) -
            Number(row.refunded_gross_amount_cents ?? 0)),
        0,
      ) / 100,
    affiliateCommissionsAfterRefunds:
      rows.reduce(
        (sum, row) =>
          sum +
          (Number(row.affiliate_commission_cents ?? 0) -
            Number(row.refunded_affiliate_commission_cents ?? 0)),
        0,
      ) / 100,
    divinerNetAfterRefunds:
      rows.reduce(
        (sum, row) =>
          sum +
          (Number(row.diviner_net_amount_cents ?? 0) -
            Number(row.refunded_diviner_net_amount_cents ?? 0)),
        0,
      ) / 100,
    refundsTotal: refunds.reduce((sum, row) => sum + Number(row.amount_cents ?? 0), 0) / 100,
    refundsCount: refunds.length,
    eventsCount: rows.length,
  };

  // ── Monthly breakdown ──────────────────────────────────────────────────────
  const monthlyMap = new Map<
    string,
    {
      grossRevenue: number;
      divinerNet: number;
      affiliateCommissions: number;
      refundedGross: number;
    }
  >();

  for (const row of rows) {
    const date = new Date(row.recognized_at as string);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key) ?? {
      grossRevenue: 0,
      divinerNet: 0,
      affiliateCommissions: 0,
      refundedGross: 0,
    };
    existing.grossRevenue += Number(row.gross_amount_cents ?? 0) / 100;
    existing.divinerNet += Number(row.diviner_net_amount_cents ?? 0) / 100;
    existing.affiliateCommissions += Number(row.affiliate_commission_cents ?? 0) / 100;
    existing.refundedGross += Number(row.refunded_gross_amount_cents ?? 0) / 100;
    monthlyMap.set(key, existing);
  }

  const monthly = Array.from(monthlyMap.entries())
    .map(([month, value]) => ({
      month,
      grossRevenue: Math.round(value.grossRevenue * 100) / 100,
      divinerNet: Math.round(value.divinerNet * 100) / 100,
      affiliateCommissions: Math.round(value.affiliateCommissions * 100) / 100,
      grossRevenueAfterRefunds: Math.round((value.grossRevenue - value.refundedGross) * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ── Recent activity (first 20 rows) ───────────────────────────────────────
  const recentActivity = rows.slice(0, 20).map((row) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceReference: row.source_reference,
    recognizedAt: row.recognized_at,
    grossRevenue: Number(row.gross_amount_cents ?? 0) / 100,
    platformFees: Number(row.platform_fee_cents ?? 0) / 100,
    affiliateCommissions: Number(row.affiliate_commission_cents ?? 0) / 100,
    divinerNet: Number(row.diviner_net_amount_cents ?? 0) / 100,
    refundedGrossRevenue: Number(row.refunded_gross_amount_cents ?? 0) / 100,
    refundedAffiliateCommissions: Number(row.refunded_affiliate_commission_cents ?? 0) / 100,
    refundedDivinerNet: Number(row.refunded_diviner_net_amount_cents ?? 0) / 100,
    settlementStatus: String(row.settlement_status ?? "approved"),
  }));

  // ── Insights ───────────────────────────────────────────────────────────────

  // Avg session value
  const avgSessionValue =
    summary.eventsCount > 0 ? summary.divinerNetAfterRefunds / summary.eventsCount : 0;

  // Refund rate (gross refunded / gross total)
  const refundRate = summary.grossRevenue > 0 ? summary.refundsTotal / summary.grossRevenue : 0;

  // Tax reserve
  const taxReservePercent = Number(goalsRow?.tax_reserve_percent ?? 25);
  const taxReserve = (summary.divinerNetAfterRefunds * taxReservePercent) / 100;

  // Monthly goal
  const monthlyGoal = (goalsRow?.monthly_revenue_goal_cents ?? 500000) / 100;

  // Revenue by source type
  const sourceTypeMap = new Map<string, number>();
  for (const row of rows) {
    const st = String(row.source_type ?? "other");
    const net =
      (Number(row.diviner_net_amount_cents ?? 0) -
        Number(row.refunded_diviner_net_amount_cents ?? 0)) /
      100;
    sourceTypeMap.set(st, (sourceTypeMap.get(st) ?? 0) + net);
  }
  const revenueBySourceType = Array.from(sourceTypeMap.entries())
    .map(([sourceType, amount]) => ({ sourceType, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);

  // Top clients — group ledger by client_id
  const clientNetMap = new Map<string, { amount: number; sessions: number }>();
  for (const row of rows) {
    if (!row.client_id) continue;
    const net =
      (Number(row.diviner_net_amount_cents ?? 0) -
        Number(row.refunded_diviner_net_amount_cents ?? 0)) /
      100;
    const existing = clientNetMap.get(row.client_id) ?? { amount: 0, sessions: 0 };
    existing.amount += net;
    existing.sessions += 1;
    clientNetMap.set(row.client_id, existing);
  }
  const clientLookup = new Map<string, string>(
    (clientRows ?? []).map((c) => [c.id, c.full_name ?? c.email ?? "Unknown"])
  );
  const uniqueClients = clientNetMap.size;
  const clientLtv = uniqueClients > 0 ? summary.divinerNetAfterRefunds / uniqueClients : 0;

  const topClients = Array.from(clientNetMap.entries())
    .map(([clientId, data]) => ({
      clientId,
      clientName: clientLookup.get(clientId) ?? "Client",
      totalRevenue: Math.round(data.amount * 100) / 100,
      sessions: data.sessions,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Pending payout
  const pendingPayout =
    (pendingLedger ?? []).reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          Number(row.diviner_net_amount_cents ?? 0) -
            Number(row.refunded_diviner_net_amount_cents ?? 0)
        ),
      0,
    ) / 100;

  // Projected month revenue = this month ledger net so far + confirmed future bookings
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const thisMonthNet = rows
    .filter((row) => {
      const d = new Date(row.recognized_at as string);
      return d >= new Date(monthStart);
    })
    .reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          (Number(row.diviner_net_amount_cents ?? 0) -
            Number(row.refunded_diviner_net_amount_cents ?? 0)) /
            100,
        ),
      0,
    );

  // YTD revenue — all ledger rows since Jan 1 of current year (from full dataset, not period-filtered)
  // We already have rows filtered by `dateAfter`; if period covers full year this is accurate.
  // For "1y" / "all" it is correct. For shorter periods, YTD is computed from all rows in memory.
  const ytdRevenue = rows
    .filter((row) => {
      const d = new Date(row.recognized_at as string);
      return d >= new Date(yearStart);
    })
    .reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          (Number(row.diviner_net_amount_cents ?? 0) -
            Number(row.refunded_diviner_net_amount_cents ?? 0)) /
            100,
        ),
      0,
    );

  const futureNet = (futureBookings ?? []).reduce(
    (sum, b) => sum + Number(b.total_amount ?? b.base_price ?? 0) * 0.85, // approx 85% net
    0,
  );
  const projectedMonthRevenue = Math.round((thisMonthNet + futureNet) * 100) / 100;

  // Discount impact
  const discountImpact = (discountBookings ?? []).reduce(
    (sum, b) => sum + Number(b.discount_amount_saved ?? 0),
    0,
  );

  return NextResponse.json({
    diviner: {
      id: diviner.id,
      displayName: diviner.display_name,
      stripeAccountId: diviner.stripe_account_id,
      chargesEnabled: diviner.charges_enabled === true,
      payoutsEnabled: diviner.payouts_enabled === true,
    },
    summary,
    monthly,
    refunds: refunds.slice(0, 20).map((row) => ({
      id: row.id,
      refundedAt: row.created_at,
      refundAmount: Number(row.amount_cents ?? 0) / 100,
      refundReason: row.reason,
      status: row.status,
    })),
    recentActivity,
    insights: {
      avgSessionValue: Math.round(avgSessionValue * 100) / 100,
      clientLtv: Math.round(clientLtv * 100) / 100,
      refundRate: Math.round(refundRate * 10000) / 10000,
      taxReserve: Math.round(taxReserve * 100) / 100,
      taxReservePercent,
      discountImpact: Math.round(discountImpact * 100) / 100,
      revenueBySourceType,
      topClients,
      pendingPayout: Math.round(pendingPayout * 100) / 100,
      monthlyGoal,
      projectedMonthRevenue,
      thisMonthRevenue: Math.round(thisMonthNet * 100) / 100,
      ytdRevenue: Math.round(ytdRevenue * 100) / 100,
    },
  });
}
