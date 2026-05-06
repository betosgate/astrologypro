import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodCutoffIso } from "@/lib/affiliate-analytics-period";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/affiliate-analytics/velocity?period=...
 * Buckets the converted_at→paid_at delta into <1d / 1-2d / 2-3d / 3-7d /
 * 7-14d / 14d+ via the affiliate_payout_velocity_histogram RPC.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/03-admin-analytics.md
 */
export async function GET(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const { period, cutoff } = periodCutoffIso(url.searchParams.get("period"));

  const admin = createAdminClient();
  const { data, error } = await admin.rpc(
    "affiliate_payout_velocity_histogram",
    { p_cutoff: cutoff },
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ period, cutoff, buckets: data ?? [] });
}
