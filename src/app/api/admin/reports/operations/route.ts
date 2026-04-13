import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Period = "7d" | "30d" | "90d";

function periodToDate(period: Period): string {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Admin access required" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") ?? "30d") as Period;
  if (!["7d", "30d", "90d"].includes(period)) {
    return Response.json(
      { type: "https://httpstatuses.com/422", title: "Invalid period", status: 422, detail: "period must be one of: 7d, 30d, 90d" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const since = periodToDate(period);
  const now = new Date().toISOString();

  const [
    failedDeliveriesResult,
    overdueDeliveriesResult,
    subscriptionIssuesResult,
    unbilledTelephonyResult,
    pendingAffiliateResult,
  ] = await Promise.all([
    admin
      .from("weekly_subscription_deliveries")
      .select("id, diviner_id, subject, scheduled_for, failed_at, last_error, failed_recipient_count, diviners(display_name, username)")
      .eq("status", "failed")
      .gte("created_at", since)
      .order("failed_at", { ascending: false })
      .limit(25),
    admin
      .from("weekly_subscription_deliveries")
      .select("id, diviner_id, subject, scheduled_for, diviners(display_name, username)")
      .eq("status", "scheduled")
      .lt("scheduled_for", now)
      .gte("created_at", since)
      .order("scheduled_for", { ascending: true })
      .limit(25),
    admin
      .from("weekly_subscription_subscribers")
      .select("id, diviner_id, email, status, current_period_end, diviners(display_name, username)")
      .in("status", ["past_due", "unpaid"])
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(50),
    admin
      .from("telephony_usage_records")
      .select("id, diviner_id, total_cost_cents, currency, created_at, diviners(display_name, username)")
      .is("billed_at", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("affiliate_commissions")
      .select("id, affiliate_id, diviner_id, commission_amount_cents, status, created_at, diviner_affiliates(name, email), diviners(display_name, username)")
      .in("status", ["pending", "approved"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const failedDeliveries = failedDeliveriesResult.data ?? [];
  const overdueDeliveries = overdueDeliveriesResult.data ?? [];
  const subscriptionIssues = subscriptionIssuesResult.data ?? [];
  const unbilledTelephony = unbilledTelephonyResult.data ?? [];
  const pendingAffiliate = pendingAffiliateResult.data ?? [];

  const telephonyByDiviner = new Map<string, { divinerName: string; username: string | null; usageCount: number; totalCostCents: number }>();
  for (const row of unbilledTelephony) {
    const diviner = row.diviners as { display_name?: string | null; username?: string | null } | null;
    const key = row.diviner_id ?? "unknown";
    const current = telephonyByDiviner.get(key) ?? {
      divinerName: diviner?.display_name ?? "Unknown diviner",
      username: diviner?.username ?? null,
      usageCount: 0,
      totalCostCents: 0,
    };
    current.usageCount += 1;
    current.totalCostCents += Number(row.total_cost_cents ?? 0);
    telephonyByDiviner.set(key, current);
  }

  const affiliateByDiviner = new Map<string, { divinerName: string; username: string | null; commissionCount: number; pendingAmountCents: number }>();
  for (const row of pendingAffiliate) {
    const diviner = row.diviners as { display_name?: string | null; username?: string | null } | null;
    const key = row.diviner_id ?? "unknown";
    const current = affiliateByDiviner.get(key) ?? {
      divinerName: diviner?.display_name ?? "Unknown diviner",
      username: diviner?.username ?? null,
      commissionCount: 0,
      pendingAmountCents: 0,
    };
    current.commissionCount += 1;
    current.pendingAmountCents += Number(row.commission_amount_cents ?? 0);
    affiliateByDiviner.set(key, current);
  }

  return Response.json({
    summary: {
      failedDeliveries: failedDeliveries.length,
      overdueDeliveries: overdueDeliveries.length,
      subscriptionIssues: subscriptionIssues.length,
      unbilledTelephonyCount: unbilledTelephony.length,
      unbilledTelephonyCostCents: unbilledTelephony.reduce((sum, row) => sum + Number(row.total_cost_cents ?? 0), 0),
      pendingAffiliateCommissions: pendingAffiliate.length,
      pendingAffiliateAmountCents: pendingAffiliate.reduce((sum, row) => sum + Number(row.commission_amount_cents ?? 0), 0),
    },
    failedDeliveries,
    overdueDeliveries,
    subscriptionIssues,
    unbilledTelephonyByDiviner: Array.from(telephonyByDiviner.entries()).map(([divinerId, value]) => ({ divinerId, ...value })),
    pendingAffiliateByDiviner: Array.from(affiliateByDiviner.entries()).map(([divinerId, value]) => ({ divinerId, ...value })),
  });
}
