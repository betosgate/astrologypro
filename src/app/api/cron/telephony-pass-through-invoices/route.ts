import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { createTelephonyPassThroughInvoices } from "@/lib/telephony-billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  try {
    const result = await createTelephonyPassThroughInvoices();
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[cron/telephony-pass-through-invoices]", error);
    return NextResponse.json(
      { error: "Failed to create telephony pass-through invoices." },
      { status: 500 }
    );
  }
}
