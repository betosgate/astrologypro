import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_PORTAL_BASES = [
  "/dashboard",
  "/portal",
  "/community",
  "/trainee",
  "/advocate",
  "/admin",
];

/**
 * POST /api/auth/save-last-portal
 * Body: { url: string }
 *
 * Persists the last visited portal to the diviners table so it survives
 * across devices and browser sessions.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (
      !url ||
      !VALID_PORTAL_BASES.some(
        (base) => url === base || url.startsWith(base + "/")
      )
    ) {
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
      .from("diviners")
      .update({ last_portal_url: url })
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
