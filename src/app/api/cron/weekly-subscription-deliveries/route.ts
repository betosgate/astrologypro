import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { processScheduledWeeklyDeliveries } from "@/lib/weekly-deliveries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  try {
    const result = await processScheduledWeeklyDeliveries();
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[cron/weekly-subscription-deliveries]", error);
    return NextResponse.json(
      { error: "Failed to process weekly subscription deliveries." },
      { status: 500 }
    );
  }
}
