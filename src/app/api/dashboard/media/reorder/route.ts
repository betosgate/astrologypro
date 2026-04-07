import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problemDetail(status: number, title: string, detail: string): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title, detail, status },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

async function getAuthenticatedDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return diviner ?? null;
}

// POST /api/dashboard/media/reorder
// Body: { items: { id: string, sort_order: number }[] }
// Batch-updates sort_order; enforces ownership by checking all ids belong to the diviner
export async function POST(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner) return problemDetail(401, "Unauthorized", "Authentication required.");

  let body: { items?: unknown };
  try {
    body = await req.json();
  } catch {
    return problemDetail(400, "Bad Request", "Request body must be valid JSON.");
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return problemDetail(422, "Validation Error", "Field 'items' must be a non-empty array.");
  }

  const items = body.items as { id: unknown; sort_order: unknown }[];
  for (const item of items) {
    if (!item.id || typeof item.id !== "string") {
      return problemDetail(422, "Validation Error", "Each item must have a string 'id'.");
    }
    if (typeof item.sort_order !== "number") {
      return problemDetail(422, "Validation Error", "Each item must have a numeric 'sort_order'.");
    }
  }

  const admin = createAdminClient();

  // Verify all ids belong to this diviner (object-level auth)
  const ids = items.map((i) => i.id as string);
  const { data: owned, error: ownErr } = await admin
    .from("media_items")
    .select("id")
    .eq("diviner_id", diviner.id)
    .in("id", ids);

  if (ownErr) {
    return problemDetail(500, "Internal Server Error", ownErr.message);
  }

  const ownedIds = new Set((owned ?? []).map((r) => r.id));
  for (const id of ids) {
    if (!ownedIds.has(id)) {
      return problemDetail(403, "Forbidden", `Item ${id} does not belong to this diviner.`);
    }
  }

  // Batch update — one update per item
  const now = new Date().toISOString();
  const results = await Promise.all(
    items.map((item) =>
      admin
        .from("media_items")
        .update({ sort_order: item.sort_order as number, updated_at: now })
        .eq("id", item.id as string)
    )
  );

  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    console.error("[POST /api/dashboard/media/reorder] partial failure", failed);
    return problemDetail(500, "Internal Server Error", "One or more sort_order updates failed.");
  }

  return NextResponse.json({ ok: true, updated: ids.length });
}
