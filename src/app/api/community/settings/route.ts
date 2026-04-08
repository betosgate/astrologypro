import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/settings
 * Returns public-facing platform settings relevant to community members.
 * Requires an authenticated session (any role).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Authentication required." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("ms_pm_discount_enabled")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[community/settings GET]", error);
    // Non-fatal: default to discount disabled on error
    return NextResponse.json({ ms_pm_discount_enabled: false });
  }

  return NextResponse.json({
    ms_pm_discount_enabled: data?.ms_pm_discount_enabled ?? false,
  });
}
