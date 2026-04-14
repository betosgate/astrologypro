import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTrustedPortal } from "@/lib/auth/resolve-login-destination";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/save-last-portal
 * Body: { url: string }
 *
 * Persists the last visited portal to user_portal_preferences so it survives
 * across devices and browser sessions for all role types.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !isTrustedPortal(url)) {
      return NextResponse.json({ error: "Invalid portal URL" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    await admin
      .from("user_portal_preferences")
      .upsert(
        { user_id: user.id, last_portal_url: url, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
