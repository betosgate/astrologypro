import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/performance/cohort
 * Own-affiliate referred-client retention (30d / 90d) by cohort month.
 * Reads via affiliate_own_cohort_retention RPC.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/01-affiliate-performance.md
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) {
    return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });
  }

  const { data, error } = await admin.rpc("affiliate_own_cohort_retention", {
    p_affiliate_account_id: (affiliate as { id: string }).id,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ cohorts: data ?? [] });
}
