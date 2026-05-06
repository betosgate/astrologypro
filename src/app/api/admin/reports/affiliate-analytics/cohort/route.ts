import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/affiliate-analytics/cohort
 * Referred-client retention cohort by month, with 30/60/90/180-day
 * rebook rates. Reads via affiliate_referred_client_retention RPC.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/04-funnel-cohort.md
 */
export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc(
    "affiliate_referred_client_retention",
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cohorts = ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const cohortSize = Number(row.cohort_size as number);
    const r30 = Number(row.retained_30d as number);
    const r60 = Number(row.retained_60d as number);
    const r90 = Number(row.retained_90d as number);
    const r180 = Number(row.retained_180d as number);
    return {
      cohortMonth: row.cohort_month as string,
      cohortSize,
      retained30d: r30,
      retained60d: r60,
      retained90d: r90,
      retained180d: r180,
      pct30d: cohortSize > 0 ? r30 / cohortSize : 0,
      pct60d: cohortSize > 0 ? r60 / cohortSize : 0,
      pct90d: cohortSize > 0 ? r90 / cohortSize : 0,
      pct180d: cohortSize > 0 ? r180 / cohortSize : 0,
    };
  });

  return NextResponse.json({ cohorts });
}
