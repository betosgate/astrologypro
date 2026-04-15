import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/cron/settlement-sweep
 *
 * Runs daily at 4am. Updates revenue_ledger_entries from 'pending' to 'settled'
 * where recognized_at is older than 3 days. Uses a raw RPC call to avoid
 * Supabase client row-count limitations on UPDATE.
 *
 * Logs run to cron_run_log.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const admin = createAdminClient();
  const jobName = "settlement-sweep";
  const startedAt = new Date().toISOString();

  const { data: runLog } = await admin
    .from("cron_run_log")
    .insert({ job_name: jobName, started_at: startedAt, status: "running" })
    .select("id")
    .single();
  const runLogId = runLog?.id ?? null;

  try {
    // Update pending entries older than 3 days to settled.
    // Supabase client UPDATE returns affected rows via count when using
    // { count: 'exact' } option.
    const cutoff = new Date(Date.now() - 3 * 86_400_000).toISOString();

    const { count, error } = await admin
      .from("revenue_ledger_entries")
      .update(
        { settlement_status: "settled", settled_at: new Date().toISOString() },
        { count: "exact" }
      )
      .eq("settlement_status", "pending")
      .lt("recognized_at", cutoff);

    if (error) throw new Error(error.message);

    const settled = count ?? 0;
    console.log(`[settlement-sweep] settled=${settled}`);

    const result = { settled };

    if (runLogId) {
      await admin
        .from("cron_run_log")
        .update({ finished_at: new Date().toISOString(), status: "success", result })
        .eq("id", runLogId);
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[settlement-sweep] fatal:", message);

    if (runLogId) {
      await admin
        .from("cron_run_log")
        .update({
          finished_at: new Date().toISOString(),
          status: "error",
          error_message: message,
        })
        .eq("id", runLogId);
    }

    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Internal Server Error",
        status: 500,
        detail: message,
      },
      { status: 500 }
    );
  }
}
