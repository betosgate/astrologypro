import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const entityId = sp.get("entity_id") ?? "";
  const isCurrent = sp.get("is_current") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("mundane_leaders")
    .select(
      "id, full_name, office_title, country_entity_id, office_start_date, office_end_date, is_current, birth_date, birth_location, birth_data_confidence, tags",
      { count: "exact" }
    )
    .eq("is_public", true);

  if (entityId) {
    query = query.eq("country_entity_id", entityId);
  }
  if (isCurrent === "true") {
    query = query.eq("is_current", true);
  } else if (isCurrent === "false") {
    query = query.eq("is_current", false);
  }

  query = query
    .order("full_name", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    leaders: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + limit < (count ?? 0),
  });
}
