import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleMsOAuthCallback, persistMsTokens } from "@/lib/microsoft-calendar";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const code = sp.get("code");
  const rawState = sp.get("state");
  const relayTokenJson = sp.get("relay_token_json");
  const error = sp.get("error");

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  // 1. Extract ownerId from state (handles both plain ID and Proxy JSON state)
  let ownerId = rawState;
  if (rawState?.startsWith("{")) {
    try {
      const parsed = JSON.parse(rawState);
      ownerId = parsed.id;
    } catch {
      // fallback to raw
    }
  }

  // 2. Handle Relay from Proxy Lambda
  if (relayTokenJson && ownerId) {
    try {
      const tokens = JSON.parse(relayTokenJson);
      await persistMsTokens(ownerId, tokens);
      return NextResponse.redirect(`${base}/dashboard/settings?calendar=outlook_connected`);
    } catch (err) {
      console.error("Microsoft Proxy Relay failed:", err);
      return NextResponse.redirect(`${base}/dashboard/settings?calendar=outlook_error`);
    }
  }

  // 3. Handle Direct OAuth (or fallback)
  if (error || !code || !ownerId) {
    return NextResponse.redirect(`${base}/dashboard/settings?calendar=outlook_error`);
  }

  try {
    await handleMsOAuthCallback(code, ownerId, user.id);
    return NextResponse.redirect(`${base}/dashboard/settings?calendar=outlook_connected`);
  } catch (err: any) {
    console.error("Microsoft OAuth callback failed:", err);
    return NextResponse.redirect(`${base}/dashboard/settings?calendar=outlook_error&reason=${encodeURIComponent(err.message)}`);
  }
}
