import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { requireDecanEligibilityOr403 } from "@/lib/mystery-school/decan-gate";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/decan/[id]/instructor-journals
 * Returns published instructor journal entries (text/audio/video) for a Decan.
 *
 * Sprint: docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json(
      { error: "Mystery School access required" },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const gate = await requireDecanEligibilityOr403(admin, user.id);
  if (gate) return gate;

  const { id: decanId } = await params;

  const { data, error } = await admin
    .from("decan_instructor_journals")
    .select(
      "id, decan_id, title, entry_type, content, media_url, duration_seconds, instructor_name, published_at, created_at",
    )
    .eq("decan_id", decanId)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
