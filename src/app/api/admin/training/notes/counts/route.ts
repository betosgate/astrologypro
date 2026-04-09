import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/training/notes/counts?entity_type=program|category|lesson|quiz&ids=a,b,c
 *
 * Returns a map of { [entity_id]: count } for the requested entity IDs of a
 * single type. Used by the Training Management table to show a notes count
 * column without issuing N+1 queries. The standardization task (tasks/
 * 08.04.2026/standardization/admin-ui/01) requires notes counts to be
 * first-class in the training management surface.
 *
 * Response (200):
 *   { counts: { [entity_id: string]: number } }
 *
 * Errors:
 *   401 unauth, 400 missing params, 500 db error
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const entity_type = sp.get("entity_type");
  const idsParam = sp.get("ids");

  if (!entity_type) {
    return NextResponse.json(
      { error: "entity_type is required." },
      { status: 400 },
    );
  }
  if (!idsParam) {
    // Empty request is legal — just return an empty map.
    return NextResponse.json({ counts: {} });
  }

  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ counts: {} });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_notes")
    .select("entity_id")
    .eq("entity_type", entity_type)
    .in("entity_id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate in JS — tiny result sets per request (max page size).
  const counts: Record<string, number> = {};
  for (const id of ids) counts[id] = 0;
  for (const row of data ?? []) {
    counts[row.entity_id] = (counts[row.entity_id] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
