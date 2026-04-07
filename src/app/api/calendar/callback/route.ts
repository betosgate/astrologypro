import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // divinerId
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?calendar=error&reason=${error}`, baseUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?calendar=error&reason=missing_params", baseUrl)
    );
  }

  try {
    await handleOAuthCallback(code, state);
    return NextResponse.redirect(
      new URL("/dashboard/settings?calendar=connected", baseUrl)
    );
  } catch (err) {
    console.error("Google Calendar OAuth callback failed:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?calendar=error&reason=token_exchange", baseUrl)
    );
  }
}
