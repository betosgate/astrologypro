import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Cron — deletes expired booking_holds rows.
 * Runs every 5 minutes via Vercel Cron.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const { error, count } = await admin
    .from("booking_holds")
    .delete({ count: "exact" })
    .lt("expires_at", new Date().toISOString());

  if (error) {
    console.error("[release-holds]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ released: count ?? 0 });
}
