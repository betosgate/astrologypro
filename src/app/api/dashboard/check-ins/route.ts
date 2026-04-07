import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, detail },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

// GET /api/dashboard/check-ins?page=1&limit=20&from=&to=
// Auth: authenticated diviner only
// Returns diviner's own check-ins ordered by created_at DESC
// Includes total count for pagination
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return problem(401, "Unauthorized", "Authentication required.");

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) return problem(403, "Forbidden", "Diviner profile not found.");

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const from = sp.get("from");
  const to = sp.get("to");
  const offset = (page - 1) * limit;

  // Count query
  let countQuery = admin
    .from("check_ins")
    .select("id", { count: "exact", head: true })
    .eq("diviner_id", diviner.id);

  if (from) countQuery = countQuery.gte("created_at", from);
  if (to) countQuery = countQuery.lte("created_at", to);

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error("[dashboard/check-ins] count error", countError);
    return problem(500, "Internal Server Error", "Failed to count check-ins.");
  }

  // Data query
  let dataQuery = admin
    .from("check_ins")
    .select(
      "id, first_name, last_name, email, birth_date, birth_city, birth_time, created_at"
    )
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (from) dataQuery = dataQuery.gte("created_at", from);
  if (to) dataQuery = dataQuery.lte("created_at", to);

  const { data, error } = await dataQuery;

  if (error) {
    console.error("[dashboard/check-ins] data error", error);
    return problem(500, "Internal Server Error", "Failed to fetch check-ins.");
  }

  return NextResponse.json({
    checkIns: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
