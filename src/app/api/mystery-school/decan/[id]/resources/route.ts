import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";
import { requireDecanEligibilityOr403 } from "@/lib/mystery-school/decan-gate";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/decan/[id]/resources
 * Returns published resources for a Decan (PDFs, videos, audio, links).
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
    .from("decan_resources")
    .select(
      "id, decan_id, title, resource_type, url, description, sort_order, published_at, created_at",
    )
    .eq("decan_id", decanId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
