import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeAffiliatePayouts } from "@/lib/affiliate-payout-execution";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/affiliate-payouts/trigger
 * Body: { affiliate_account_id: string }
 *
 * Manually triggers the payout pass for one affiliate, outside the cron
 * cadence. Honors the kill-switch (will run dry-run if disabled).
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/07-admin-ui.md
 */
export async function POST(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }
  const affiliateAccountId =
    typeof (body as { affiliate_account_id?: unknown }).affiliate_account_id === "string"
      ? (body as { affiliate_account_id: string }).affiliate_account_id.trim()
      : "";
  if (!affiliateAccountId) {
    return NextResponse.json(
      { error: "affiliate_account_id is required" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  try {
    const result = await executeAffiliatePayouts({
      admin,
      onlyAffiliateAccountId: affiliateAccountId,
      triggerSource: "admin_manual",
      triggeredBy: adminUser.id,
      affiliateBatchSize: 1,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
