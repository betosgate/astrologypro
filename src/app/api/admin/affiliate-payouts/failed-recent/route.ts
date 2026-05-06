import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/affiliate-payouts/failed-recent
 *
 * Lists affiliate_payouts rows with status='failed' from the last 7 days.
 * Surfaced on /admin/reports/finance-ops via the FailedPayoutsWidget so
 * ops sees broken transfers without scrolling through every payout.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/09-notifications-and-integrations.md
 */
export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await admin
    .from("affiliate_payouts")
    .select(
      "id, affiliate_account_id, stripe_account_id, ripe_total_cents, offset_applied_cents, net_transferred_cents, failure_reason, blocked_reason, created_at, transferred_at",
    )
    .eq("status", "failed")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
