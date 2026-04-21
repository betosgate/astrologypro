import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleOAuthCallback } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // "<role>:<ownerId>" or legacy bare ownerId
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Decode role from state so admin and diviner land back on their own surface.
  // Legacy bare uuids (no ":" prefix) are treated as diviner for backwards compat.
  const role: "admin" | "diviner" =
    state && state.startsWith("admin:") ? "admin" : "diviner";
  const connectionsPath =
    role === "admin"
      ? "/admin/calendar-connections"
      : "/dashboard/calendar-connections";

  if (error) {
    return NextResponse.redirect(
      new URL(`${connectionsPath}?calendar=error&reason=${error}`, baseUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${connectionsPath}?calendar=error&reason=missing_params`, baseUrl)
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
    console.log("[Google OAuth] Success for state:", state);
    return NextResponse.redirect(
      new URL(`${connectionsPath}?calendar=connected`, baseUrl)
    );
  } catch (err: any) {
    console.error("[Google OAuth] Callback failed:", err);
    return NextResponse.redirect(
      new URL(`${connectionsPath}?calendar=error&reason=${encodeURIComponent(err.message)}`, baseUrl)
    );
  }
}
