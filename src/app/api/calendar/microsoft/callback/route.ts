import { NextRequest, NextResponse } from "next/server";
import { handleMsOAuthCallback } from "@/lib/microsoft-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const code = sp.get("code");
  const divinerId = sp.get("state");
  const error = sp.get("error");

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  if (error || !code || !divinerId) {
    return NextResponse.redirect(`${base}/dashboard/settings?calendar=outlook_error`);
  }

  try {
    await handleMsOAuthCallback(code, divinerId);
    return NextResponse.redirect(`${base}/dashboard/settings?calendar=outlook_connected`);
  } catch {
    return NextResponse.redirect(`${base}/dashboard/settings?calendar=outlook_error`);
  }
}
