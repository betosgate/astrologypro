import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  console.log("[Google OAuth] Callback received", { code: code ? "present" : "missing", state, error });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No active session found during OAuth callback.");
    }

    await handleOAuthCallback(code, state, user.id);
    console.log("[Google OAuth] Success for owner:", state);
    return NextResponse.redirect(
      new URL("/dashboard/settings?calendar=connected", baseUrl)
    );
  } catch (err: any) {
    console.error("[Google OAuth] Callback failed:", err);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?calendar=error&reason=${encodeURIComponent(err.message)}`, baseUrl)
    );
  }
}
