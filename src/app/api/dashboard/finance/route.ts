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

  let ledgerQuery = admin
    .from("revenue_ledger_entries")
    .select(
      "id, source_type, source_reference, gross_amount_cents, platform_fee_cents, affiliate_commission_cents, diviner_gross_amount_cents, diviner_net_amount_cents, recognized_at, metadata"
    )
    .eq("diviner_id", diviner.id);

  let refundQuery = admin
    .from("bookings")
    .select("id, refund_amount, refunded_at, refund_reason, scheduled_at")
    .eq("diviner_id", diviner.id)
    .not("refunded_at", "is", null);

  if (dateAfter) {
    ledgerQuery = ledgerQuery.gte("recognized_at", dateAfter);
    refundQuery = refundQuery.gte("refunded_at", dateAfter);
  }

  const [{ data: ledgerRows, error: ledgerError }, { data: refundRows, error: refundError }] =
    await Promise.all([
      ledgerQuery.order("recognized_at", { ascending: false }).limit(200),
      refundQuery.order("refunded_at", { ascending: false }).limit(200),
    ]);

  if (ledgerError) {
    return NextResponse.json({ error: ledgerError.message }, { status: 500 });
  }

  if (refundError) {
    return NextResponse.json({ error: refundError.message }, { status: 500 });
  }

  const rows = ledgerRows ?? [];
  const refunds = refundRows ?? [];

  const summary = {
    grossRevenue: rows.reduce((sum, row) => sum + Number(row.gross_amount_cents ?? 0), 0) / 100,
    platformFees: rows.reduce((sum, row) => sum + Number(row.platform_fee_cents ?? 0), 0) / 100,
    affiliateCommissions:
      rows.reduce((sum, row) => sum + Number(row.affiliate_commission_cents ?? 0), 0) / 100,
    divinerGross:
      rows.reduce((sum, row) => sum + Number(row.diviner_gross_amount_cents ?? 0), 0) / 100,
    divinerNet:
      rows.reduce((sum, row) => sum + Number(row.diviner_net_amount_cents ?? 0), 0) / 100,
    refundsTotal: refunds.reduce((sum, row) => sum + Number(row.refund_amount ?? 0), 0),
    refundsCount: refunds.length,
    eventsCount: rows.length,
  };

  const monthlyMap = new Map<
    string,
    {
      grossRevenue: number;
      divinerNet: number;
      affiliateCommissions: number;
    }
  >();

  for (const row of rows) {
    const date = new Date(row.recognized_at as string);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key) ?? {
      grossRevenue: 0,
      divinerNet: 0,
      affiliateCommissions: 0,
    };
    existing.grossRevenue += Number(row.gross_amount_cents ?? 0) / 100;
    existing.divinerNet += Number(row.diviner_net_amount_cents ?? 0) / 100;
    existing.affiliateCommissions += Number(row.affiliate_commission_cents ?? 0) / 100;
    monthlyMap.set(key, existing);
  }

  const monthly = Array.from(monthlyMap.entries())
    .map(([month, value]) => ({
      month,
      grossRevenue: Math.round(value.grossRevenue * 100) / 100,
      divinerNet: Math.round(value.divinerNet * 100) / 100,
      affiliateCommissions: Math.round(value.affiliateCommissions * 100) / 100,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const recentActivity = rows.slice(0, 12).map((row) => ({
    id: row.id,
    sourceType: row.source_type,
    sourceReference: row.source_reference,
    recognizedAt: row.recognized_at,
    grossRevenue: Number(row.gross_amount_cents ?? 0) / 100,
    platformFees: Number(row.platform_fee_cents ?? 0) / 100,
    affiliateCommissions: Number(row.affiliate_commission_cents ?? 0) / 100,
    divinerNet: Number(row.diviner_net_amount_cents ?? 0) / 100,
  }));

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
    refunds: refunds.slice(0, 12).map((row) => ({
      id: row.id,
      refundedAt: row.refunded_at,
      refundAmount: Number(row.refund_amount ?? 0),
      refundReason: row.refund_reason,
      scheduledAt: row.scheduled_at,
    })),
    recentActivity,
  });
}
