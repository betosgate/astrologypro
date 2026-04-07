import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TABS = ["tarot", "birth_chart", "astro_toolkit"] as const;
type Tab = (typeof VALID_TABS)[number];

function problemDetail(
  status: number,
  title: string,
  detail: string
): NextResponse {
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

  return diviner ? { ...diviner, userId: user.id } : null;
}

// GET /api/dashboard/reports/readings
// Query params:
//   tab     — "tarot" | "birth_chart" | "astro_toolkit"  (default: "tarot")
//   cursor  — "ISO_DATE:UUID" keyset cursor
//   limit   — 1–50 (default: 25)
export async function GET(req: NextRequest) {
  const diviner = await getAuthenticatedDiviner();
  if (!diviner)
    return problemDetail(401, "Unauthorized", "Authentication required.");

  const sp = req.nextUrl.searchParams;
  const rawTab = sp.get("tab") ?? "tarot";
  const tab: Tab = VALID_TABS.includes(rawTab as Tab)
    ? (rawTab as Tab)
    : "tarot";
  const cursor = sp.get("cursor");
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? "25")));

  const admin = createAdminClient();

  // Build base query depending on tab
  if (tab === "tarot") {
    let query = admin
      .from("tarot_readings")
      .select(
        "id, user_id, diviner_id, spread_name, cards, notes, created_at"
      )
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      const [cursorDate, cursorId] = cursor.split(":");
      if (cursorDate && cursorId) {
        query = query.or(
          `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`
        );
      }
    }

    const { data, error } = await query;
    if (error)
      return problemDetail(500, "Internal Server Error", error.message);

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0
        ? `${items[items.length - 1].created_at}:${items[items.length - 1].id}`
        : null;

    return NextResponse.json({ readings: items, nextCursor, hasMore, tab });
  }

  if (tab === "birth_chart") {
    let query = admin
      .from("birth_chart_results")
      .select(
        "id, user_id, diviner_id, city_label, birth_day, birth_month, birth_year, created_at"
      )
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      const [cursorDate, cursorId] = cursor.split(":");
      if (cursorDate && cursorId) {
        query = query.or(
          `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`
        );
      }
    }

    const { data, error } = await query;
    if (error)
      return problemDetail(500, "Internal Server Error", error.message);

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && items.length > 0
        ? `${items[items.length - 1].created_at}:${items[items.length - 1].id}`
        : null;

    return NextResponse.json({ readings: items, nextCursor, hasMore, tab });
  }

  // tab === "astro_toolkit"
  let query = admin
    .from("astro_toolkit_readings")
    .select(
      "id, user_id, diviner_id, reading_type, input_data, result_data, created_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const [cursorDate, cursorId] = cursor.split(":");
    if (cursorDate && cursorId) {
      query = query.or(
        `created_at.lt.${cursorDate},and(created_at.eq.${cursorDate},id.lt.${cursorId})`
      );
    }
  }

  const { data, error } = await query;
  if (error) return problemDetail(500, "Internal Server Error", error.message);

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && items.length > 0
      ? `${items[items.length - 1].created_at}:${items[items.length - 1].id}`
      : null;

  return NextResponse.json({ readings: items, nextCursor, hasMore, tab });
}
