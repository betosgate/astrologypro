import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/affiliate-analytics/cron-health
 * Returns operational status of the no-show-refunds + payout cron.
 *
 * Healthy:  last tick < 30 minutes ago
 * Warning:  30–60 minutes
 * Stale:    > 60 minutes
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/03-admin-analytics.md
 */
export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Last cron-triggered payout row is the closest signal we have.
  const { data: lastPayout } = await admin
    .from("affiliate_payouts")
    .select("created_at, status")
    .eq("trigger_source", "cron")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Last no-show-resolved booking gives a signal even when no payouts
  // happened (cron still ran).
  const { data: lastNoShow } = await admin
    .from("bookings")
    .select("no_show_processed_at")
    .not("no_show_processed_at", "is", null)
    .order("no_show_processed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastTickAt =
    ((lastPayout as Record<string, unknown> | null)?.created_at as string | null) ??
    null;
  const lastNoShowAt =
    ((lastNoShow as Record<string, unknown> | null)?.no_show_processed_at as
      | string
      | null) ?? null;

  const candidate = [lastTickAt, lastNoShowAt]
    .filter((v): v is string => v != null)
    .map((v) => new Date(v).getTime());
  const mostRecent = candidate.length > 0 ? Math.max(...candidate) : null;
  const minutesSinceLastTick =
    mostRecent !== null
      ? Math.round((Date.now() - mostRecent) / 60000)
      : null;

  const { count: failedRecent } = await admin
    .from("affiliate_payouts")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  let status: "healthy" | "warning" | "stale" | "no_data" = "no_data";
  if (minutesSinceLastTick === null) status = "no_data";
  else if (minutesSinceLastTick < 30) status = "healthy";
  else if (minutesSinceLastTick < 60) status = "warning";
  else status = "stale";

  return NextResponse.json({
    status,
    lastTickAt,
    lastNoShowAt,
    minutesSinceLastTick,
    consecutiveFailures: failedRecent ?? 0,
  });
}
