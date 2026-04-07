import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPortals } from "@/lib/user-roles";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me-portals
 *
 * Returns the list of portals the authenticated user has access to.
 * Used by the unified login page after signInWithPassword to determine
 * where to redirect the user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portals = await getUserPortals(supabase, user.id);

  return NextResponse.json({ portals });
}
