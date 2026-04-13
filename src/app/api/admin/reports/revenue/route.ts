import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DivinerRevenue {
  divinerId: string;
  divinerName: string;
  revenue: number;
  bookings: number;
  avgPrice: number;
}

interface ServiceRevenue {
  category: string;
  revenue: number;
  bookings: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

interface RevenueSummary {
  totalRevenue: number;
  totalEvents: number;
  avgEventValue: number;
  platformFees: number;
  platformNetRevenue: number;
  affiliateCommissions: number;
  divinerGrossPayouts: number;
  divinerPayouts: number;
  platformShareRatio: number;
  divinerShareRatio: number;
  affiliateShareRatio: number;
}

export interface RevenueResponse {
  summary: RevenueSummary;
  byDiviner: DivinerRevenue[];
  byService: ServiceRevenue[];
  monthly: MonthlyRevenue[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type Period = "30d" | "90d" | "1y" | "all";

function periodToDate(period: Period): string | null {
  if (period === "all") return null;
  const now = new Date();
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return start.toISOString();
}

// ─── GET /api/admin/reports/revenue ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      {
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Admin access required",
      },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") ?? "90d") as Period;
  if (!["30d", "90d", "1y", "all"].includes(period)) {
    return Response.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Invalid period",
        status: 422,
        detail: "period must be one of: 30d, 90d, 1y, all",
      },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const dateAfter = periodToDate(period);

  // ── Fetch monetized revenue ledger entries ────────────────────────────────
  let query = admin
    .from("revenue_ledger_entries")
    .select(
      `id, source_type, gross_amount_cents, platform_fee_cents, platform_net_amount_cents, affiliate_commission_cents, diviner_gross_amount_cents, diviner_net_amount_cents, recognized_at, diviner_id,
       diviners(id, display_name)`,
    );

  if (dateAfter) {
    query = query.gte("recognized_at", dateAfter);
  }

  const { data: ledgerEntries, error } = await query
    .order("recognized_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("[admin/reports/revenue] query error:", error);
    return Response.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Query failed",
        status: 500,
        detail: error.message,
      },
      { status: 500 },
    );
  }

  const rows = ledgerEntries ?? [];

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalRevenue = rows.reduce(
    (sum, row) => sum + (Number(row.gross_amount_cents) || 0) / 100,
    0,
  );
  const totalEvents = rows.length;
  const avgEventValue = totalEvents > 0 ? totalRevenue / totalEvents : 0;
  const platformFees = rows.reduce(
    (sum, row) => sum + (Number(row.platform_fee_cents) || 0) / 100,
    0,
  );
  const platformNetRevenue = rows.reduce(
    (sum, row) => sum + (Number(row.platform_net_amount_cents) || 0) / 100,
    0,
  );
  const affiliateCommissions = rows.reduce(
    (sum, row) => sum + (Number(row.affiliate_commission_cents) || 0) / 100,
    0,
  );
  const divinerGrossPayouts = rows.reduce(
    (sum, row) => sum + (Number(row.diviner_gross_amount_cents) || 0) / 100,
    0,
  );
  const divinerPayouts = rows.reduce(
    (sum, row) => sum + (Number(row.diviner_net_amount_cents) || 0) / 100,
    0,
  );

  const summary: RevenueSummary = {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalEvents,
    avgEventValue: Math.round(avgEventValue * 100) / 100,
    platformFees: Math.round(platformFees * 100) / 100,
    platformNetRevenue: Math.round(platformNetRevenue * 100) / 100,
    affiliateCommissions: Math.round(affiliateCommissions * 100) / 100,
    divinerGrossPayouts: Math.round(divinerGrossPayouts * 100) / 100,
    divinerPayouts: Math.round(divinerPayouts * 100) / 100,
    platformShareRatio: totalRevenue > 0 ? platformNetRevenue / totalRevenue : 0,
    divinerShareRatio: totalRevenue > 0 ? divinerPayouts / totalRevenue : 0,
    affiliateShareRatio: totalRevenue > 0 ? affiliateCommissions / totalRevenue : 0,
  };

  // ── By Diviner ────────────────────────────────────────────────────────────
  const divinerMap = new Map<
    string,
    { name: string; revenue: number; bookings: number }
  >();
  for (const b of rows) {
    const diviner = b.diviners as unknown as {
      id: string;
      display_name: string;
    } | null;
    if (!diviner?.id) continue;
    const key = diviner.id;
    const existing = divinerMap.get(key);
    const amount = (Number(b.gross_amount_cents) || 0) / 100;
    if (existing) {
      existing.revenue += amount;
      existing.bookings += 1;
    } else {
      divinerMap.set(key, {
        name: diviner.display_name ?? "Unknown",
        revenue: amount,
        bookings: 1,
      });
    }
  }
  const byDiviner: DivinerRevenue[] = Array.from(divinerMap.entries())
    .map(([divinerId, d]) => ({
      divinerId,
      divinerName: d.name,
      revenue: Math.round(d.revenue * 100) / 100,
      bookings: d.bookings,
      avgPrice: Math.round((d.revenue / d.bookings) * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── By Service Category ───────────────────────────────────────────────────
  const serviceMap = new Map<string, { revenue: number; bookings: number }>();
  for (const b of rows) {
    const cat =
      b.source_type === "weekly_subscription_invoice"
        ? "weekly_subscription"
        : (b.source_type as string) ?? "unknown";
    const existing = serviceMap.get(cat);
    const amount = (Number(b.gross_amount_cents) || 0) / 100;
    if (existing) {
      existing.revenue += amount;
      existing.bookings += 1;
    } else {
      serviceMap.set(cat, { revenue: amount, bookings: 1 });
    }
  }
  const byService: ServiceRevenue[] = Array.from(serviceMap.entries())
    .map(([category, d]) => ({
      category,
      revenue: Math.round(d.revenue * 100) / 100,
      bookings: d.bookings,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Monthly ───────────────────────────────────────────────────────────────
  const monthMap = new Map<string, { revenue: number; bookings: number }>();
  for (const b of rows) {
    const date = new Date(b.recognized_at as string);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(month);
    const amount = (Number(b.gross_amount_cents) || 0) / 100;
    if (existing) {
      existing.revenue += amount;
      existing.bookings += 1;
    } else {
      monthMap.set(month, { revenue: amount, bookings: 1 });
    }
  }
  const monthly: MonthlyRevenue[] = Array.from(monthMap.entries())
    .map(([month, d]) => ({
      month,
      revenue: Math.round(d.revenue * 100) / 100,
      bookings: d.bookings,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const response: RevenueResponse = {
    summary,
    byDiviner,
    byService,
    monthly,
  };

  return Response.json(response);
}
